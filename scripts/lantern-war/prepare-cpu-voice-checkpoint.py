"""Stream an official fp32 safetensors checkpoint to CPU bf16 without loading it all.

Keep the official tokenizer directory beside the output checkpoint. The source is
preserved; this only reduces the memory needed to load the same model on CPU.
"""
import argparse
import json
import struct
from pathlib import Path

import numpy as np
import torch

parser = argparse.ArgumentParser()
parser.add_argument('--source', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
if args.source.resolve() == args.output.resolve() or args.output.exists():
    parser.error('Output must be a new file distinct from the source')
torch.set_num_threads(2)
with args.source.open('rb') as source:
    size = struct.unpack('<Q', source.read(8))[0]
    header = json.loads(source.read(size))
    data_start = 8 + size
    converted, offset = {}, 0
    for key, value in header.items():
        if key == '__metadata__':
            converted[key] = value
            continue
        if value['dtype'] != 'F32':
            raise ValueError('Expected official fp32 weights: ' + key)
        length = (value['data_offsets'][1] - value['data_offsets'][0]) // 2
        converted[key] = {**value, 'dtype': 'BF16', 'data_offsets': [offset, offset + length]}
        offset += length
    encoded = json.dumps(converted, separators=(',', ':')).encode()
    encoded += b' ' * (-len(encoded) % 8)
    with args.output.open('xb') as output:
        output.write(struct.pack('<Q', len(encoded)))
        output.write(encoded)
        for key, value in header.items():
            if key == '__metadata__':
                continue
            start, end = value['data_offsets']
            source.seek(data_start + start)
            remaining = end - start
            while remaining:
                block = source.read(min(4 * 1024 * 1024, remaining))
                if not block:
                    raise ValueError('Truncated checkpoint')
                remaining -= len(block)
                tensor = torch.from_numpy(np.frombuffer(block, dtype=np.float32).copy())
                output.write(tensor.to(torch.bfloat16).view(torch.int16).numpy().tobytes())
print('Prepared CPU bf16 checkpoint:', args.output)

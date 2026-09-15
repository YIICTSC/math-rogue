from pathlib import Path
import base64, sys, hashlib
try:
    import ctypes
    from ctypes import wintypes
    kernel32 = ctypes.WinDLL('kernel32', use_last_error=True)
    STD_INPUT_HANDLE = -10
    ENABLE_ECHO_INPUT = 0x0004
    h = kernel32.GetStdHandle(STD_INPUT_HANDLE)
    mode = wintypes.DWORD()
    if kernel32.GetConsoleMode(h, ctypes.byref(mode)):
        kernel32.SetConsoleMode(h, mode.value & ~ENABLE_ECHO_INPUT)
except Exception:
    pass
parts=[]
for line in sys.stdin:
    line=line.strip()
    if line == '__END__':
        break
    if line:
        parts.append(line)
data=base64.b64decode(''.join(parts))
out=Path('_generated/problem-illustration-selected-tiny.zip')
out.write_bytes(data)
print(f'WROTE {out} {len(data)} sha256={hashlib.sha256(data).hexdigest()}')

"""Render the original Knowledge Travelers score. Requires Python 3 and FFmpeg."""
from array import array
from math import exp, pi, sin, tanh
from pathlib import Path
from subprocess import run
from tempfile import TemporaryDirectory
from wave import open as wave_open

# Scene, pulse, tonic, palette, melodic cell and four harmony roots.
SCORE = (
    ("title", 0.34, 62, "bell", (0, 4, 7, 9, 7, 4, 2, 4), (0, -3, -5, 2)),
    ("main", 0.31, 62, "reed", (0, 4, 7, 11, 9, 7, 4, 2), (0, -3, -5, 0)),
    ("opening", 0.45, 59, "bell", (0, 7, 5, 4, 2, 4, 7, 9), (0, -5, -7, 2)),
    ("world", 0.28, 67, "reed", (0, 2, 4, 7, 9, 7, 4, 7), (0, -5, -3, 2)),
    ("village", 0.36, 65, "pluck", (0, 4, 5, 7, 4, 2, 0, -3), (0, -5, -3, 2)),
    ("city", 0.25, 62, "pluck", (0, 7, 9, 4, 2, 5, 4, 7), (0, -3, -7, -5)),
    ("castle", 0.40, 60, "reed", (0, 7, 12, 7, 4, 11, 9, 7), (0, 2, -5, -3)),
    ("forest", 0.37, 70, "bell", (0, -3, 0, 2, 7, 4, 2, -3), (0, -5, -8, 2)),
    ("cave", 0.39, 58, "bell", (0, 3, 6, 7, 10, 7, 6, 3), (0, -2, 3, -5)),
    ("academy", 0.28, 64, "bell", (0, 4, 9, 11, 7, 4, 6, 2), (0, 2, -3, -5)),
    ("sea", 0.30, 62, "pluck", (7, 9, 12, 7, 4, 5, 7, 2), (0, -5, 2, -3)),
    ("underwater", 0.46, 63, "bell", (0, 7, 10, 12, 7, 3, 7, 5), (0, -2, -5, -7)),
    ("airship", 0.27, 66, "reed", (0, 7, 11, 12, 16, 12, 7, 4), (0, 2, -3, -5)),
    ("sky", 0.38, 65, "bell", (0, 4, 9, 11, 12, 9, 7, 4), (0, -3, -5, 2)),
    ("battle", 0.22, 64, "pulse", (0, 3, 7, 5, 7, 10, 12, 10), (0, 3, -2, -5)),
    ("strong", 0.22, 60, "pulse", (0, 7, 6, 3, 7, 9, 10, 3), (0, 3, -2, -7)),
    ("boss", 0.24, 62, "reed", (0, 6, 7, 3, 10, 7, 14, 12), (0, -2, 3, -5)),
    ("final", 0.23, 59, "pulse", (0, 3, 7, 11, 10, 7, 5, 3), (0, -5, -2, 3)),
    ("victory", 0.27, 65, "reed", (0, 4, 7, 12, 9, 12, 16, 12), (0, -3, 2, 0)),
    ("job", 0.22, 65, "bell", (0, 2, 7, 4, 9, 7, 11, 12), (0, -5, 2, 0)),
    ("treasure", 0.24, 67, "bell", (0, 7, 12, 11, 9, 12, 16, 19), (0, -3, -5, 0)),
    ("sorrow", 0.51, 60, "pluck", (7, 5, 3, 0, -2, 3, 0, -5), (0, -2, 3, 0)),
    ("reunion", 0.41, 64, "reed", (0, 4, 5, 7, 9, 12, 7, 4), (0, -5, 2, -3)),
    ("ending", 0.46, 62, "reed", (0, 4, 7, 9, 12, 9, 7, 4), (0, -3, -5, 0)),
    ("post", 0.34, 64, "pluck", (0, 7, 10, 12, 10, 7, 5, 3), (0, 3, -2, -5)),
)

RATE = 22050
PALETTE = {
    "bell": ((1, 1), (2, 0.13), (3, 0.16), (5, 0.06)),
    "reed": ((1, 1), (2, 0.16), (3, 0.19), (4, 0.05)),
    "pluck": ((1, 1), (2, 0.25), (3, 0.14), (5, 0.09)),
    "pulse": ((1, 1), (3, 0.30), (5, 0.18), (7, 0.11)),
    "bass": ((1, 1), (2, 0.22)),
    "strings": ((1, 1), (2, 0.10), (3, 0.05)),
}


def render(track, dest):
    scene, pulse, key, palette, motif, roots = track
    minor = scene in {"cave", "underwater", "battle", "strong", "boss", "final", "sorrow"}
    rhythm = scene in {"city", "world", "sea", "airship", "battle", "strong", "boss", "final"}
    total = int(RATE * 48 * pulse)
    left = [0.0] * total
    right = [0.0] * total

    def note(start, length, pitch, timbre, level, pan):
        offset = round(start * pulse * RATE)
        duration = length * pulse
        hz = 440 * 2 ** ((pitch - 69) / 12)
        attack = 0.053 if timbre == "strings" else 0.013
        decay = 3.9 if timbre in ("bell", "pluck") else 1.9
        harmonics = [(2 * pi * hz * n / RATE, v) for n, v in PALETTE[timbre] if hz * n < RATE / 2]
        for j in range(round(RATE * duration)):
            k = (offset + j) % total
            t = j / RATE
            env = min(1, t / attack) * exp(-decay * t / duration) * min(1, (duration - t) / .06)
            sample = level * env * sum(sin(j * freq) * amt for freq, amt in harmonics)
            left[k] += sample * (1 - pan)
            right[k] += sample * pan

    for measure in range(8):
        start = measure * 6
        root = roots[(measure + (measure >= 4)) % 4]
        chord = (0, 3 if minor else 4, 7, 10 if minor else 11)
        for i, change in enumerate((0, 0, 7)):
            note(start + i * 2, 1.82, key + root - 24 + change, "bass", .10, .5)
        for i in range(6):
            step = (i + (measure & 1)) % 4
            note(start + i, 1.38, key + root - 12 + chord[step], "pluck", .058, .72)
        for i in (1, 2):
            note(start, 5.8, key + root - 12 + chord[i], "strings", .039, .39)
        melody = motif[measure % 2 * 4:measure % 2 * 4 + 4]
        for slot, pitch in zip((0, 1.5, 3, 4.5), melody):
            shift = (root if measure in (2, 4, 6) else 0) + (12 if measure == 5 else 0)
            note(start + slot, 1.43 if slot != 4.5 else 1.75, key + pitch + shift, palette, .125, .36)
        if rhythm:
            for tick in range(6):
                offset = int((start + tick) * pulse * RATE)
                for j in range(1500):
                    t = j / RATE
                    value = (sin(2*pi*(79 - 160*t)*t) if tick % 3 == 0 else ((j*137 % 173) - 86) / 86) * exp(-t * 59)
                    left[(offset+j) % total] += value * .027
                    right[(offset+j) % total] += value * .027
    pcm = array("h")
    delay = int(RATE * pulse * .76)
    for i in range(total):
        pcm.append(int(27200 * tanh((left[i] + .18 * right[(i-delay) % total]) * 1.7)))
        pcm.append(int(27200 * tanh((right[i] + .18 * left[(i-delay) % total]) * 1.7)))
    with TemporaryDirectory() as temp:
        raw = Path(temp) / "music.wav"
        with wave_open(str(raw), "wb") as out:
            out.setparams((2, 2, RATE, total, "NONE", "not compressed"))
            out.writeframes(pcm.tobytes())
        run(["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-i", str(raw), "-b:a", "48k", str(dest)], check=True)


if __name__ == "__main__":
    target = Path(__file__).resolve().parents[2] / "public" / "bgm-new" / "pixel-rpg"
    target.mkdir(parents=True, exist_ok=True)
    for track in SCORE:
        render(track, target / f"{track[0]}.mp3")

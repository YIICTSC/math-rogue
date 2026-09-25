import { spawn } from 'node:child_process';

// Explicit opt-in, also works on Windows where NAME=value is not a shell command.
const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '0.0.0.0', '--port', '5173', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, VITE_ENABLE_DEBUG_FEATURES: 'true' },
});
child.on('exit', code => { process.exitCode = code ?? 1; });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });

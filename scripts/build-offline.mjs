import { build } from 'vite';

process.env.VITE_OFFLINE_DISTRIBUTABLE = 'true';

await build();

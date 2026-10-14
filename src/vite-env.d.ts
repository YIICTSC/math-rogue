/// <reference types="vite/client" />

interface Window {
  __MAP_DEBUG?: { connections: { from: string; to: string }[]; reachable: string[]; available: string[]; nodes: import("./types").MapNode[] };
}

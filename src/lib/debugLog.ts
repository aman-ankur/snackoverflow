/** In-memory debug log buffer for on-screen diagnostics (temporary). */

type LogEntry = { t: string; msg: string };

const MAX_ENTRIES = 80;
const buffer: LogEntry[] = [];
let listeners: Array<() => void> = [];

function ts(): string {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}.${d.getMilliseconds().toString().padStart(3, "0")}`;
}

export function dlog(msg: string) {
  const entry = { t: ts(), msg };
  buffer.push(entry);
  if (buffer.length > MAX_ENTRIES) buffer.shift();
  console.log(`[DBG ${entry.t}] ${msg}`);
  listeners.forEach((fn) => fn());
}

export function getDebugLogs(): LogEntry[] {
  return buffer;
}

export function subscribeDebugLogs(fn: () => void): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((f) => f !== fn);
  };
}

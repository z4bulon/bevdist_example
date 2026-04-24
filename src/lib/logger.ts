type Level = "INFO" | "WARN" | "ERROR" | "DEBUG";

function log(level: Level, message: string, meta?: Record<string, unknown>) {
  const ts = new Date().toISOString();
  const metaStr = meta ? " " + JSON.stringify(meta) : "";
  // eslint-disable-next-line no-console
  console.log(`[${ts}] [${level.padEnd(5)}] ${message}${metaStr}`);
}

export const logger = {
  info:  (msg: string, meta?: Record<string, unknown>) => log("INFO",  msg, meta),
  warn:  (msg: string, meta?: Record<string, unknown>) => log("WARN",  msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log("ERROR", msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => log("DEBUG", msg, meta),
};

export function startTimer(label: string) {
  const t0 = Date.now();
  return function done(status: number) {
    const ms = Date.now() - t0;
    const level: Level = status >= 500 ? "ERROR" : status >= 400 ? "WARN" : "INFO";
    log(level, `${label} → ${status} (${ms}ms)`);
  };
}

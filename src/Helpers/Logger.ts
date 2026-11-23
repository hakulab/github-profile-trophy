let loggingEnabled = true;

export function setLoggingEnabled(enabled: boolean): void {
  loggingEnabled = enabled;
}

export const Logger = {
  log(message: unknown): void {
    if (!loggingEnabled) {
      return;
    }
    console.log(message);
  },

  error(message: unknown): void {
    if (!loggingEnabled) {
      return;
    }
    console.error(message);
  },

  warn(message: unknown): void {
    if (!loggingEnabled) {
      return;
    }
    console.warn(message);
  },
};

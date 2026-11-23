import { ServiceError } from '../Types/index';
import { Logger } from './Logger';

export interface RetryCallbackProps {
  attempt: number;
}

type CallbackType<T = unknown> = (data: RetryCallbackProps) => Promise<T> | T;

async function* createAsyncIterable<T>(
  callback: CallbackType<T>,
  retries: number,
  delay: number,
): AsyncGenerator<T | ServiceError | null, void, unknown> {
  for (let i = 0; i < retries; i++) {
    const isLastAttempt = i === retries - 1;
    try {
      const data = await callback({ attempt: i });
      yield data;
      return;
    } catch (e) {
      if (e instanceof ServiceError && isLastAttempt) {
        yield e;
        return;
      }

      yield null;
      Logger.error(e);
      if (!isLastAttempt && delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
}

export class Retry {
  constructor(
    private maxRetries = 2,
    private retryDelay = 1000,
  ) {}

  async fetch<T = unknown>(callback: CallbackType<T>): Promise<T> {
    let lastError: Error | null = null;
    for await (const callbackResult of createAsyncIterable<T>(
      callback,
      this.maxRetries,
      this.retryDelay,
    )) {
      const isError = callbackResult instanceof Error;

      if (callbackResult && !isError) {
        return callbackResult;
      }

      if (isError) {
        lastError = callbackResult;
      }
    }

    throw new Error(`Max retries (${this.maxRetries}) exceeded.`, {
      cause: lastError,
    });
  }
}

import { describe, expect, it, vi } from 'vitest';

import { setLoggingEnabled } from '../Logger';
import { Retry } from '../Retry';

setLoggingEnabled(false);

interface MockResponse {
  value: number;
}

describe('Retry', () => {
  it('calls fetch and returns result on first try', async () => {
    const retryInstance = new Retry(2, 0);
    const fetchSpy = vi.spyOn(retryInstance, 'fetch');

    const result = await retryInstance.fetch<MockResponse>(() => ({ value: 1 }));

    expect(result).toEqual({ value: 1 });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('retries synchronous throwing callbacks up to maxRetries', async () => {
    let countErrors = 0;

    const callbackError = () => {
      countErrors++;
      throw new Error('Panic! Threw Error');
    };
    const retries = 3;
    const retryInstance = new Retry(retries, 0);

    await expect(retryInstance.fetch<MockResponse>(callbackError)).rejects.toThrow(
      `Max retries (${retries}) exceeded.`,
    );
    expect(countErrors).toBe(3);
  });

  it('retries asynchronous rejecting callbacks up to maxRetries', async () => {
    let countErrors = 0;
    const callbackError = async () => {
      countErrors++;
      await new Promise((_, reject) =>
        setTimeout(() => {
          reject(new Error('boom'));
        }, 10),
      );
    };

    const retries = 3;
    const retryInstance = new Retry(retries, 0);

    await expect(retryInstance.fetch(callbackError)).rejects.toThrow(
      `Max retries (${retries}) exceeded.`,
    );
    expect(countErrors).toBe(3);
  });
});

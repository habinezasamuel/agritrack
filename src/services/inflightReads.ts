/** Share simultaneous reads only; completed data is never cached. */
export class InflightReads {
  private requests = new Map<string, Promise<unknown>>();

  run<T>(key: string, read: () => Promise<T>): Promise<T> {
    const existing = this.requests.get(key);
    if (existing) return existing as Promise<T>;
    const request = Promise.resolve().then(read);
    this.requests.set(key, request);
    void request.finally(() => {
      if (this.requests.get(key) === request) this.requests.delete(key);
    }).catch(() => {});
    return request;
  }
}

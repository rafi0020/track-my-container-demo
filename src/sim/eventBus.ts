export type Unsubscribe = () => void;

export class EventBus<TEvents extends Record<string, unknown>> {
  private handlers: { [K in keyof TEvents]?: Array<(payload: TEvents[K]) => void> } = {};

  on<K extends keyof TEvents>(event: K, handler: (payload: TEvents[K]) => void): Unsubscribe {
    const arr = this.handlers[event] ?? [];
    arr.push(handler);
    this.handlers[event] = arr;
    return () => {
      const cur = this.handlers[event] ?? [];
      this.handlers[event] = cur.filter((h) => h !== handler);
    };
  }

  emit<K extends keyof TEvents>(event: K, payload: TEvents[K]) {
    const arr = this.handlers[event] ?? [];
    for (const h of arr) h(payload);
  }

  clear() {
    this.handlers = {};
  }
}

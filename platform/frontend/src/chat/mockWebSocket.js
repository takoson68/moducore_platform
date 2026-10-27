export function createMockWebSocketPair() {
  const sockets = []
  class MockWebSocket {
    static OPEN = 1
    static CLOSED = 3
    constructor(url) {
      this.url = url
      this.readyState = 0
      this.listeners = new Map()
      this.sent = []
      sockets.push(this)
      queueMicrotask(() => {
        this.readyState = MockWebSocket.OPEN
        this._emit('open', {})
      })
    }
    addEventListener(type, handler) {
      if (!this.listeners.has(type)) this.listeners.set(type, new Set())
      this.listeners.get(type).add(handler)
    }
    send(value) { this.sent.push(value) }
    close() { this.readyState = MockWebSocket.CLOSED; this._emit('close', {}) }
    _emit(type, event) { for (const handler of this.listeners.get(type) || []) handler(event) }
  }
  return { WebSocketImpl: MockWebSocket, sockets }
}

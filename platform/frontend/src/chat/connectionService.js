export class ConnectionService {
  constructor({ url, WebSocketImpl = globalThis.WebSocket, onEvent, onStatus, onError, reconnect = true } = {}) {
    if (!url) throw new TypeError('[Chat] 缺少 WebSocket URL')
    if (typeof WebSocketImpl !== 'function') throw new TypeError('[Chat] 找不到 WebSocket 實作')
    this.url = url
    this.WebSocketImpl = WebSocketImpl
    this.onEvent = onEvent
    this.onStatus = onStatus
    this.onError = onError
    this.reconnect = reconnect
    this.socket = null
    this.timer = null
    this.stopped = true
    this.attempt = 0
  }

  start() {
    if (!this.stopped && this.socket) return
    this.stopped = false
    this._connect()
  }

  stop() {
    this.stopped = true
    if (this.timer !== null) clearTimeout(this.timer)
    this.timer = null
    const socket = this.socket
    this.socket = null
    if (socket && typeof socket.close === 'function') socket.close()
    this.onStatus?.('stopped', this.attempt)
  }

  send(event) {
    if (!this.socket || this.socket.readyState !== this.WebSocketImpl.OPEN) {
      throw new Error('[Chat] WebSocket 尚未連線')
    }
    this.socket.send(JSON.stringify(event))
  }

  _connect() {
    if (this.stopped) return
    this.onStatus?.('connecting', this.attempt)
    const socket = new this.WebSocketImpl(this.url)
    this.socket = socket
    socket.addEventListener?.('open', () => {
      this.attempt = 0
      this.onStatus?.('connected', 0)
    })
    socket.addEventListener?.('message', event => {
      try {
        this.onEvent?.(JSON.parse(event.data))
      } catch {
        this.onError?.(new Error('Chat 收到無效 JSON'))
      }
    })
    socket.addEventListener?.('error', error => this.onError?.(error))
    socket.addEventListener?.('close', () => {
      if (this.socket === socket) this.socket = null
      if (this.stopped || !this.reconnect) return
      this.attempt += 1
      const delay = Math.min(30000, 500 * (2 ** Math.min(this.attempt - 1, 6)))
      this.onStatus?.('reconnecting', this.attempt)
      this.timer = setTimeout(() => { this.timer = null; this._connect() }, delay)
    })
  }

  dispose() {
    this.stop()
    this.onEvent = null
    this.onStatus = null
    this.onError = null
  }
}

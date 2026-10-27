import { createClientEvent } from '../../../chat-contract/index.js'

export class MessageService {
  constructor({ roomId = 'public', connection, store } = {}) {
    this.roomId = roomId
    this.connection = connection
    this.store = store
    this.pendingAcks = new Map()
  }

  join() {
    this._connection().send(createClientEvent('chat.join', this._requestId(), { roomId: this.roomId }))
  }

  sendMessage(content) {
    const requestId = this._requestId()
    this._connection().send(createClientEvent('chat.message.send', requestId, { roomId: this.roomId, content }))
    return requestId
  }

  ping() {
    this._connection().send(createClientEvent('chat.ping', this._requestId()))
  }

  receive(event) {
    if (!event || typeof event.type !== 'string') return
    if (event.type === 'chat.message.created') this.store.addMessage(event.payload)
    if (event.type === 'chat.error') this.store.addError(event.error?.message || 'Chat 事件錯誤')
    if (event.type === 'chat.message.ack' && event.requestId) this.pendingAcks.delete(event.requestId)
  }

  dispose() {
    this.pendingAcks.clear()
  }

  _requestId() {
    return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  }

  _connection() {
    return typeof this.connection === 'function' ? this.connection() : this.connection
  }
}

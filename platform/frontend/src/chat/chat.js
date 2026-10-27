import { Container } from '../app/container/container.js'
import { MessageStore } from './messageStore.js'
import { ConnectionService } from './connectionService.js'
import { MessageService } from './messageService.js'

export class Chat {
  constructor({ url, roomId = 'public', WebSocketImpl = globalThis.WebSocket, maxMessages = 100, reconnect = true } = {}) {
    this.phase = 'idle'
    this.container = new Container({ services: {} })
    this.options = { url, roomId, WebSocketImpl, maxMessages, reconnect }
    this._register()
  }

  _register() {
    this.container.register('stores:messages', () => new MessageStore({ maxMessages: this.options.maxMessages }))
    this.container.register('services:connection', () => {
      const store = this.store('messages')
      const service = this.service('messages')
      return new ConnectionService({
        url: this.options.url,
        WebSocketImpl: this.options.WebSocketImpl,
        reconnect: this.options.reconnect,
        onEvent: event => service.receive(event),
        onStatus: (status, attempt) => store.setConnectionStatus(status, attempt),
        onError: error => store.addError(error),
      })
    })
    this.container.register('services:messages', () => new MessageService({
      roomId: this.options.roomId,
      connection: () => this.service('connection'),
      store: this.store('messages'),
    }))
  }

  start() {
    if (this.phase === 'running') return
    if (this.phase === 'disposed') throw new Error('[Chat] 已 dispose，請建立新實例')
    this.phase = 'running'
    this.service('connection').start()
  }

  stop() {
    if (this.phase === 'disposed') return
    this.service('connection').stop()
    this.phase = 'stopped'
  }

  store(name) {
    return this.container.resolve(`stores:${name}`)
  }

  service(name) {
    return this.container.resolve(`services:${name}`)
  }

  dispose() {
    if (this.phase === 'disposed') return
    this.container.destroy()
    this.phase = 'disposed'
  }

  list() {
    return this.container.list()
  }
}

export default Chat

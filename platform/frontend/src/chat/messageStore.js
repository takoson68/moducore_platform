import { createStore } from '../app/stores/_storeFactory.js'

const DEFAULT_STATE = {
  connectionStatus: 'idle',
  messages: [],
  errors: [],
  reconnectAttempt: 0,
  lastMessageAt: null,
}

export class MessageStore {
  constructor({ maxMessages = 100 } = {}) {
    this.maxMessages = Math.max(1, Math.floor(maxMessages))
    this.store = createStore({ name: 'platform-chat:messages', defaultValue: DEFAULT_STATE })
  }

  get state() {
    return this.store.state
  }

  setConnectionStatus(connectionStatus, reconnectAttempt = 0) {
    this.store.set({ ...this.store.get(), connectionStatus, reconnectAttempt })
  }

  addError(error) {
    const message = typeof error === 'string' ? error : error?.message || 'Chat 連線錯誤'
    const current = this.store.get()
    this.store.set({ ...current, errors: [...current.errors, message].slice(-10) })
  }

  addMessage(message) {
    if (!message?.messageId) return false
    const current = this.store.get()
    if (current.messages.some(item => item.messageId === message.messageId)) return false
    const messages = [...current.messages, message]
      .sort((left, right) => (left.sequence || 0) - (right.sequence || 0))
      .slice(-this.maxMessages)
    this.store.set({ ...current, messages, lastMessageAt: message.serverTime || Date.now() })
    return true
  }

  clear() {
    this.store.clear()
  }

  dispose() {
    this.store.clear()
  }
}

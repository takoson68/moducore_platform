import { createStore } from '../app/stores/_storeFactory.js'

const DEFAULT_STATE = {
  connectionStatus: 'idle',
  identity: null,
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

  setIdentity(identity) {
    this.store.set({ ...this.store.get(), identity })
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
    const lastMessage = current.messages[current.messages.length - 1]
    const arrivesInOrder = !lastMessage || (message.sequence || 0) >= (lastMessage.sequence || 0)
    const messages = arrivesInOrder
      ? [...current.messages, message].slice(-this.maxMessages)
      : [...current.messages, message]
          .sort((left, right) => (left.sequence || 0) - (right.sequence || 0))
          .slice(-this.maxMessages)
    this.store.set({ ...current, messages, lastMessageAt: message.serverTime || Date.now() })
    return true
  }

  addMessages(batch) {
    if (!Array.isArray(batch) || batch.length === 0) return 0
    const current = this.store.get()
    const seen = new Set(current.messages.map(item => item.messageId))
    const additions = batch.filter(item => item?.messageId && !seen.has(item.messageId))
    if (additions.length === 0) return 0
    const messages = [...current.messages, ...additions]
      .sort((left, right) => (left.sequence || 0) - (right.sequence || 0))
      .slice(-this.maxMessages)
    const last = messages[messages.length - 1]
    this.store.set({ ...current, messages, lastMessageAt: last?.serverTime || current.lastMessageAt })
    return additions.length
  }

  clear() {
    this.store.clear()
  }

  dispose() {
    this.store.clear()
  }
}

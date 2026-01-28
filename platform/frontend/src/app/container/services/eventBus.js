//- src/app/container/services/eventBus.js
export function createEventBus() {
  const handlers = new Map()

  return {
    on(eventType, handler) {
      if (!eventType || typeof handler !== 'function') return
      const bucket = handlers.get(eventType) ?? new Set()
      bucket.add(handler)
      handlers.set(eventType, bucket)
    },
    off(eventType, handler) {
      const bucket = handlers.get(eventType)
      if (!bucket || !handler) return
      bucket.delete(handler)
      if (bucket.size === 0) {
        handlers.delete(eventType)
      }
    },
    emit(eventType, payload) {
      const bucket = handlers.get(eventType)
      if (!bucket) return
      for (const handler of [...bucket]) {
        try {
          handler(payload)
        } catch (err) {
          console.error('[EventBus] handler error', err)
        }
      }
    },
  }
}

import world from '@/world.js'
import { createPrivateChatMessageRepository } from './messageRepository.js'
import { randomId } from './randomId.js'

const ROOM_LIST_KEY = 'chatCore:privateChatLab:roomList'
const DEVICE_ID_KEY = 'chatCore:privateChatLab:deviceId'

function normalizeRoomList(value) {
  if (!Array.isArray(value)) return []
  return value
    .filter(room => room && typeof room.id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(room.id))
    .slice(0, 30)
}

export function createPrivateChatLabStore() {
  const messageRepository = createPrivateChatMessageRepository()
  return world.createStore({
    name: 'chatCorePrivateChatLabStore',
    defaultValue: {
      roomList: [],
      messages: [],
      pendingOutbox: [],
      deviceId: '',
      hydrated: false
    },
    actions: {
      exportSnapshot() {
        return messageRepository.exportSnapshot()
      },
      restoreSnapshot(_store, snapshot) {
        return messageRepository.restoreSnapshot(snapshot)
      },
      async hydrate(store) {
        if (store.get().hydrated) return
        const storage = world.services.storage()
        const [roomList, deviceId] = await Promise.all([
          storage.get(ROOM_LIST_KEY),
          storage.get(DEVICE_ID_KEY)
        ])
        store.set({
          ...store.get(),
          roomList: normalizeRoomList(roomList),
          deviceId: typeof deviceId === 'string' ? deviceId : '',
          hydrated: true
        })
      },
      async rememberRoom(store, id) {
        await store.hydrate()
        const roomList = normalizeRoomList([
          { id, lastUsedAt: Date.now() },
          ...store.get().roomList.filter(room => room.id !== id)
        ])
        await world.services.storage().set(ROOM_LIST_KEY, roomList)
        store.set({ ...store.get(), roomList })
      },
      async getDeviceId(store) {
        await store.hydrate()
        const current = store.get().deviceId
        if (current && /^[0-9a-f-]{36}$/i.test(current)) return current
        const deviceId = randomId()
        await world.services.storage().set(DEVICE_ID_KEY, deviceId)
        store.set({ ...store.get(), deviceId })
        return deviceId
      }
    }
  })
}

export const CHAT_PROTOCOL_VERSION = 1
export const CHAT_DEFAULT_ROOM_ID = 'public'
export const CHAT_MAX_CONTENT_LENGTH = 300
export const CHAT_MAX_REQUEST_ID_LENGTH = 96

export const CLIENT_EVENT_TYPES = Object.freeze([
  'chat.join',
  'chat.message.send',
  'chat.ping',
])

export const SERVER_EVENT_TYPES = Object.freeze([
  'chat.ready',
  'chat.message.ack',
  'chat.message.created',
  'chat.error',
  'chat.pong',
  'chat.history',
])

const CLIENT_EVENT_SET = new Set(CLIENT_EVENT_TYPES)

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function hasOnlyKeys(value, allowed) {
  return Object.keys(value).every((key) => allowed.includes(key))
}

function validText(value, maxLength) {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength &&
    !/[\u0000-\u001f\u007f]/.test(value)
}

export function isValidProjectId(projectId) {
  return typeof projectId === 'string' && /^[a-z0-9][a-z0-9-]{0,49}$/.test(projectId)
}

export function isValidRoomId(roomId) {
  return typeof roomId === 'string' && /^[a-z0-9][a-z0-9:_-]{0,63}$/.test(roomId)
}

export function roomNamespace(projectId, roomId = CHAT_DEFAULT_ROOM_ID) {
  if (!isValidProjectId(projectId)) throw new TypeError('INVALID_PROJECT_ID')
  if (!isValidRoomId(roomId)) throw new TypeError('INVALID_ROOM_ID')
  return `${projectId}:${roomId}`
}

export function validateClientEvent(value) {
  if (!isRecord(value)) return failure('INVALID_EVENT', '事件必須是物件')
  if (!hasOnlyKeys(value, ['version', 'type', 'requestId', 'payload'])) {
    return failure('UNKNOWN_FIELD', '事件包含未知欄位')
  }
  if (value.version !== CHAT_PROTOCOL_VERSION) return failure('UNSUPPORTED_VERSION', '不支援的協定版本')
  if (!CLIENT_EVENT_SET.has(value.type)) return failure('UNKNOWN_EVENT', '不支援的客戶端事件')
  if (!validText(value.requestId, CHAT_MAX_REQUEST_ID_LENGTH)) {
    return failure('INVALID_REQUEST_ID', 'requestId 格式錯誤')
  }
  if (!isRecord(value.payload)) return failure('INVALID_PAYLOAD', 'payload 必須是物件')

  if (value.type === 'chat.join') {
    if (!hasOnlyKeys(value.payload, ['roomId']) || !isValidRoomId(value.payload.roomId)) {
      return failure('INVALID_ROOM_ID', 'roomId 格式錯誤')
    }
  }

  if (value.type === 'chat.message.send') {
    if (!hasOnlyKeys(value.payload, ['roomId', 'content']) ||
        !isValidRoomId(value.payload.roomId) ||
        !validText(value.payload.content, CHAT_MAX_CONTENT_LENGTH) ||
        !value.payload.content.trim()) {
      return failure('INVALID_MESSAGE', '訊息格式錯誤')
    }
  }

  if (value.type === 'chat.ping' && !hasOnlyKeys(value.payload, [])) {
    return failure('UNKNOWN_FIELD', 'ping 不接受 payload 欄位')
  }

  return { ok: true, value }
}

export function createClientEvent(type, requestId, payload = {}) {
  const event = { version: CHAT_PROTOCOL_VERSION, type, requestId, payload }
  const result = validateClientEvent(event)
  if (!result.ok) throw new TypeError(result.error.code)
  return event
}

function failure(code, message) {
  return { ok: false, error: { code, message } }
}

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CHAT_PROTOCOL_VERSION,
  createClientEvent,
  roomNamespace,
  validateClientEvent,
} from './index.js'

test('建立合法的公共頻道訊息事件', () => {
  const event = createClientEvent('chat.message.send', 'req-001', {
    roomId: 'public',
    content: '大家好',
  })

  assert.equal(event.version, CHAT_PROTOCOL_VERSION)
  assert.equal(validateClientEvent(event).ok, true)
})

test('拒絕客戶端偽造伺服器身分與時間欄位', () => {
  const result = validateClientEvent({
    version: CHAT_PROTOCOL_VERSION,
    type: 'chat.message.send',
    requestId: 'req-002',
    senderId: 'admin',
    payload: { roomId: 'public', content: '不應接受' },
  })

  assert.equal(result.ok, false)
  assert.equal(result.error.code, 'UNKNOWN_FIELD')
})

test('拒絕未知版本、未知事件與超長訊息', () => {
  assert.equal(validateClientEvent({ version: 2, type: 'chat.ping', requestId: 'a', payload: {} }).error.code,
    'UNSUPPORTED_VERSION')
  assert.equal(validateClientEvent({ version: 1, type: 'chat.admin.broadcast', requestId: 'a', payload: {} }).error.code,
    'UNKNOWN_EVENT')
  assert.equal(validateClientEvent({ version: 1, type: 'chat.message.send', requestId: 'a',
    payload: { roomId: 'public', content: 'x'.repeat(301) } }).error.code, 'INVALID_MESSAGE')
})

test('projectId 與 roomId 組成隔離 namespace', () => {
  assert.equal(roomNamespace('magic-siege', 'public'), 'magic-siege:public')
  assert.notEqual(roomNamespace('magic-siege', 'public'), roomNamespace('project-b', 'public'))
  assert.throws(() => roomNamespace('Magic Siege', 'public'), /INVALID_PROJECT_ID/)
})

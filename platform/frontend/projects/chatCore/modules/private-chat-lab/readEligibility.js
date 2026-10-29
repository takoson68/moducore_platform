export function canMarkMessageRead({ pageVisible, chatVisible, messageVisible, persisted, alreadyRead }) {
  return pageVisible && chatVisible && messageVisible && persisted && !alreadyRead
}

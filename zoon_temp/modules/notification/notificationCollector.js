const mapping = {
  "task.created": (payload) => ({
    type: "task",
    title: "新增任務",
    content: `任務「${payload?.title || "未命名"}」已建立`,
  }),
  "task.completed": (payload) => ({
    type: "task",
    title: "任務完成",
    content: `任務「${payload?.title || "未命名"}」已標記為完成`,
  }),
  "member.added": (payload) => ({
    type: "member",
    title: "新增成員",
    content: `新增成員「${payload?.name || "未命名"}」`,
  }),
  "booking.completed": () => ({
    type: "booking",
    title: "預約完成",
    content: "預約已建立",
  }),
  "ads.push": (payload) => ({
    type: "ads",
    title: "行銷推播",
    content: payload?.content || "行銷訊息",
  }),
  "system.info": (payload) => ({
    type: "system",
    title: payload?.title || "系統訊息",
    content: payload?.content || "系統事件",
  }),
};

function toNotification(eventType, payload) {
  const builder = mapping[eventType];
  if (builder) return builder(payload);
  return {
    type: "system",
    title: eventType,
    content: typeof payload === "string" ? payload : JSON.stringify(payload || {}),
  };
}

export function attachNotificationCollector(eventBus, store) {
  if (!eventBus || !store) return () => {};

  const handlers = Object.keys(mapping).map((eventType) => {
    const handler = (payload) => {
      store.addNotification(toNotification(eventType, payload));
    };
    eventBus.on(eventType, handler);
    return { eventType, handler };
  });

  return () => {
    handlers.forEach(({ eventType, handler }) => eventBus.off(eventType, handler));
  };
}

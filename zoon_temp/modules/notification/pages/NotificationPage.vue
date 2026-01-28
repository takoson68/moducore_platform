<script setup>
import { computed, onMounted } from "vue";
import { container } from "@/app/container";
import { taskService } from "@/modules/task/services/taskService.js";
import { employeeService } from "@/modules/employee/services/employeeService.js";
import { voteService } from "@/modules/vote/services/voteService.js";

const storeNames = container.list().stores || [];
const hasTask = storeNames.includes("taskStore");
const hasEmployee = storeNames.includes("employeeStore");
const hasVote = storeNames.includes("voteStore");
const hasNotification = storeNames.includes("notificationStore");

const notificationStore = hasNotification ? container.resolve("notificationStore") : null;
const taskStore = hasTask ? container.resolve("taskStore") : null;
const employeeStore = hasEmployee ? container.resolve("employeeStore") : null;
const voteStore = hasVote ? container.resolve("voteStore") : null;
const eventBus = container.getService("eventBus");

const notifications = computed(() => notificationStore?.state.list || []);
const unreadCount = computed(() => notificationStore?.state.unread || 0);
const tasks = computed(() => taskStore?.state.tasks || []);
const employees = computed(() => employeeStore?.state.list || []);
const votes = computed(() => voteStore?.state.list || []);

function parseDate(value) {
  if (!value) return null;
  const raw = typeof value === "string" ? value.trim() : value;
  const direct = new Date(raw);
  if (!isNaN(direct)) return direct;
  if (typeof raw === "string" && raw.includes(" ")) {
    const fallback = new Date(raw.replace(" ", "T"));
    return isNaN(fallback) ? null : fallback;
  }
  return null;
}

function formatDate(value) {
  const date = parseDate(value);
  if (!date) return "未設定";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}/${mm}/${dd}`;
}

function formatTimestamp(value) {
  if (!value) return "未記錄";
  const date = parseDate(value);
  if (!date) return String(value);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${min}`;
}

function dueLabel(task) {
  if (!task?.due_date) return "未設定期限";
  const date = parseDate(task.due_date);
  if (!date) return "未設定期限";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  if (target < today) return `已逾期 ${formatDate(date)}`;
  return `截止 ${formatDate(date)}`;
}

function voteRuleLabel(vote) {
  if (vote.rule?.mode === "all") {
    return `全員投完 (${vote.votesReceived}/${vote.rule.totalVoters || "不限"})`;
  }
  if (vote.rule?.deadline) {
    return `截止 ${formatDate(vote.rule.deadline)}`;
  }
  return "時間到開票";
}

const taskStats = computed(() => {
  const items = tasks.value;
  const total = items.length;
  const todo = items.filter((t) => t.status === "todo").length;
  const doing = items.filter((t) => t.status === "doing").length;
  const done = items.filter((t) => t.status === "done").length;
  const active = todo + doing;
  return { total, todo, doing, done, active };
});

const employeeStats = computed(() => {
  const list = employees.value;
  const total = list.length;
  const active = list.filter((e) => (e.status || "active") === "active").length;
  const inactive = total - active;
  return { total, active, inactive };
});

const voteStats = computed(() => {
  const list = votes.value;
  const total = list.length;
  const open = list.filter((v) => v.status !== "closed").length;
  const closed = total - open;
  const votesReceived = list.reduce((sum, v) => sum + Number(v.votesReceived || 0), 0);
  return { total, open, closed, votesReceived };
});

const dueSoon = computed(() => {
  if (!hasTask) return [];
  const now = new Date();
  const base = new Date(now);
  base.setHours(0, 0, 0, 0);
  const within = new Date(base);
  within.setDate(within.getDate() + 7);
  return tasks.value
    .filter((t) => t.status !== "done" && t.due_date)
    .map((t) => ({ task: t, date: parseDate(t.due_date) }))
    .filter((item) => item.date && item.date <= within)
    .sort((a, b) => a.date - b.date)
    .map((item) => item.task)
    .slice(0, 6);
});

const recentActivities = computed(() => {
  if (!hasTask) return [];
  const items = [];
  tasks.value.forEach((task) => {
    (task.events || []).forEach((event) => {
      items.push({
        title: task.title || "未命名任務",
        meta: event.text || "更新任務",
        user: event.user || "系統",
        time: formatTimestamp(event.created_at),
        sortTime: parseDate(event.created_at)?.getTime() || 0,
      });
    });
  });
  return items.sort((a, b) => b.sortTime - a.sortTime).slice(0, 6);
});

const openVotes = computed(() => {
  if (!hasVote) return [];
  return votes.value
    .filter((v) => v.status !== "closed")
    .slice(0, 6);
});

const summaryCards = computed(() => [
  {
    label: "未讀通知",
    value: hasNotification ? unreadCount.value : "未載入",
    hint: hasNotification ? `總數 ${notifications.value.length}` : "通知模組未啟用",
    tone: "notify",
  },
  {
    label: "任務總數",
    value: hasTask ? taskStats.value.total : "未載入",
    hint: hasTask ? `進行中 ${taskStats.value.active}` : "任務模組未啟用",
    tone: "task",
  },
  {
    label: "員工人數",
    value: hasEmployee ? employeeStats.value.total : "未載入",
    hint: hasEmployee ? `啟用 ${employeeStats.value.active}` : "員工模組未啟用",
    tone: "team",
  },
  {
    label: "開放投票",
    value: hasVote ? voteStats.value.open : "未載入",
    hint: hasVote ? `總數 ${voteStats.value.total}` : "投票模組未啟用",
    tone: "vote",
  },
]);

function markAll() {
  notificationStore?.markAllAsRead();
}

function markRead(id) {
  if (!id) return;
  notificationStore?.markAsRead(id);
}

function sendTest(type) {
  const payloads = {
    task: { title: "範例任務", content: "任務建立完成" },
    member: { name: "New User" },
    booking: { content: "預約已建立" },
    system: { title: "系統訊息", content: "背景工作已完成" },
  };
  eventBus.emit(
    type === "task"
      ? "task.created"
      : type === "member"
        ? "member.added"
        : type === "booking"
          ? "booking.completed"
          : "system.info",
    payloads[type]
  );
}

onMounted(async () => {
  const jobs = [];
  if (hasTask) jobs.push({ name: "task", run: () => taskService.fetchList() });
  if (hasEmployee) jobs.push({ name: "employee", run: () => employeeService.fetchList() });
  if (hasVote) jobs.push({ name: "vote", run: () => voteService.fetchList() });
  const results = await Promise.allSettled(jobs.map((job) => job.run()));
  results.forEach((result, idx) => {
    if (result.status === "rejected") {
      console.error(`[notification] ${jobs[idx].name} fetch failed`, result.reason);
    }
  });
});
</script>

<template lang="pug">
.notification-page
  header.hero
    .hero-main
      p.kicker 平台整合通知
      h1.hero-title 通知中心整合視圖
      p.subtitle 彙整任務、投票與團隊狀態，讓模組行為更容易被觀測與驗證。
      .hero-meta
        span.meta-pill 進行中任務 {{ taskStats.active }}
        span.meta-pill 開放投票 {{ voteStats.open }}
        span.meta-pill 啟用員工 {{ employeeStats.active }}

    .hero-actions
      RouterLink.ghost(to="/task") 任務看板
      RouterLink.ghost(to="/vote") 投票中心
      RouterLink.ghost(to="/employee") 員工管理

  section.kpi-grid
    article.kpi-card(
      v-for="kpi in summaryCards"
      :key="kpi.label"
      :class="`tone-${kpi.tone}`"
    )
      p.kpi-label {{ kpi.label }}
      p.kpi-value {{ kpi.value }}
      p.kpi-hint {{ kpi.hint }}


  section.tester
    span 測試派發：
    button(@click="sendTest('task')") 任務
    button(@click="sendTest('member')") 成員
    button(@click="sendTest('booking')") 預約
    button(@click="sendTest('system')") 系統

  section.grid
    article.panel
      .panel-head
        h2 通知匯總
        button.mark(@click="markAll" :disabled="notifications.length === 0") 全部已讀
      .panel-body
        ul.list
          li.notify-row(
            v-for="n in notifications.slice(0, 8)"
            :key="n.id"
            :class="{ unread: !n.read }"
            @click="markRead(n.id)"
          )
            .row-main
              .row-title {{ n.title }}
              span.time {{ formatTimestamp(n.created_at) }}
            .row-meta
              span.meta-item {{ n.content || "無內容" }}
          li.notify-row.empty(v-if="notifications.length === 0") 尚無通知

    article.panel
      .panel-head
        h2 任務提醒
        RouterLink.link(to="/task") 查看任務
      .panel-body
        ul.list
          li.task-row(v-for="task in dueSoon" :key="task.id")
            .row-main
              .row-title {{ task.title }}
              span.tag {{ task.status || "todo" }}
            .row-meta
              span.meta-item 責任人 {{ task.assignee || "未指派" }}
              span.meta-item {{ dueLabel(task) }}
          li.task-row.empty(v-if="!hasTask") 任務模組未啟用
          li.task-row.empty(v-else-if="dueSoon.length === 0") 沒有即將到期的任務

    article.panel
      .panel-head
        h2 投票提醒
        RouterLink.link(to="/vote") 查看投票
      .panel-body
        ul.list
          li.vote-row(v-for="vote in openVotes" :key="vote.id")
            .row-main
              .row-title {{ vote.title }}
              span.tag.open 投票中
            .row-meta
              span.meta-item {{ voteRuleLabel(vote) }}
              span.meta-item 已投 {{ vote.votesReceived || 0 }} 票
          li.vote-row.empty(v-if="!hasVote") 投票模組未啟用
          li.vote-row.empty(v-else-if="openVotes.length === 0") 目前沒有開放投票

    article.panel
      .panel-head
        h2 團隊概況
        RouterLink.link(to="/employee") 查看員工
      .panel-body
        .stat-row
          .stat-box
            span.label 啟用
            span.value {{ employeeStats.active }}
          .stat-box
            span.label 停用
            span.value {{ employeeStats.inactive }}
        p.empty(v-if="!hasEmployee") 員工模組未啟用

    article.panel.span
      .panel-head
        h2 近期任務更新
        span.panel-note 來自任務事件
      .panel-body
        ul.activity
          li.activity-row(v-for="(item, idx) in recentActivities" :key="idx")
            .row-main
              .row-title {{ item.title }}
              span.time {{ item.time }}
            .row-meta
              span.meta-item {{ item.user }}
              span.meta-item {{ item.meta }}
          li.activity-row.empty(v-if="!hasTask") 任務模組未啟用
          li.activity-row.empty(v-else-if="recentActivities.length === 0") 目前沒有活動記錄

</template>

<style scoped lang="sass">
@use '/src/styles/sass/vars' as *

.notification-page
  padding: 24px
  min-height: 100%
  display: flex
  flex-direction: column
  gap: 20px
  background: radial-gradient(circle at 20% 20%, color-mix(in srgb, $sys_4 18%, $sys_1), $sys_1 55%)
  font-family: $fontBase

.hero
  display: flex
  justify-content: space-between
  align-items: flex-start
  gap: 16px
  padding: 18px
  border-radius: 16px
  background: linear-gradient(135deg, color-mix(in srgb, $sys_3 18%, $sys_1), $sys_1)
  border: 1px solid $borderColor
  box-shadow: 0 12px 28px rgba(18, 40, 90, 0.08)

.hero-main
  display: flex
  flex-direction: column
  gap: 6px
  flex: 1
.kicker
  margin: 0
  font-size: 12px
  letter-spacing: 1px
  text-transform: uppercase
  color: $sys_9

.hero-title
  margin: 0
  font-size: 24px
  color: $txtColor

.subtitle
  margin: 0
  color: $sys_9
  font-size: 14px

.hero-meta
  display: flex
  flex-wrap: wrap
  gap: 8px
  margin-top: 8px

.meta-pill
  padding: 6px 10px
  border-radius: 999px
  background: color-mix(in srgb, $sys_6 12%, $sys_1)
  border: 1px solid color-mix(in srgb, $sys_6 32%, $sys_1)
  font-size: 12px
  font-weight: 700
  color: $sys_6

.hero-actions
  display: flex
  gap: 10px
  flex-wrap: wrap
  align-items: center

.ghost
  display: inline-flex
  align-items: center
  justify-content: center
  gap: 6px
  padding: 8px 14px
  border-radius: 12px
  text-decoration: none
  font-size: 13px
  font-weight: 700
  white-space: nowrap
  border: 1px solid $borderColor
  color: $txtColor
  background: $sys_1

.kpi-grid
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr))
  gap: 12px

.kpi-card
  padding: 14px
  border-radius: 14px
  border: 1px solid $borderColor
  background: $sys_1
  box-shadow: 0 10px 22px rgba(18, 40, 90, 0.06)
  display: flex
  flex-direction: column
  gap: 4px

.kpi-label
  margin: 0
  font-size: 12px
  color: $sys_9
  font-weight: 700
  text-transform: uppercase
  letter-spacing: 0.6px

.kpi-value
  margin: 0
  font-size: 24px
  font-weight: 800
  color: $txtColor

.kpi-hint
  margin: 0
  font-size: 12px
  color: $sys_7
  font-weight: 600

.tone-notify
  border-color: color-mix(in srgb, $sys_5 35%, $borderColor)

.tone-task
  border-color: color-mix(in srgb, $sys_4 35%, $borderColor)

.tone-team
  border-color: color-mix(in srgb, $sys_3 35%, $borderColor)

.tone-vote
  border-color: color-mix(in srgb, $sys_8 35%, $borderColor)

.grid
  display: grid
  grid-template-columns: repeat(12, 1fr)
  gap: 12px

.panel
  grid-column: span 6
  padding: 16px
  border-radius: 16px
  border: 1px solid $borderColor
  background: $sys_1
  box-shadow: 0 10px 22px rgba(18, 40, 90, 0.06)
  display: flex
  flex-direction: column
  gap: 12px

.panel.span
  grid-column: span 12

.panel-head
  display: flex
  align-items: center
  justify-content: space-between
  gap: 10px

.panel-head h2
  margin: 0
  font-size: 16px
  color: $txtColor

.panel-note
  font-size: 12px
  color: $sys_9

.link
  font-size: 12px
  color: $primaryColor
  text-decoration: none
  font-weight: 700

.panel-body
  display: flex
  flex-direction: column
  gap: 12px

.list
  list-style: none
  padding: 0
  margin: 0
  display: grid
  gap: 10px

.task-row,
.vote-row,
.activity-row,
.notify-row
  padding: 10px
  border-radius: 12px
  border: 1px solid color-mix(in srgb, $borderColor 70%, $sys_1)
  background: color-mix(in srgb, $sys_10 70%, $sys_1)
  display: flex
  flex-direction: column
  gap: 6px
  cursor: pointer

.notify-row.unread
  border-color: color-mix(in srgb, $sys_5 40%, $borderColor)
  background: color-mix(in srgb, $sys_5 10%, $sys_1)

.notify-row:not(.unread)
  background: color-mix(in srgb, $sys_10 85%, $sys_1)
  color: $sys_9

.notify-row:not(.unread) .row-title
  color: $sys_7

.notify-row:not(.unread) .meta-item,
.notify-row:not(.unread) .time
  color: $sys_8

.row-main
  display: flex
  align-items: center
  justify-content: space-between
  gap: 10px

.row-title
  font-weight: 700
  font-size: 14px
  color: $txtColor

.tag
  padding: 4px 8px
  border-radius: 999px
  font-size: 11px
  font-weight: 700
  background: color-mix(in srgb, $sys_4 14%, $sys_1)
  color: $sys_4

.tag.open
  background: color-mix(in srgb, $sys_6 14%, $sys_1)
  color: $sys_6

.row-meta
  display: flex
  flex-wrap: wrap
  gap: 10px

.meta-item
  font-size: 12px
  color: $sys_9

.time
  font-size: 12px
  color: $sys_9

.stat-row
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 10px

.stat-box
  padding: 10px
  border-radius: 12px
  border: 1px dashed $borderColor
  background: $sys_10
  display: flex
  justify-content: space-between
  align-items: center

.stat-box .label
  font-size: 12px
  color: $sys_9
  font-weight: 700

.stat-box .value
  font-size: 18px
  font-weight: 800
  color: $txtColor

.activity
  list-style: none
  padding: 0
  margin: 0
  display: grid
  gap: 10px

.activity-row .time
  font-size: 12px
  color: $sys_9

.activity-row .row-meta
  gap: 6px

.empty
  border: 1px dashed $borderColor
  background: $sys_1
  text-align: center
  color: $sys_9
  font-size: 12px

.mark
  padding: 6px 10px
  border-radius: 999px
  border: 1px solid $borderColor
  background: $sys_1
  font-size: 12px
  font-weight: 700
  cursor: pointer
  color: $txtColor

.mark:disabled
  cursor: not-allowed
  opacity: 0.6

.tester
  display: flex
  align-items: center
  gap: 6px
  padding: 10px 14px
  border-radius: 12px
  border: 1px dashed $borderColor
  background: $sys_1
  font-size: 12px

.tester button
  padding: 6px 10px
  border-radius: 8px
  border: 1px solid $borderColor
  background: #fff
  cursor: pointer

@media (max-width: 1100px)
  .panel
    grid-column: span 12

@media (max-width: 720px)
  .hero
    flex-direction: column
    align-items: flex-start

  .hero-actions
    width: 100%

  .ghost
    flex: 1
</style>

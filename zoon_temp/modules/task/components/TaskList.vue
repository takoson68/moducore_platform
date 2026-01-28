<script setup>
import { computed, reactive, ref } from "vue";

/**
 * Props
 */
const props = defineProps({
  tasks: { type: Array, default: () => [] },
  assignees: { type: Array, default: () => [] },
  activeTaskId: Number,
  search: { type: String, default: "" },
  filterStatus: { type: String, default: "active" },
});

/**
 * Emits
 */
const emit = defineEmits([
  "select-task",
  "update:search",
  "update:filter-status",
  "create-task",
]);

/**
 * 狀態顯示
 */
const statusLabels = {
  todo: "待處理",
  doing: "進行中",
  done: "已完成",
};

const priorityLabels = {
  low: "低",
  medium: "中",
  high: "高",
};

const statusColors = {
  todo: "#f5a524",
  doing: "#5a8bff",
  done: "#4bcf8a",
};

/**
 * 新增任務表單
 */
const showNew = ref(false);

const form = reactive({
  title: "",
  desc: "",
  priority: "medium",
  due_date: "",
  assigneeId: "",    // 單一負責人（選擇）
  memberIds: [],     // 參與成員（多選）
});

const memberSearch = ref("");
const showMemberSelection = ref(true);

const selectedMemberLabels = computed(() => {
  return form.memberIds
    .map((id) => memberLabel(props.assignees.find((e) => e.id === id) || {}))
    .filter(Boolean);
});

const memberInputValue = computed(() => {
  if (!showMemberSelection.value) return memberSearch.value;
  return selectedMemberLabels.value.join("、");
});

const filteredMembers = computed(() => {
  const keyword = memberSearch.value.trim().toLowerCase();
  if (!keyword) return props.assignees;
  return props.assignees.filter((emp) => {
    const label = `${emp.name || ""} ${emp.username || ""} ${emp.email || ""}`.toLowerCase();
    return label.includes(keyword);
  });
});

function memberLabel(emp) {
  return emp.name || emp.username || emp.email || "";
}

function toggleMember(id) {
  const value = Number(id);
  if (!Number.isFinite(value)) return;
  const exists = form.memberIds.includes(value);
  form.memberIds = exists
    ? form.memberIds.filter((m) => m !== value)
    : [...form.memberIds, value];
}

function removeMember(id) {
  const value = Number(id);
  form.memberIds = form.memberIds.filter((m) => m !== value);
}

function handleMemberInput(e) {
  showMemberSelection.value = false;
  memberSearch.value = e.target.value;
}

function handleMemberFocus() {
  showMemberSelection.value = false;
}

function handleMemberBlur() {
  showMemberSelection.value = true;
  memberSearch.value = "";
}

function toggleNew() {
  showNew.value = !showNew.value;
}

/**
 * 建立任務（v0）
 */
function submitNew() {
  if (!form.title.trim()) return;
  if (!form.assigneeId) return;

  const selected = props.assignees.find((emp) => emp.id === Number(form.assigneeId));
  const payload = {
    title: form.title.trim(),
    desc: form.desc.trim(),
    priority: form.priority,
    due_date: form.due_date || null,
    status: "todo",
    assignee_id: Number(form.assigneeId),
    assignee: selected?.name || selected?.username || selected?.email || "",
    members: Array.isArray(form.memberIds)
      ? form.memberIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))
      : [],
  };

  emit("create-task", payload);

  // reset
  form.title = "";
  form.desc = "";
  form.priority = "medium";
  form.due_date = "";
  form.assigneeId = "";
  form.memberIds = [];
  memberSearch.value = "";
  showMemberSelection.value = true;
  showNew.value = false;
}
</script>

<template lang="pug">
.pane.left
  // =====================
  // Toolbar
  // =====================
  .toolbar
    div
      input.search(
        type="text"
        :value="search"
        placeholder="搜尋任務"
        @input="e => emit('update:search', e.target.value)"
      )
      select.filter(
        :value="filterStatus"
        @change="e => emit('update:filter-status', e.target.value)"
      )
        option(value="active") 預設（待處理＋進行中）
        option(value="all") 全部
        option(value="todo") 待處理
        option(value="doing") 進行中
        option(value="done") 已完成

    button.new-btn(type="button" @click="toggleNew")
      | {{ showNew ? "取消" : "新增任務" }}

  // =====================
  // New Task Form
  // =====================
  form.new-task(v-if="showNew" @submit.prevent="submitNew")
    input(
      type="text"
      v-model="form.title"
      placeholder="任務標題"
      required
    )

    textarea(
      rows="4"
      v-model="form.desc"
      placeholder="描述（選填）"
    )

    label
      span.label 負責人 Assignee
      select(v-model="form.assigneeId" required)
        option(value="") 請選擇
        option(
          v-for="emp in assignees"
          :key="emp.id"
          :value="emp.id"
        )
          | {{ emp.name || emp.username || emp.email }}

    .row
      label
        span.label 優先度
        select(v-model="form.priority")
          option(value="low") 低
          option(value="medium") 中
          option(value="high") 高

      label
        span.label 截止日期
        input(type="date" v-model="form.due_date")

    label
      span.label 參與成員（可多選）
      input(
        type="text"
        :value="memberInputValue"
        placeholder="搜尋成員（可輸入姓名/帳號/Email）"
        @input="handleMemberInput"
        @focus="handleMemberFocus"
        @blur="handleMemberBlur"
      )
      .member-options
        button.member-option(
          v-for="emp in filteredMembers"
          :key="emp.id"
          type="button"
          :class="{ selected: form.memberIds.includes(emp.id) }"
          @click="toggleMember(emp.id)"
        )
          | {{ memberLabel(emp) }}
      .member-tags(v-if="form.memberIds.length")
        span.tag(
          v-for="id in form.memberIds"
          :key="id"
        )
          | {{ memberLabel(assignees.find((e) => e.id === id) || {}) }}
          button.remove(type="button" @click="removeMember(id)") ×

    button.submit(type="submit") 建立

  // =====================
  // Task List
  // =====================
  .list
    .task-item(
      v-for="task in tasks"
      :key="task.id"
      :class="{ active: task.id === activeTaskId }"
      @click="emit('select-task', task.id)"
    )
      .top
        h4 {{ task.title }}
        span.status(
          :style="{ background: statusColors[task.status] || '#d2d8e8' }"
        )
          | {{ statusLabels[task.status] || task.status }}

      // 負責人顯示
      p.owner 負責人：{{ task.assignee || "未指派" }}

      p.desc {{ task.desc || "未填寫描述" }}

      .meta
        span.badge
          | 優先：{{ priorityLabels[task.priority] || task.priority }}

        span.badge
          | 截止：{{ task.due_date || "未設定" }}

        span.badge
          | 參與：{{ task.members?.length || 0 }}
</template>

<style scoped lang="sass">
.toolbar
  display: flex
  flex-direction: column
  gap: 8px

  & > div
    display: flex
    gap: 8px

.search
  flex: 1
  padding: 10px 12px
  border-radius: 10px
  border: 1px solid #d7dded
  background: #fff

.filter
  padding: 10px 12px
  border-radius: 10px
  border: 1px solid #d7dded
  background: #fff

.new-btn
  padding: 10px 12px
  border-radius: 10px
  border: 1px solid #d7dded
  background: linear-gradient(135deg, #0f1b3d, #1c3f8c)
  color: #fff
  cursor: pointer
  font-weight: 700
  width: 100%

.new-task
  margin-top: 10px
  display: flex
  flex-direction: column
  gap: 8px
  padding: 10px
  border: 1px solid #e4e8f2
  border-radius: 12px
  background: #f7f9ff
  max-height: 520px
  overflow: auto

*
  box-sizing: border-box

.new-task input,
.new-task textarea,
.new-task select
  width: 100%
  padding: 10px 12px
  border-radius: 10px
  border: 1px solid #d7dded
  background: #fff

.new-task textarea
  min-height: 150px

.new-task .row
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 8px

.new-task .label
  display: block
  margin-bottom: 4px
  color: #5f6c88
  font-weight: 700

.submit
  align-self: flex-end
  padding: 10px 14px
  border-radius: 10px
  border: none
  background: linear-gradient(135deg, #3a7afe, #1d4ba1)
  color: #fff
  font-weight: 700
  cursor: pointer

.member-options
  display: flex
  flex-wrap: wrap
  gap: 8px
  margin-top: 6px

.member-option
  padding: 6px 10px
  border-radius: 10px
  border: 1px solid #d7dded
  background: #fff
  cursor: pointer
  font-size: 12px
  color: #415073

.member-option.selected
  background: #e7efff
  border-color: #9db6ff
  color: #1d4ba1

.member-tags
  display: flex
  flex-wrap: wrap
  gap: 6px
  margin-top: 8px

.tag
  display: inline-flex
  align-items: center
  gap: 6px
  padding: 6px 8px
  border-radius: 999px
  background: #f7f9ff
  border: 1px solid #e4e8f2
  font-size: 12px
  color: #415073

.tag .remove
  border: none
  background: transparent
  cursor: pointer
  color: #8b95ad

.list
  margin-top: 10px
  display: flex
  flex-direction: column
  gap: 10px
  overflow: auto

:deep(.pane.left)
  overflow: auto

.task-item
  border: 1px solid #e4e8f2
  border-radius: 12px
  padding: 10px 12px
  background: #f9fbff
  cursor: pointer
  transition: 0.15s ease

  &:hover
    box-shadow: 0 8px 16px rgba(15,30,72,0.08)
    transform: translateY(-1px)

  &.active
    border-color: #3a7afe
    box-shadow: 0 10px 20px rgba(58,122,254,0.2)

.top
  display: flex
  justify-content: space-between
  align-items: center
  gap: 8px

h4
  margin: 0
  color: #0f1b3d

.desc
  margin: 4px 0 8px 0
  color: #5f6c88
  font-size: 14px

.owner
  margin: 2px 0
  font-size: 12px
  font-weight: 700
  color: #415073

.status
  padding: 6px 10px
  border-radius: 10px
  color: #fff
  font-weight: 700
  font-size: 12px

.meta
  display: flex
  gap: 8px
  flex-wrap: wrap

.badge
  padding: 6px 10px
  border-radius: 10px
  background: #eef1f8
  color: #415073
  font-weight: 700
  font-size: 12px
</style>

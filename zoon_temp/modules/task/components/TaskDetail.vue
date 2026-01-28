<script setup>
import { computed, ref, watch } from "vue";

/**
 * Props
 */
const props = defineProps({
  task: { type: Object, default: null },
  assignees: { type: Array, default: () => [] },

  // v0嚗?亦摮葡銵函內?桀?雿輻??
  currentUser: { type: String, required: true },
  currentUserId: { type: Number, default: 0 },
});

/**
 * Emits
 */
const emit = defineEmits([
  "update-status",
  "update-assignee",
  "update-publisher",
  "update-desc",
  "delete-task",
]);

/**
 * 憿舐內?冽?蝐?
 */
const statusLabels = {
  todo: "\u5f85\u8655\u7406",
  doing: "\u9032\u884c\u4e2d",
  done: "\u5df2\u5b8c\u6210",
};

const priorityLabels = {
  low: "\u4f4e",
  medium: "\u4e2d",
  high: "\u9ad8",
};

const uiText = {
  status: "\u72c0\u614b\uff1a",
  deleteTask: "\u522a\u9664\u4efb\u52d9",
  noDesc: "\u5c1a\u672a\u586b\u5beb\u63cf\u8ff0",
  descLabel: "\u4efb\u52d9\u5167\u5bb9",
  saveDesc: "\u5132\u5b58",
  publisher: "\u767c\u5e03\u8005\uff1a",
  assignee: "\u8ca0\u8cac\u4eba\uff1a",
  priority: "\u512a\u5148\uff1a",
  dueDate: "\u622a\u6b62\uff1a",
  noPublisher: "\u672a\u6307\u5b9a",
  noAssignee: "\u672a\u6307\u6d3e",
  noDueDate: "\u672a\u8a2d\u5b9a",
  members: "\u53c3\u8207\u6210\u54e1",
  unassignedOption: "\u672a\u6307\u6d3e",
};

/**
 * ?臬?箔遙??鞎砌犖
 * ?? ?芣?鞎痊鈭箸??賣?雿???
 */
const isAssignee = computed(() => {
  return props.task?.assignee === props.currentUser;
});

const isPublisher = computed(() => {
  return props.task?.publisher === props.currentUser;
});

const canEdit = computed(() => isAssignee.value || isPublisher.value);

const canDelete = computed(() => {
  const task = props.task;
  if (!task) return false;
  const idMatch =
    (task.assignee_id && task.assignee_id === props.currentUserId) ||
    (task.publisher_id && task.publisher_id === props.currentUserId);
  const nameMatch =
    task.assignee === props.currentUser || task.publisher === props.currentUser;
  return idMatch || nameMatch;
});

function requestDelete() {
  emit("delete-task");
}

function employeeLabel(emp) {
  return emp?.name || emp?.username || emp?.email || "";
}

const employeeOptions = computed(() => {
  const map = new Map();
  (props.assignees || []).forEach((emp) => {
    const id = Number(emp?.id);
    if (!Number.isFinite(id) || id <= 0) return;
    const label = employeeLabel(emp);
    if (!label) return;
    map.set(id, { id, label });
  });

  const currentAssigneeId = Number(props.task?.assignee_id);
  if (Number.isFinite(currentAssigneeId) && currentAssigneeId > 0) {
    const label = props.task?.assignee || "";
    if (label && !map.has(currentAssigneeId)) {
      map.set(currentAssigneeId, { id: currentAssigneeId, label });
    }
  }

  const currentPublisherId = Number(props.task?.publisher_id);
  if (Number.isFinite(currentPublisherId) && currentPublisherId > 0) {
    const label = props.task?.publisher || "";
    if (label && !map.has(currentPublisherId)) {
      map.set(currentPublisherId, { id: currentPublisherId, label });
    }
  }

  return Array.from(map.values());
});

const selectedAssigneeId = computed(() => {
  const id = Number(props.task?.assignee_id);
  return Number.isFinite(id) && id > 0 ? id : "";
});

const selectedPublisherId = computed(() => {
  const id = Number(props.task?.publisher_id);
  return Number.isFinite(id) && id > 0 ? id : "";
});

const descDraft = ref("");

watch(
  () => props.task?.id,
  () => {
    descDraft.value = props.task?.desc || "";
  },
  { immediate: true }
);

watch(
  () => props.task?.desc,
  (value) => {
    if (value !== undefined) {
      descDraft.value = value || "";
    }
  }
);

const isDescDirty = computed(() => {
  return (props.task?.desc || "") !== descDraft.value;
});

function saveDesc() {
  if (!props.task) return;
  if (!canEdit.value) return;
  if (!isDescDirty.value) return;
  emit("update-desc", descDraft.value);
}

/**
 * ?臬??????
 */
const hasMembers = computed(() => {
  return (props.task?.members?.length || 0) > 0;
});
</script>

<template lang="pug">
.pane.middle(v-if="task")
  // =====================
  // Header
  // =====================
  .head
    h3 {{ task.title }}

    .actions
      .status-actions(v-if="canEdit")
        select(
          :value="task.status"
          @change="e => emit('update-status', e.target.value)"
        )
          option(value="todo") {{ statusLabels.todo }}
          option(value="doing") {{ statusLabels.doing }}
          option(value="done") {{ statusLabels.done }}

      .status-readonly(v-else)
        span.pill
          strong {{ uiText.status }}
          | {{ statusLabels[task.status] || task.status }}

      button.delete-btn(
        v-if="canDelete"
        type="button"
        @click="requestDelete"
      ) {{ uiText.deleteTask }}

  // =====================
  // Description
  // =====================
  .desc-block
    label.desc-label {{ uiText.descLabel }}
    template(v-if="canEdit")
      textarea.desc-input(
        v-model="descDraft"
        rows="5"
        :placeholder="uiText.noDesc"
      )
      button.save-desc(
        type="button"
        :disabled="!isDescDirty"
        @click="saveDesc"
      ) {{ uiText.saveDesc }}
    template(v-else)
      p.desc {{ task.desc || uiText.noDesc }}

  // =====================
  // Meta Info
  // =====================
  .pill-row
    span.pill
      strong {{ uiText.publisher }}
      template(v-if="canEdit")
        select.pill-select(
          :value="selectedPublisherId"
          @change="e => emit('update-publisher', e.target.value)"
        )
          option(
            v-for="emp in employeeOptions"
            :key="emp.id"
            :value="emp.id"
          ) {{ emp.label }}
      template(v-else)
        | {{ task.publisher || uiText.noPublisher }}

    span.pill
      strong {{ uiText.assignee }}
      template(v-if="canEdit")
        select.pill-select(
          :value="selectedAssigneeId"
          @change="e => emit('update-assignee', e.target.value)"
        )
          option(value="") {{ uiText.unassignedOption }}
          option(
            v-for="emp in employeeOptions"
            :key="emp.id"
            :value="emp.id"
          ) {{ emp.label }}
      template(v-else)
        | {{ task.assignee || uiText.noAssignee }}

    span.pill
      strong {{ uiText.priority }}
      | {{ priorityLabels[task.priority] || task.priority }}

    span.pill
      strong {{ uiText.dueDate }}
      | {{ task.due_date || uiText.noDueDate }}

  // =====================
  // Participants
  // =====================
  .members(v-if="hasMembers")
    h4 {{ uiText.members }}
    .chips
      span.chip(
        v-for="m in task.members"
        :key="m"
      ) {{ m }}
</template>

<style scoped lang="sass">
.head
  display: flex
  justify-content: space-between
  align-items: center
  gap: 10px

.actions
  display: flex
  align-items: center
  gap: 8px

h3
  margin: 0
  color: #0f1b3d

.status-actions select
  padding: 8px 10px
  border-radius: 10px
  border: 1px solid #d7dded
  background: #fff
  cursor: pointer

.pill-select
  margin-left: 6px
  padding: 4px 8px
  border-radius: 999px
  border: 1px solid #d7dded
  background: #fff
  font-weight: 700
  color: #415073

.delete-btn
  padding: 8px 12px
  border-radius: 10px
  border: 1px solid #f3c5c5
  background: #ffecec
  color: #b42318
  cursor: pointer
  font-weight: 700

.status-readonly .pill
  background: #e3e7f3

.desc
  margin: 6px 0 10px 0
  color: #5f6c88
  line-height: 1.5

.desc-block
  display: flex
  flex-direction: column
  gap: 8px

.desc-label
  font-weight: 700
  color: #415073
  font-size: 12px

.desc-input
  width: 100%
  min-height: 120px
  padding: 10px 12px
  border-radius: 10px
  border: 1px solid #d7dded
  background: #fff
  resize: vertical
  font-family: inherit
  color: #415073

.save-desc
  align-self: flex-start
  padding: 8px 12px
  border-radius: 10px
  border: 1px solid #d7dded
  background: linear-gradient(135deg, #3a7afe, #1d4ba1)
  color: #fff
  font-weight: 700
  cursor: pointer

.save-desc:disabled
  opacity: 0.5
  cursor: not-allowed

.pill-row
  display: flex
  gap: 8px
  flex-wrap: wrap

.pill
  padding: 8px 10px
  border-radius: 10px
  background: #eef1f8
  color: #415073
  font-weight: 700
  font-size: 12px

.members h4
  margin: 0 0 6px 0
  color: #0f1b3d

.chips
  display: flex
  gap: 8px
  flex-wrap: wrap

.chip
  padding: 6px 10px
  border-radius: 10px
  background: #f7f9ff
  border: 1px solid #e4e8f2
  color: #415073
  font-weight: 700
</style>

<script setup>
import { computed, onMounted, ref } from "vue";
import { container } from "@/app/container";
import TaskLayout from "../TaskLayout.vue";
import TaskList from "../components/TaskList.vue";
import TaskDetail from "../components/TaskDetail.vue";
import TaskMessages from "../components/TaskMessages.vue";
import { taskService } from "../services/taskService.js";

const taskStore = container.resolve("taskStore");
const authStore = container.resolve("auth");
const search = ref("");
const filterStatus = ref("active");
const composer = ref("");

const assignees = computed(() => taskStore.state.assignees || []);
const currentUser = computed(() => authStore.state.user?.name || "you");
const currentUserId = computed(() => authStore.state.user?.id || 0);

const tasks = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  const items = taskStore.state.tasks || [];
  return items.filter((t) => {
    const title = (t.title || "").toLowerCase();
    const desc = (t.desc || "").toLowerCase();
    const hit = !keyword || title.includes(keyword) || desc.includes(keyword);
    const statusOk =
      filterStatus.value === "all" ||
      (filterStatus.value === "active" && (t.status === "todo" || t.status === "doing")) ||
      t.status === filterStatus.value;
    return hit && statusOk;
  });
});

const activeTask = computed(() => {
  const items = taskStore.state.tasks || [];
  return items.find((t) => t.id === taskStore.state.activeTaskId);
});

async function selectTask(id) {
  taskStore.selectTask(id);
  composer.value = "";
  try {
    await taskService.fetchDetail(id);
  } catch (err) {
    console.error("[task/detail] fetch task detail failed", err);
  }
}

function updateStatus(status) {
  if (!activeTask.value) return;
  taskService.update(activeTask.value.id, { status });
}

function updateAssignee(assigneeId) {
  if (!activeTask.value) return;
  const id = Number(assigneeId);
  const selected = assignees.value.find((emp) => emp.id === id);
  taskService.update(activeTask.value.id, {
    assignee_id: Number.isFinite(id) && id > 0 ? id : null,
    assignee: selected?.name || selected?.username || selected?.email || "",
  });
}

function updatePublisher(publisherId) {
  if (!activeTask.value) return;
  const id = Number(publisherId);
  const selected = assignees.value.find((emp) => emp.id === id);
  if (!Number.isFinite(id) || id <= 0) return;
  taskService.update(activeTask.value.id, {
    publisher_id: id,
    publisher: selected?.name || selected?.username || selected?.email || "",
  });
}

function updateDesc(desc) {
  if (!activeTask.value) return;
  taskService.update(activeTask.value.id, { desc });
}

function createTask(payload) {
  const authUser = authStore.state.user;
  const publisherId = authUser?.id ?? null;
  taskService.create({
    ...payload,
    publisher: currentUser.value,
    publisher_id: publisherId,
  });
}

function sendMessage() {
  if (!composer.value.trim() || !activeTask.value) return;
  taskService.addEvent(activeTask.value.id, {
    user: currentUser.value,
    text: composer.value,
    type: "note",
  });
  composer.value = "";
}

function deleteTask() {
  if (!activeTask.value) return;
  const ok = confirm("確定刪除這個任務嗎？");
  if (!ok) return;
  taskService.remove(activeTask.value.id, currentUserId.value).catch((err) => {
    console.error("[task/delete] remove task failed", err);
    alert("刪除失敗，請稍後再試");
  });
}

onMounted(() => {
  taskService.fetchList().catch((err) => {
    console.error("[task/list] fetch tasks failed", err);
  });
});
</script>

<template lang="pug">
TaskLayout
  .task-board
    .board-shell
      TaskList(
        :tasks="tasks"
        :assignees="assignees"
        :active-task-id="taskStore.state.activeTaskId"
        v-model:search="search"
        v-model:filter-status="filterStatus"
        @create-task="createTask"
        @select-task="selectTask"
      )

      TaskDetail(
        :task="activeTask"
        :assignees="assignees"
        :current-user="currentUser"
        :current-user-id="currentUserId"
        @update-status="updateStatus"
        @update-assignee="updateAssignee"
        @update-publisher="updatePublisher"
        @update-desc="updateDesc"
        @delete-task="deleteTask"
      )

      TaskMessages(
        :task="activeTask"
        v-model:composer="composer"
        @send="sendMessage"
      )
</template>

<style scoped lang="sass">
.task-board
  flex: 1
  width: 100%
  height: 100%
  background: linear-gradient(160deg, #f6f8ff, #eef1f8)
  padding: 18px
  box-sizing: border-box
  overflow: hidden

.board-shell
  display: grid
  grid-template-columns: 28% 40% 30%
  gap: 1%
  height: 100%
  min-height: 560px
  box-sizing: border-box !important

:deep(.pane)
  background: rgba(255,255,255,0.9)
  border-radius: 14px
  box-shadow: 0 10px 26px rgba(15, 30, 72, 0.08)
  border: 1px solid #e6e8f1
  padding: 16px
  display: flex
  flex-direction: column
  gap: 12px
  min-height: 0

:deep(.pane.left)
  overflow: hidden

:deep(.pane.middle)
  overflow: hidden

:deep(.pane.right)
  overflow: auto
</style>

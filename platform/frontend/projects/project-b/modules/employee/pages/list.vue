<script setup>
import { computed, onMounted, ref, watch } from "vue";
import world from '@/world.js'
import EmployeeTable from "../components/EmployeeTable.vue";
import EmployeeEditor from "../components/EmployeeEditor.vue";
import { employeeService } from "../services/employeeService.js";

const employeeStore = world.store("employeeStore");
const authStore = world.store("auth");

const role = computed(() => authStore.state.user?.role || "staff");
const canManage = computed(() => ["super_admin", "manager"].includes(role.value));

const currentEmployee = computed(() => {
  const email = authStore.state.user?.email || "";
  const username = authStore.state.user?.username || "";
  const list = employeeStore.state.list || [];
  return (
    list.find((e) => e.email === email || e.username === username) ||
    authStore.state.user ||
    null
  );
});

const selfPhone = ref("");
const selfPassword = ref("");
const saving = ref(false);

watch(
  () => currentEmployee.value,
  (emp) => {
    selfPhone.value = emp?.phone || "";
  },
  { immediate: true }
);

function setSearch(e) {
  employeeStore.setSearch(e.target.value);
}

function openCreate() {
  employeeStore.openCreate();
}

function statusLabel(status) {
  return status === "active" ? "啟用" : "停用";
}

async function saveSelfProfile() {
  const emp = currentEmployee.value;
  if (!emp?.id) {
    alert("無法更新資料");
    return;
  }
  const phone = selfPhone.value.trim();
  const password = selfPassword.value.trim();
  const payload = {};
  if (phone !== "") payload.phone = phone;
  if (password !== "") payload.password = password;
  if (Object.keys(payload).length === 0) {
    alert("沒有可更新的內容");
    return;
  }
  saving.value = true;
  try {
    await employeeService.update(emp.id, payload);
    if (password) selfPassword.value = "";
    alert("已更新");
  } catch (err) {
    console.error("[employee/self] update profile failed", err);
    alert("更新失敗，請稍後再試");
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  employeeService.fetchList().catch((err) => {
    console.error("[employee/list] fetch employees failed", err);
  });
});
</script>

<template lang="pug">
.employee-page
  .toolbar(v-if="canManage")
    .toolbar-main
      .search
        span.icon 搜尋
        input(
          type="text"
          :value="employeeStore.state.search"
          @input="setSearch"
          placeholder="搜尋員工"
        )
      .pill 員工共 {{ employeeStore.state.list.length }} 人
    .actions
      button.primary(@click="openCreate") 新增員工
      //- button.icon-btn(title="匯出") ⬇️
      //- button.icon-btn(title="更新") 🔄

  EmployeeTable(v-if="canManage" :show-role="canManage")
  EmployeeEditor(v-if="canManage")

  .self-card(v-else)
    .card-head
      .head-text
        h3 我的資料
        p.note 員工帳號僅顯示個人資訊
      .self-actions
        button.primary(type="button" :disabled="saving" @click="saveSelfProfile") {{ saving ? '儲存中' : '確定更新' }}

    .info-grid
      .info-item
        span.label 姓名
        span.value {{ currentEmployee?.name || '-' }}
      .info-item
        span.label Email
        span.value {{ currentEmployee?.email || '-' }}
      .info-item
        span.label 職稱
        span.value {{ currentEmployee?.title || '-' }}
      .info-item
        span.label 部門
        span.value {{ currentEmployee?.department || '-' }}
      .info-item
        span.label 電話
        input.self-input(v-model="selfPhone" type="text" placeholder="輸入電話")
      .info-item
        span.label 新密碼
        input.self-input(v-model="selfPassword" type="password" placeholder="輸入新密碼")
      .info-item
        span.label 狀態
        span.value {{ statusLabel(currentEmployee?.status || 'active') }}
</template>

<style scoped lang="sass">
@use '@project/styles/sass/vars' as *

.employee-page
  padding: 18px
  // background: linear-gradient(160deg, $sysBg, color-mix(in srgb, var(--primary) 6%, $sys_1))
  flex: 1
  display: flex
  flex-direction: column
  gap: 14px
  overflow: hidden

.toolbar
  display: flex
  align-items: center
  gap: 12px
  flex-wrap: nowrap
  padding-bottom: 4px

.toolbar-main
  display: flex
  align-items: center
  gap: 12px
  flex: 1 1 auto
  min-width: 0
  flex-wrap: nowrap

.search
  display: flex
  align-items: center
  gap: 8px
  padding: 10px 12px
  border-radius: 12px
  border: 1px solid $borderColor
  background: $sys_1
  min-width: 200px
  max-width: 320px
  flex: 0 1 260px

.search input
  border: none
  outline: none
  font-size: 14px
  flex: 1

.icon
  color: $sys_9
  font-size: 12px

.pill
  padding: 10px 14px
  border-radius: 12px
  background: color-mix(in srgb, var(--sys-6) 12%, var(--sys-1))
  color: $sys_6
  border: 1px solid color-mix(in srgb, var(--sys-6) 40%, var(--sys-1))
  font-weight: 700
  white-space: nowrap

.actions
  display: flex
  align-items: center
  gap: 8px
  flex-wrap: nowrap
  justify-content: flex-end
  margin-left: auto
  padding-left: 6px
  flex-shrink: 0

.icon-btn
  width: 36px
  min-width: 36px
  max-width: 36px
  height: 36px
  border-radius: 12px
  border: 1px solid $borderColor
  background: $sys_1
  cursor: pointer
  display: grid
  place-items: center
  padding: 0
  font-size: 14px
  line-height: 1
  color: $txtColor

.primary
  height: 36px
  padding: 0 16px
  border-radius: 12px
  border: none
  background: linear-gradient(135deg, $primaryColor, $sys_4)
  color: $sys_1
  font-weight: 700
  cursor: pointer
  display: inline-flex
  align-items: center
  gap: 6px
  white-space: nowrap
  font-size: 13px
  line-height: 1

.ghost
  height: 36px
  padding: 0 16px
  border-radius: 12px
  border: 1px solid $borderColor
  background: $sys_1
  color: $txtColor
  font-weight: 700
  cursor: pointer
  display: inline-flex
  align-items: center
  gap: 6px
  white-space: nowrap
  font-size: 13px
  line-height: 1

.primary:disabled
  opacity: 0.6
  cursor: not-allowed

.ghost:disabled
  opacity: 0.6
  cursor: not-allowed

.self-card
  max-width: 720px
  border: 1px solid $borderColor
  border-radius: 16px
  background: linear-gradient(160deg, $sys_1, color-mix(in srgb, var(--primary) 6%, $sys_1))
  padding: 20px
  box-shadow: 0 10px 28px rgba(16,40,89,0.08)

.card-head
  display: flex
  align-items: center
  justify-content: space-between
  gap: 12px
  margin-bottom: 16px

.head-text h3
  margin: 0
  font-size: 18px

.head-text .note
  margin: 4px 0 0
  color: $sys_9
  font-size: 12px

.info-grid
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))
  gap: 12px

.info-item
  display: flex
  flex-direction: column
  gap: 6px
  padding: 10px 12px
  border-radius: 12px
  background: color-mix(in srgb, var(--sys-1) 92%, var(--primary) 8%)
  border: 1px solid $borderColor

.info-item .label
  font-size: 12px
  color: $sys_9

.info-item .value
  font-size: 14px
  font-weight: 700
  color: $txtColor

.self-input
  padding: 10px 12px
  border-radius: 10px
  border: 1px solid $borderColor
  background: $sys_1
  color: $txtColor
  font-size: 14px
</style>

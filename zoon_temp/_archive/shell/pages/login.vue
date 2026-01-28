<script setup>
import { ref, watch } from "vue";
import { container } from "@/app/container";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue"]);

const username = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

const authStore = container.resolve("auth");

// 關閉彈窗
function close() {
  emit("update:modelValue", false);
}

// 提交登入流程（單一入口）
async function submit() {
  error.value = "";
  loading.value = true;

  try {
    await authStore.login({
      username: username.value,
      password: password.value,
    });

    // 登入成功即關閉
    close();
  } catch (err) {
    error.value = err.message || "登入失敗";
  } finally {
    loading.value = false;
  }
}

// 每次開啟重置狀態
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      username.value = "";
      password.value = "";
      error.value = "";
    }
  }
);
</script>

<template lang="pug">
Teleport(to="body")
  .login-modal(v-if="modelValue")
    .backdrop(@click="close")

    .dialog
      h2 登入系統

      form(@submit.prevent="submit")
        .field
          label 帳號
          input(
            v-model="username"
            type="text"
            autocomplete="username"
            required
          )

        .field
          label 密碼
          input(
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
          )

        .error(v-if="error") {{ error }}

        .actions
          button.primary(type="submit" :disabled="loading")
            span(v-if="!loading") 登入
            span(v-else) 登入中…
          button.ghost(type="button" @click="close") 取消
</template>

<style lang="sass" scoped>
.login-page
  min-height: 100vh
  display: grid
  place-items: center
  background: radial-gradient(120% 120% at 20% 10%, color-mix(in srgb, $primaryColor 8%, transparent), transparent), radial-gradient(120% 120% at 90% 0%, color-mix(in srgb, $sys_6 8%, transparent), transparent), $bgColor
  color: $txtColor
  font-family: "SF Pro Display", "Segoe UI", system-ui, -apple-system, sans-serif
  padding: 32px

.stub
  text-align: center
  max-width: 640px
  display: grid
  gap: 12px

h1
  margin: 0
  font-size: clamp(28px, 4vw, 36px)

p
  margin: 0
  color: $sys_9

.actions
  display: flex
  justify-content: center
  gap: 12px
  margin-top: 4px

.primary-cta
  padding: 12px 18px
  border-radius: 10px
  background: $primaryColor
  color: $sys_1
  font-weight: 700
  border: none
  cursor: pointer
  transition: transform 0.2s ease, box-shadow 0.2s ease

.primary-cta:hover
  transform: translateY(-1px)
  box-shadow: 0 10px 24px color-mix(in srgb, $primaryColor 30%, transparent)

.ghost-cta
  padding: 12px 16px
  border: 1px solid $borderColor
  border-radius: 10px
  color: $txtColor
  transition: all 0.2s ease

.ghost-cta:hover
  border-color: $primaryColor
  color: $primaryColor
  transform: translateY(-1px)

@media (max-width: 640px)
  .actions
    flex-direction: column
    align-items: stretch
</style>

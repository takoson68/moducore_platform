<script setup>
import { computed, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import { container } from "@/app/container";
import { voteService } from "../services/voteService.js";

const voteStore = container.resolve("voteStore");
const open = computed(() => voteStore.state.editorOpen);
const router = useRouter();
const authStore = container.resolve("auth");

const form = reactive({
  title: "",
  description: "",
  allowMultiple: false,
  ruleMode: "time",
  deadline: "",
  totalVoters: 0,
  anonymous: false,
  options: [
    { id: "opt-1", label: "選項 1" },
    { id: "opt-2", label: "選項 2" },
  ],
});

const ruleModes = [
  { value: "all", label: "人員都投完即時開票" },
  { value: "time", label: "時間到開票" },
];

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) resetForm();
  }
);

function resetForm() {
  Object.assign(form, {
    title: "",
    description: "",
    allowMultiple: false,
    ruleMode: "time",
    deadline: "",
    totalVoters: 0,
    options: [
      { id: `opt-${Date.now()}-1`, label: "選項 1" },
      { id: `opt-${Date.now()}-2`, label: "選項 2" },
    ],
  });
}

function addOption() {
  const nextId = `opt-${Date.now()}-${form.options.length + 1}`;
  form.options.push({ id: nextId, label: `選項 ${form.options.length + 1}` });
}

function removeOption(idx) {
  if (form.options.length <= 1) return;
  form.options.splice(idx, 1);
}

async function handleSubmit() {
  if (!form.title.trim()) {
    alert("請填入標題");
    return;
  }
  const cleanOptions = form.options
    .map((o) => ({ ...o, label: o.label.trim() }))
    .filter((o) => o.label);
  if (cleanOptions.length === 0) {
    alert("至少需要一個選項");
    return;
  }
  const payload = {
    title: form.title.trim(),
    description: form.description.trim(),
    allowMultiple: form.allowMultiple,
    anonymous: form.anonymous,
    publisher: authStore.state.user?.name || "未指定",
    rule: {
      mode: form.ruleMode,
      deadline: form.ruleMode === "time" && form.deadline ? form.deadline : null,
      totalVoters: form.ruleMode === "all" ? Number(form.totalVoters) || 0 : 0,
    },
    options: cleanOptions.map((o) => ({ ...o, votes: 0 })),
    status: "open",
    votesReceived: 0,
  };
  try {
    await voteService.create(payload);
    voteStore.closeEditor();
  } catch (err) {
    console.error("[voteCreate] save failed", err);
    alert("建立失敗，請稍後再試");
  }
}

function close() {
  voteStore.closeEditor();
  if (router.currentRoute.value.path !== "/vote") {
    router.replace("/vote");
  }
}
</script>

<template lang="pug">
.editor-wrap(v-if="open" @click.self="close")
  .panel
    .panel-header
      .titles
        p.kicker Vote Center
        h3 新增投票
        p.subtitle 設定標題、選項與開票規則。
      button.close-btn(type="button" @click="close") X

    form.panel-body(@submit.prevent="handleSubmit")
      .form-grid
        .field.span2
          span.label 標題
          input(v-model="form.title" type="text" placeholder="輸入投票標題")
        .field.span2
          span.label 描述
          textarea(v-model="form.description" rows="3" placeholder="補充說明（選填）")

        .field.card
          .card-head
            span.label 投票型態
            p.subtext 單/多選與記名/匿名可自由搭配。
          .segmented
            button.segment(
              type="button"
              :class="{ active: !form.allowMultiple }"
              @click="form.allowMultiple = false"
            ) 單選
            button.segment(
              type="button"
              :class="{ active: form.allowMultiple }"
              @click="form.allowMultiple = true"
            ) 多選
          .segmented
            button.segment(
              type="button"
              :class="{ active: !form.anonymous }"
              @click="form.anonymous = false"
            ) 記名
            button.segment(
              type="button"
              :class="{ active: form.anonymous }"
              @click="form.anonymous = true"
            ) 匿名

        .field.card
          .card-head
            span.label 開票規則
            p.subtext 依條件自動開票，或隨時手動開票。
          .rule-list
            label.rule-row(v-for="m in ruleModes" :key="m.value")
              input(type="radio" :value="m.value" v-model="form.ruleMode")
              .rule-text
                p.title {{ m.label }}
                p.hint(v-if="m.value === 'all'") 全員投完即開票，未投視為棄權。
                p.hint(v-else) 到時間自動開票，未投視為棄權。
          .inline-fields(v-if="form.ruleMode === 'time'")
            label.field
              span.label 開票時間
              input(type="datetime-local" v-model="form.deadline")
          .inline-fields(v-else)
            label.field
              span.label 投票人數（全員投完即開票）
              input(type="number" min="0" v-model.number="form.totalVoters" placeholder="例如 10")

        .options.span2
          .options-head
            h4 選項
            button.ghost(type="button" @click="addOption") 新增選項
          .option-row(v-for="(opt, idx) in form.options" :key="opt.id")
            input(type="text" v-model="opt.label" :placeholder="`選項 ${idx + 1}`")
            button.icon-btn(type="button" @click="removeOption(idx)" :disabled="form.options.length <= 1") 🗑️

      .footer
        button.ghost(type="button" @click="close") 取消
        button.primary(type="submit") 建立
</template>

<style scoped lang="sass">
@use '/src/styles/sass/vars' as *

*
  box-sizing: border-box

.editor-wrap
  position: fixed
  inset: 0
  background: color-mix(in srgb, var(--text) 18%, transparent)
  backdrop-filter: blur(2px)
  display: flex
  justify-content: flex-end
  z-index: 20

.panel
  width: min(560px, 92vw)
  height: 100%
  background: linear-gradient(175deg, var(--sys-1), color-mix(in srgb, var(--primary) 12%, var(--sys-1)))
  color: $txtColor
  box-shadow: -16px 0 28px rgba(12, 27, 61, 0.35)
  border-left: 1px solid $borderColor
  display: flex
  flex-direction: column
  animation: slide-in .25s ease

@keyframes slide-in
  from
    transform: translateX(12px)
    opacity: 0
  to
    transform: translateX(0)
    opacity: 1

.panel-header
  display: flex
  align-items: flex-start
  justify-content: space-between
  padding: 22px 24px
  border-bottom: 1px solid $borderColor

.titles h3
  margin: 4px 0 6px 0
  font-size: 22px

.titles .kicker
  margin: 0
  letter-spacing: 0.08em
  text-transform: uppercase
  color: $primaryColor
  font-size: 12px
  font-weight: 700

.subtitle
  margin: 0
  color: $sys_9
  opacity: 0.86
  font-size: 13px

.close-btn
  border: none
  background: color-mix(in srgb, var(--primary) 10%, transparent)
  color: $txtColor
  width: 32px
  height: 32px
  border-radius: 10px
  cursor: pointer

.panel-body
  flex: 1
  padding: 20px 24px 24px
  display: flex
  flex-direction: column
  gap: 16px
  overflow-y: auto

.form-grid
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))
  gap: 16px 14px

.field
  display: flex
  flex-direction: column
  gap: 6px
  color: $txtColor

.field.card
  padding: 12px
  border: 1px solid $borderColor
  border-radius: 12px
  background: color-mix(in srgb, var(--sys-1) 94%, var(--primary) 6%)
  gap: 10px
  display: flex
  flex-direction: column

.field.span2
  grid-column: span 2

.label
  font-size: 13px
  color: $sys_9

.subtext
  margin: 4px 0 0
  color: $sys_9
  font-size: 12px
  line-height: 1.4

.card-head
  display: flex
  justify-content: space-between
  align-items: baseline
  gap: 10px

input, textarea, select
  width: 100%
  padding: 10px 12px
  border-radius: 10px
  border: 1px solid $borderColor
  background: color-mix(in srgb, var(--sys-1) 92%, var(--primary) 8%)
  color: $txtColor
  outline: none
  transition: border 0.15s ease

input:focus, textarea:focus, select:focus
  border-color: $primaryColor

.segmented
  display: grid
  grid-template-columns: repeat(2, 1fr)
  gap: 8px

.segment
  padding: 12px
  border-radius: 12px
  border: 1px solid $borderColor
  background: $sysBg
  cursor: pointer
  font-weight: 700
  color: $txtColor
  transition: border .15s ease, background .15s ease

.segment.active
  border-color: $primaryColor
  background: color-mix(in srgb, var(--primary) 14%, var(--sys-1))

fieldset
  border: 1px solid $borderColor
  border-radius: 12px
  padding: 12px
  background: color-mix(in srgb, var(--sys-1) 92%, var(--primary) 8%)

legend
  padding: 0 6px
  font-weight: 700
  color: $sys_9

.rule-list
  display: flex
  flex-direction: column
  gap: 10px

.card-head
  display: flex
  justify-content: space-between
  align-items: center
  gap: 10px
  padding-bottom: 4px
  border-bottom: 1px dashed $borderColor
  flex-direction: column

.card-head .label
  font-size: 15px
  font-weight: 800
  color: $txtColor

.rule-row
  display: grid
  grid-template-columns: auto 1fr
  gap: 10px
  align-items: start
  padding: 8px
  border: 1px solid $borderColor
  border-radius: 10px
  background: color-mix(in srgb, var(--sys-1) 96%, var(--primary) 4%)

.rule-text .title
  margin: 0
  font-weight: 700
  color: $txtColor

.rule-text .hint
  margin: 2px 0 0 0
  color: $sys_9
  font-size: 12px

.inline-fields
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))
  gap: 10px

.options
  margin-top: 4px
  display: flex
  flex-direction: column
  gap: 8px

.options-head
  display: flex
  justify-content: space-between
  align-items: center

.option-row
  display: grid
  grid-template-columns: 1fr auto
  gap: 8px

.icon-btn
  border: 1px solid $borderColor
  background: $sysBg
  border-radius: 10px
  width: 36px
  height: 36px
  cursor: pointer

.ghost
  align-self: flex-start
  padding: 8px 12px
  border-radius: 10px
  border: 1px solid $borderColor
  background: transparent
  cursor: pointer

.footer
  display: flex
  justify-content: flex-end
  gap: 10px
  padding-top: 10px
  border-top: 1px solid $borderColor

.ghost, .primary
  border-radius: 12px
  padding: 10px 16px
  cursor: pointer
  border: 1px solid transparent
  font-weight: 700

.primary
  background: linear-gradient(135deg, $primaryColor, color-mix(in srgb, var(--primary) 70%, var(--sys-4)))
  color: $sys_1
  border: none

.ghost:hover, .primary:hover
  opacity: 0.92
</style>

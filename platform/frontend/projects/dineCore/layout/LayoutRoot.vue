<script setup>
import { computed, reactive, ref, watch, watchEffect } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import world from '@/world.js'

const route = useRoute()
const devMenuOpen = ref(false)

function safeStore(name) {
  return world.hasStore(name) ? world.store(name) : null
}

function hasRoute(path) {
  return world.router().getRoutes().some(record => record.path === path)
}

const cartStore = safeStore('dineCoreCartStore')
const entryStore = safeStore('dineCoreEntryStore')
const staffAuthStore = safeStore('dineCoreStaffAuthStore')

const loginForm = reactive({
  account: 'manager',
  password: 'manager123'
})

const guestRouteRegistry = [
  { key: 'entry', label: '入口', path: '/t/:tableCode', to: tableCode => `/t/${tableCode}` },
  { key: 'menu', label: '菜單', path: '/t/:tableCode/menu', to: tableCode => `/t/${tableCode}/menu` },
  { key: 'cart', label: '購物車', path: '/t/:tableCode/cart', to: tableCode => `/t/${tableCode}/cart` },
  { key: 'confirm', label: '確認訂單', path: '/t/:tableCode/checkout', to: tableCode => `/t/${tableCode}/checkout` },
  {
    key: 'success',
    label: '送單成功',
    path: '/t/:tableCode/checkout/success/:orderId',
    to: (tableCode, orderId) => `/t/${tableCode}/checkout/success/${orderId}`
  },
  {
    key: 'tracker',
    label: '追單',
    path: '/t/:tableCode/order/:orderId',
    to: (tableCode, orderId) => `/t/${tableCode}/order/${orderId}`
  },
  {
    key: 'unavailable',
    label: '暫停接單',
    path: '/t/:tableCode/unavailable',
    to: tableCode => `/t/${tableCode}/unavailable`
  }
]

const staffRouteRegistry = [
  {
    key: 'counter',
    label: '櫃台訂單',
    path: '/staff/counter/orders',
    to: '/staff/counter/orders',
    roles: ['counter', 'deputy_manager', 'manager']
  },
  {
    key: 'counter-detail',
    label: '櫃台明細',
    path: '/staff/counter/orders/:orderId',
    to: orderId => `/staff/counter/orders/${orderId}`,
    roles: ['counter', 'deputy_manager', 'manager']
  },
  {
    key: 'kitchen',
    label: '廚房看板',
    path: '/staff/kitchen/board',
    to: '/staff/kitchen/board',
    roles: ['kitchen', 'deputy_manager', 'manager']
  },
  {
    key: 'dashboard',
    label: '營運總覽',
    path: '/staff/manager/dashboard',
    to: '/staff/manager/dashboard',
    roles: ['deputy_manager', 'manager']
  },
  {
    key: 'menu-admin',
    label: '商品管理',
    path: '/staff/manager/menu-items',
    to: '/staff/manager/menu-items',
    roles: ['deputy_manager', 'manager']
  },
  {
    key: 'table-admin',
    label: '桌號管理',
    path: '/staff/manager/tables',
    to: '/staff/manager/tables',
    roles: ['counter', 'deputy_manager', 'manager']
  }
]

const isStaffRoute = computed(() => route.path.startsWith('/staff/'))
const currentTableCode = computed(() => String(route.params.tableCode || 'A01'))
const currentOrderId = computed(() => String(route.params.orderId || 'demo-order'))

const cartState = computed(() => cartStore?.state || { carts: [] })
const entryState = computed(() => entryStore?.state || { latestOrderId: '', latestOrderNo: '' })
const authState = computed(() => staffAuthStore?.state || {
  initialized: true,
  isSubmitting: false,
  errorMessage: '',
  session: null
})

const staffSession = computed(() => authState.value.session || null)
const isStaffAuthenticated = computed(() => Boolean(staffSession.value))
const currentStaffRole = computed(() => String(staffSession.value?.role || ''))
const currentRouteStaffRoles = computed(() =>
  Array.isArray(route.meta?.staffRoles) ? route.meta.staffRoles : []
)

const isStaffUnauthorized = computed(() => {
  if (!isStaffRoute.value || !isStaffAuthenticated.value) return false
  if (currentRouteStaffRoles.value.length === 0) return false

  return !currentRouteStaffRoles.value.includes(currentStaffRole.value)
})

const cartItemCount = computed(() =>
  (cartState.value.carts || []).reduce((sum, cart) => sum + Number(cart.itemCount || 0), 0)
)

const latestOrderId = computed(() => String(entryState.value.latestOrderId || '').trim())
const latestOrderNo = computed(() => String(entryState.value.latestOrderNo || '').trim())
const hasLatestOrder = computed(() => Boolean(latestOrderId.value))

const guestNavItems = computed(() => {
  const items = []

  if (hasRoute('/t/:tableCode/menu')) {
    items.push({
      key: 'menu',
      label: '菜單',
      to: `/t/${currentTableCode.value}/menu`
    })
  }

  if (hasRoute('/t/:tableCode/cart')) {
    items.push({
      key: 'cart',
      label: '購物車',
      to: `/t/${currentTableCode.value}/cart`,
      badge: cartItemCount.value > 0 ? String(cartItemCount.value) : ''
    })
  }

  if (hasRoute('/t/:tableCode/order/:orderId')) {
    items.push({
      key: 'tracker',
      label: '追單',
      to: hasLatestOrder.value ? `/t/${currentTableCode.value}/order/${latestOrderId.value}` : '',
      disabled: !hasLatestOrder.value,
      hint: hasLatestOrder.value ? '' : '尚無可追蹤訂單'
    })
  }

  return items
})

const staffNavItems = computed(() => {
  if (!staffSession.value) return []

  return staffRouteRegistry
    .filter(item => hasRoute(item.path))
    .filter(item => item.roles.includes(currentStaffRole.value))
    .filter(item => !item.path.includes(':orderId'))
    .map(item => ({
      key: item.key,
      label: item.label,
      to: typeof item.to === 'function' ? item.to(currentOrderId.value) : item.to
    }))
})

const devGuestLinks = computed(() =>
  guestRouteRegistry
    .filter(item => hasRoute(item.path))
    .filter(item => !item.path.includes(':orderId') || hasLatestOrder.value)
    .map(item => ({
      key: item.key,
      label: item.label,
      to: item.to(currentTableCode.value, latestOrderId.value)
    }))
)

const devStaffLinks = computed(() =>
  staffRouteRegistry
    .filter(item => hasRoute(item.path))
    .map(item => ({
      key: item.key,
      label: item.label,
      to: typeof item.to === 'function' ? item.to(currentOrderId.value) : item.to
    }))
)

watchEffect(() => {
  if (isStaffRoute.value) return

  if (cartStore && hasRoute('/t/:tableCode/cart')) {
    cartStore.load(currentTableCode.value)
  }

  if (entryStore) {
    entryStore.loadTableContext(currentTableCode.value)
  }
})

watchEffect(() => {
  if (staffAuthStore && !authState.value.initialized) {
    staffAuthStore.loadSession()
  }
})

watch(
  () => route.fullPath,
  () => {
    if (!isStaffRoute.value && cartStore && hasRoute('/t/:tableCode/cart')) {
      cartStore.load(currentTableCode.value)
    }
    devMenuOpen.value = false
  }
)

async function submitStaffLogin() {
  if (!staffAuthStore) return

  await staffAuthStore.login({
    account: loginForm.account,
    password: loginForm.password
  })
}

async function logout() {
  if (!staffAuthStore) return

  await staffAuthStore.logout()
  loginForm.account = 'manager'
  loginForm.password = 'manager123'
}

function clearLoginError() {
  if (!staffAuthStore) return
  staffAuthStore.clearError()
}

function toggleDevMenu() {
  devMenuOpen.value = !devMenuOpen.value
}

function closeDevMenu() {
  devMenuOpen.value = false
}
</script>

<template lang="pug">
.dine-root(:class="{ 'is-staff': isStaffRoute }")
  template(v-if="isStaffRoute")
    .staff-shell(v-if="isStaffAuthenticated || !staffAuthStore")
      header.staff-shell__head
        .staff-shell__topbar-main
          .staff-shell__brand
            strong.staff-shell__title DineCore 商家工作台
            span.staff-shell__meta(v-if="staffSession") {{ `${staffSession.name}｜${staffSession.account}` }}
            span.staff-shell__meta(v-else) 未載入員工登入模組
          button.staff-shell__logout(v-if="staffSession" type="button" @click="logout()") 登出
        nav.staff-shell__nav(v-if="staffNavItems.length > 0")
          RouterLink.staff-shell__nav-item(
            v-for="item in staffNavItems"
            :key="item.key"
            :to="item.to"
            :class="{ 'is-active': route.path.startsWith(item.to) }"
          ) {{ item.label }}

      main.staff-shell__body
        RouterView

      .staff-auth-mask(v-if="staffAuthStore && isStaffUnauthorized")
        .staff-auth-mask__backdrop
        .staff-auth-mask__panel
          .staff-auth-copy
            p.staff-auth-copy__eyebrow DineCore Staff
            h1.staff-auth-copy__title 目前帳號無法進入此頁面
            p.staff-auth-copy__lead 請改用具備權限的員工帳號登入，或返回可操作的工作頁面。
          form.staff-auth-form(@submit.prevent="submitStaffLogin()")
            label.staff-auth-form__field
              span.staff-auth-form__label 帳號
              input.staff-auth-form__input(
                v-model="loginForm.account"
                type="text"
                autocomplete="username"
                placeholder="請輸入員工帳號"
                @input="clearLoginError()"
              )
            label.staff-auth-form__field
              span.staff-auth-form__label 密碼
              input.staff-auth-form__input(
                v-model="loginForm.password"
                type="password"
                autocomplete="current-password"
                placeholder="請輸入登入密碼"
                @input="clearLoginError()"
              )
            p.staff-auth-form__error(v-if="authState.errorMessage") {{ authState.errorMessage }}
            button.staff-auth-form__submit(type="submit" :disabled="authState.isSubmitting")
              | {{ authState.isSubmitting ? '登入中...' : '切換帳號並登入' }}

    .staff-auth-full(v-else)
      .staff-auth-full__panel
        .staff-auth-copy
          p.staff-auth-copy__eyebrow DineCore Staff
          h1.staff-auth-copy__title 商家登入
          p.staff-auth-copy__lead 進入商家工作台前，請先使用員工帳號登入。註冊流程暫不開放，由管理者於後台建立帳號。
        form.staff-auth-form(@submit.prevent="submitStaffLogin()")
          label.staff-auth-form__field
            span.staff-auth-form__label 帳號
            input.staff-auth-form__input(
              v-model="loginForm.account"
              type="text"
              autocomplete="username"
              placeholder="請輸入員工帳號"
              @input="clearLoginError()"
            )
          label.staff-auth-form__field
            span.staff-auth-form__label 密碼
            input.staff-auth-form__input(
              v-model="loginForm.password"
              type="password"
              autocomplete="current-password"
              placeholder="請輸入登入密碼"
              @input="clearLoginError()"
            )
          p.staff-auth-form__error(v-if="authState.errorMessage") {{ authState.errorMessage }}
          button.staff-auth-form__submit(type="submit" :disabled="authState.isSubmitting")
            | {{ authState.isSubmitting ? '登入中...' : '登入' }}
          .staff-auth-form__hint
            span 開發預設帳號：
            code manager / manager123
            code deputy / deputy123
            code counter / counter123
            code kitchen / kitchen123

  template(v-else)
    .guest-shell
      header.guest-shell__head
        .guest-shell__topbar-main
          strong.guest-shell__topbar-title 顧客點餐
          span.guest-shell__topbar-meta {{ `${currentTableCode} 桌` }}
          span.guest-shell__topbar-meta(v-if="latestOrderNo") {{ `最近訂單 ${latestOrderNo}` }}
        nav.guest-shell__nav(v-if="guestNavItems.length > 0")
          template(v-for="item in guestNavItems" :key="item.key")
            RouterLink.guest-shell__nav-item(
              v-if="!item.disabled"
              :to="item.to"
              :class="{ 'is-active': route.path === item.to }"
            )
              span {{ item.label }}
              span.guest-shell__nav-badge(v-if="item.badge") {{ item.badge }}
            span.guest-shell__nav-item.is-disabled(v-else :title="item.hint")
              span {{ item.label }}
              small.guest-shell__nav-hint(v-if="item.hint") {{ item.hint }}

      main.guest-shell__body
        RouterView

  button.dev-menu-toggle(type="button" @click="toggleDevMenu()")
    span.dev-menu-toggle__title 開發選單
    small.dev-menu-toggle__hint 快速切換頁面
  section.dev-menu(v-if="devMenuOpen")
    .dev-menu__backdrop(@click="closeDevMenu()")
    .dev-menu__panel
      .dev-menu__head
        .dev-menu__title-block
          strong.dev-menu__title DineCore 開發選單
          p.dev-menu__meta 這裡只顯示目前專案已註冊的路由，模組未掛載時不會出現連結。
        button.dev-menu__close(type="button" @click="closeDevMenu()") 關閉

      .dev-menu__section(v-if="devGuestLinks.length > 0")
        h3.dev-menu__section-title 顧客端頁面
        .dev-menu__links
          RouterLink.dev-menu__link(
            v-for="item in devGuestLinks"
            :key="item.key"
            :to="item.to"
          ) {{ item.label }}

      .dev-menu__section(v-if="devStaffLinks.length > 0")
        h3.dev-menu__section-title 商家端頁面
        .dev-menu__links
          RouterLink.dev-menu__link(
            v-for="item in devStaffLinks"
            :key="item.key"
            :to="item.to"
          ) {{ item.label }}
</template>

<style lang="sass">
.dine-root
  min-height: 100vh
  background: linear-gradient(180deg, #f0fbf8 0%, #dff3f2 48%, #edf7f6 100%)

.guest-shell,
.staff-shell
  min-height: 100vh
  padding: 26px
  display: grid
  grid-template-rows: auto 1fr
  gap: 18px

.staff-auth-full
  min-height: 100vh
  display: grid
  place-items: center
  padding: 32px

.staff-auth-full__panel,
.staff-auth-mask__panel
  width: min(520px, 100%)
  padding: 28px
  border-radius: 28px
  background: rgba(255, 255, 255, 0.94)
  border: 1px solid rgba(109, 180, 177, 0.18)
  box-shadow: 0 24px 60px rgba(40, 88, 92, 0.16)
  display: grid
  gap: 20px
  position: relative
  z-index: 1

.staff-auth-copy
  display: grid
  gap: 8px

.staff-auth-copy__eyebrow
  margin: 0
  color: #5aa9a3
  font-size: 12px
  font-weight: 700
  letter-spacing: 0.08em
  text-transform: uppercase

.staff-auth-copy__title
  margin: 0
  color: #21393d
  font-size: 32px

.staff-auth-copy__lead
  margin: 0
  color: #6e8083
  line-height: 1.7

.staff-auth-form
  display: grid
  gap: 14px

.staff-auth-form__field
  display: grid
  gap: 8px

.staff-auth-form__label
  color: #51686b
  font-size: 13px
  font-weight: 700

.staff-auth-form__input
  width: 100%
  border: 1px solid rgba(109, 180, 177, 0.25)
  border-radius: 14px
  padding: 12px 14px
  font: inherit
  color: #243a3e
  background: #fff

.staff-auth-form__error
  margin: 0
  color: #b44b3a
  font-size: 13px
  font-weight: 700

.staff-auth-form__submit
  border: 0
  border-radius: 16px
  padding: 14px 16px
  background: linear-gradient(135deg, #7cd6cf 0%, #62c9c3 100%)
  color: #fff
  font-weight: 700
  cursor: pointer

.staff-auth-form__submit:disabled
  opacity: 0.6
  cursor: not-allowed

.staff-auth-form__hint
  display: flex
  flex-wrap: wrap
  gap: 8px
  color: #6e8083
  font-size: 12px

.staff-auth-form__hint code
  padding: 4px 8px
  border-radius: 999px
  background: rgba(121, 214, 207, 0.14)
  color: #486c70

.staff-auth-mask
  position: fixed
  inset: 0
  z-index: 60
  display: grid
  place-items: center
  padding: 32px

.staff-auth-mask__backdrop
  position: absolute
  inset: 0
  background: rgba(17, 40, 44, 0.52)
  backdrop-filter: blur(8px)

.staff-shell__head,
.guest-shell__head
  position: sticky
  top: 0
  z-index: 20
  width: calc(100% + 52px)
  margin: -26px -26px 0
  padding: 14px 26px 12px
  background: rgba(240, 251, 248, 0.94)
  backdrop-filter: blur(10px)
  border-bottom: 1px solid rgba(109, 180, 177, 0.18)

.staff-shell__head
  display: grid
  gap: 12px

.guest-shell__head
  display: grid
  grid-template-columns: 1fr
  align-items: start
  gap: 14px
  padding-top: 18px
  padding-bottom: 14px

.staff-shell__topbar-main,
.guest-shell__topbar-main
  display: flex
  align-items: center
  gap: 10px

.staff-shell__topbar-main
  justify-content: space-between

.guest-shell__topbar-main
  flex-wrap: wrap
  align-items: center
  gap: 8px 10px

.staff-shell__brand
  display: grid
  gap: 4px

.staff-shell__title,
.guest-shell__topbar-title
  color: #21393d

.staff-shell__title
  font-size: 18px

.guest-shell__topbar-title
  font-size: 18px
  font-weight: 800
  letter-spacing: 0.01em

.staff-shell__meta,
.guest-shell__topbar-meta
  color: #6e8083
  font-size: 13px

.guest-shell__topbar-meta
  display: inline-flex
  align-items: center
  min-height: 30px
  padding: 0 12px
  border-radius: 999px
  background: rgba(121, 214, 207, 0.12)
  color: #537174
  font-weight: 700

.staff-shell__logout
  margin-left: auto
  border: 0
  border-radius: 999px
  padding: 10px 14px
  background: rgba(121, 214, 207, 0.14)
  color: #2d6f6d
  font-weight: 700
  cursor: pointer

.staff-shell__nav,
.guest-shell__nav
  display: flex
  flex-wrap: wrap
  gap: 10px

.guest-shell__nav
  justify-content: flex-start
  align-items: center

.staff-shell__nav-item,
.guest-shell__nav-item
  padding: 9px 13px
  border-radius: 999px
  text-decoration: none
  background: rgba(255, 255, 255, 0.82)
  color: #5b7073
  font-size: 13px
  font-weight: 700
  border: 1px solid rgba(109, 180, 177, 0.16)
  display: inline-flex
  align-items: center
  gap: 8px

.staff-shell__nav-item.is-active,
.guest-shell__nav-item.is-active
  background: linear-gradient(135deg, #7cd6cf 0%, #62c9c3 100%)
  color: #fff

.guest-shell__nav-item.is-disabled
  opacity: 0.52
  cursor: default
  flex-direction: column
  align-items: flex-start
  gap: 2px

.guest-shell__nav-hint
  font-size: 10px
  font-weight: 600
  color: #7c8e91

.guest-shell__nav-badge
  min-width: 20px
  height: 20px
  padding: 0 6px
  border-radius: 999px
  background: #17383f
  color: #fff
  display: inline-grid
  place-items: center
  font-size: 11px
  font-weight: 700

.guest-shell__nav-item.is-active .guest-shell__nav-badge
  background: rgba(255, 255, 255, 0.22)

.guest-shell__body
  width: min(1120px, 100%)
  margin: 0 auto
  padding-top: 6px

.staff-shell__body,
.guest-shell__body
  min-height: 0

.dev-menu-toggle
  position: fixed
  right: 22px
  bottom: 22px
  z-index: 40
  border: 0
  border-radius: 18px
  padding: 12px 14px
  background: #17383f
  color: #fff
  display: grid
  gap: 2px
  box-shadow: 0 18px 36px rgba(23, 56, 63, 0.24)
  cursor: pointer

.dev-menu-toggle__title
  font-weight: 700

.dev-menu-toggle__hint
  opacity: 0.72

.dev-menu
  position: fixed
  inset: 0
  z-index: 45
  display: grid
  justify-items: end

.dev-menu__backdrop
  position: absolute
  inset: 0
  background: rgba(18, 40, 44, 0.34)

.dev-menu__panel
  position: relative
  width: min(420px, 100vw)
  height: 100vh
  padding: 22px
  background: rgba(250, 254, 253, 0.98)
  border-left: 1px solid rgba(109, 180, 177, 0.22)
  display: grid
  align-content: start
  gap: 18px
  overflow: auto

.dev-menu__head
  display: flex
  justify-content: space-between
  align-items: start
  gap: 16px

.dev-menu__title
  color: #21393d
  font-size: 20px

.dev-menu__meta
  margin: 4px 0 0
  color: #6e8083
  line-height: 1.6

.dev-menu__close
  border: 0
  border-radius: 999px
  padding: 10px 12px
  background: rgba(121, 214, 207, 0.14)
  color: #2d6f6d
  cursor: pointer

.dev-menu__section
  display: grid
  gap: 10px

.dev-menu__section-title
  margin: 0
  color: #21393d
  font-size: 15px

.dev-menu__links
  display: grid
  gap: 8px

.dev-menu__link
  padding: 12px 14px
  border-radius: 14px
  text-decoration: none
  background: #fff
  color: #395c60
  border: 1px solid rgba(109, 180, 177, 0.18)
  font-weight: 700

@media (max-width: 960px)
  .guest-shell,
  .staff-shell
    padding: 16px

  .guest-shell__head,
  .staff-shell__head
    width: calc(100% + 32px)
    margin: -16px -16px 0
    padding: 12px 16px 10px

@media (max-width: 640px)
  .guest-shell__topbar-main
    gap: 8px

  .guest-shell__head
    grid-template-columns: 1fr
    align-items: stretch
    gap: 12px

  .guest-shell__nav
    justify-content: flex-start

  .staff-shell__topbar-main
    gap: 12px

  .staff-auth-full,
  .staff-auth-mask
    padding: 18px

  .dev-menu__panel
    width: 100vw

  .dev-menu-toggle
    right: 16px
    bottom: 16px
</style>

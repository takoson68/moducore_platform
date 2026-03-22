<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import world from '@/world.js'
import StaffAuthPanel from '@project/components/StaffAuthPanel.vue'
import { useDineCoreStaffAuth } from '@project/services/dineCoreStaffAuthService.js'
import { useDineCoreOrderingFlow } from '@project/services/dineCoreOrderingFlowService.js'
import {
  buildStaffDevLinks,
  buildStaffNavItems,
  canAccessStaffRoute,
  resolveStaffLandingPath
} from '@project/services/dineCoreStaffShellService.js'

const route = useRoute()
const router = useRouter()
const staffAuth = useDineCoreStaffAuth()
const orderingFlow = useDineCoreOrderingFlow()
const devMenuOpen = ref(false)
const staffHeadMenuOpen = ref(false)
const demoTableCode = 'AB-001'
const isRevalidatingEntryContext = ref(false)
const lastEntryRevalidateAt = ref(0)

function hasRoute(path) {
  return world.router().getRoutes().some(record => record.path === path)
}

const guestRouteRegistry = [
  { key: 'entry', label: '入桌', path: '/t/:tableCode', to: tableCode => `/t/${tableCode}` },
  { key: 'menu', label: '菜單', path: '/t/:tableCode/menu', to: tableCode => `/t/${tableCode}/menu` },
  { key: 'cart', label: 'Cart', path: '/t/:tableCode/cart', to: tableCode => '/t/' + tableCode + '/cart' },
  { key: 'confirm', label: '確認訂單', path: '/t/:tableCode/checkout', to: tableCode => `/t/${tableCode}/checkout` },
  {
    key: 'success',
    label: '下單成功',
    path: '/t/:tableCode/checkout/success/:orderId',
    to: (tableCode, orderId) => `/t/${tableCode}/checkout/success/${orderId}`
  },
  {
    key: 'tracker',
    label: '訂單追蹤',
    path: '/t/:tableCode/order/:orderId',
    to: (tableCode, orderId) => `/t/${tableCode}/order/${orderId}`
  },
  {
    key: 'unavailable',
    label: '暫停點餐',
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
    key: 'reports',
    label: '營運報表',
    path: '/staff/manager/reports',
    to: '/staff/manager/reports',
    roles: ['deputy_manager', 'manager']
  },
  {
    key: 'visitor-stats',
    label: '每日IP訪客統計',
    path: '/staff/manager/visitor-stats',
    to: '/staff/manager/visitor-stats',
    roles: [],
    superAdminOnly: true
  },
  {
    key: 'audit-close',
    label: '關帳與稽核',
    path: '/staff/manager/audit-close',
    to: '/staff/manager/audit-close',
    roles: ['manager']
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
    label: '桌位管理',
    path: '/staff/manager/tables',
    to: '/staff/manager/tables',
    roles: ['counter', 'deputy_manager', 'manager']
  }
]

const isStaffRoute = computed(() => route.path.startsWith('/staff/'))
const currentTableCode = computed(() => String(route.params.tableCode || 'A01'))
const currentOrderId = computed(() => String(route.params.orderId || 'demo-order'))

const entryState = orderingFlow.entryState
const staffAuthStatus = staffAuth.status
const staffSession = staffAuth.session
const isStaffAuthChecking = staffAuth.isChecking
const isStaffGuest = staffAuth.isGuest
const showStaffAuthMask = computed(() => isStaffRoute.value && isStaffAuthChecking.value)

const orderId = computed(() => String(orderingFlow.guestShellState.value.orderId || '').trim())
const orderNo = computed(() => String(orderingFlow.guestShellState.value.orderNo || '').trim())
const canTrackOrder = computed(() => Boolean(orderingFlow.guestShellState.value.canTrackOrder))

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
      badge: orderingFlow.guestShellState.value.cartItemCount > 0
        ? String(orderingFlow.guestShellState.value.cartItemCount)
        : ''
    })
  }

  if (hasRoute('/t/:tableCode/order/:orderId')) {
    items.push({
      key: 'tracker',
      label: '訂單追蹤',
      to: canTrackOrder.value ? `/t/${currentTableCode.value}/order/${orderId.value}` : '',
      disabled: !canTrackOrder.value,
      hint: canTrackOrder.value ? '' : '尚未送單，暫時無法追蹤'
    })
  }

  return items
})

const isMenuRoute = computed(() => route.path.endsWith('/menu'))
const menuCategories = computed(() => orderingFlow.guestShellState.value.categories || [])
const activeMenuCategoryId = computed(() => orderingFlow.guestShellState.value.activeCategoryId || 'all')
const showCategoryRow = computed(() => isMenuRoute.value && menuCategories.value.length > 0)

function resolveAppRelativePath(pathLike) {
  const raw = String(pathLike || '').trim()
  if (!raw) return ''

  const baseUrl = String(import.meta.env.BASE_URL || '/')
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const normalizedPath = raw.replace(/^\.?\/*/, '')

  return `${normalizedBase}${normalizedPath}`
}

function getAppAbsoluteUrl(pathLike) {
  const resolvedPath = resolveAppRelativePath(pathLike)
  if (typeof window === 'undefined') return resolvedPath
  return `${window.location.origin}${resolvedPath}`
}

const demoQrImageUrl = computed(() => resolveAppRelativePath(`assets/QRC/${demoTableCode}.png`))
const demoEntryPath = computed(() => resolveAppRelativePath(`t/${demoTableCode}`))
const demoEntryUrl = computed(() => getAppAbsoluteUrl(`t/${demoTableCode}`))

const staffNavItems = computed(() => {
  if (!staffSession.value) return []

  return buildStaffNavItems(router, staffSession.value, currentOrderId.value)
})

const activeStaffNavItems = computed(() =>
  staffNavItems.value.filter(item => !item.disabled)
)

const plannedStaffNavItems = computed(() =>
  staffNavItems.value.filter(item => item.disabled)
)

const devGuestLinks = computed(() =>
  guestRouteRegistry
    .filter(item => hasRoute(item.path))
    .filter(item => !item.path.includes(':orderId') || canTrackOrder.value)
    .map(item => ({
      key: item.key,
      label: item.label,
      to: item.to(currentTableCode.value, orderId.value)
    }))
)

const devStaffLinks = computed(() => buildStaffDevLinks(router, currentOrderId.value))

watch(
  [() => isStaffRoute.value, () => currentTableCode.value],
  async ([isStaff, tableCode]) => {
    if (isStaff) {
      await staffAuth.bootstrap()
      return
    }

    await orderingFlow.ensureEntryContext(tableCode, entryState.value.orderingSessionToken)
  },
  { immediate: true }
)

watch(
  () => route.fullPath,
  () => {
    devMenuOpen.value = false
    staffHeadMenuOpen.value = false
  }
)

watch(
  [() => route.path, () => canTrackOrder.value],
  ([path, canTrack]) => {
    if (isStaffRoute.value || canTrack) return
    if (!/^\/t\/[^/]+\/order\/[^/]+$/.test(String(path || ''))) return
    if (!hasRoute('/t/:tableCode/cart')) return
    world.router().replace(`/t/${currentTableCode.value}/cart`)
  },
  { immediate: true }
)

watch(
  [() => staffAuthStatus.value, () => staffSession.value, () => route.matched.at(-1)?.path || ''],
  ([status, session, matchedPath]) => {
    if (!isStaffRoute.value || status !== 'auth' || !session || !matchedPath) return
    if (canAccessStaffRoute(router, matchedPath, session)) return

    const targetPath = resolveStaffLandingPath(router, session)
    if (!targetPath || route.path === targetPath) return

    router.replace(targetPath)
  }
)

async function handleStaffLogout() {
  await staffAuth.signOut()
  staffHeadMenuOpen.value = false
}

async function revalidateEntryContextOnResume() {
  if (isStaffRoute.value) return

  const now = Date.now()
  if (isRevalidatingEntryContext.value || now - lastEntryRevalidateAt.value < 1500) {
    return
  }

  isRevalidatingEntryContext.value = true
  lastEntryRevalidateAt.value = now

  try {
    await orderingFlow.revalidateEntryContext(currentTableCode.value)
  } finally {
    isRevalidatingEntryContext.value = false
  }
}

function handleWindowFocus() {
  revalidateEntryContextOnResume()
}

function handleVisibilityChange() {
  if (typeof document === 'undefined') return
  if (document.visibilityState !== 'visible') return
  revalidateEntryContextOnResume()
}

onMounted(() => {
  if (typeof window === 'undefined') return
  window.addEventListener('focus', handleWindowFocus)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return
  window.removeEventListener('focus', handleWindowFocus)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

function toggleDevMenu() {
  devMenuOpen.value = !devMenuOpen.value
}

function closeDevMenu() {
  devMenuOpen.value = false
}

function toggleStaffHeadMenu() {
  staffHeadMenuOpen.value = !staffHeadMenuOpen.value
}

function closeStaffHeadMenu() {
  staffHeadMenuOpen.value = false
}

function scrollGuestViewportToTop() {
  if (typeof window === 'undefined') return
  window.scrollTo({ top: 0, behavior: 'auto' })
}

function handleGuestCategorySelect(categoryId) {
  orderingFlow.setGuestMenuCategory(categoryId)
  scrollGuestViewportToTop()
}
</script>

<template lang="pug">
.dine-root(:class="{ 'is-staff': isStaffRoute, 'is-guest-shell': !isStaffRoute }")
  template(v-if="isStaffRoute")
    .staff-auth-mask(v-if="showStaffAuthMask")
      .staff-auth-mask__panel
        .staff-auth-mask__spinner
        p.staff-auth-mask__title 正在確認員工登入狀態
        p.staff-auth-mask__copy 請稍候，系統正在載入後台工作環境。

    .staff-shell(v-else-if="staffAuthStatus === 'auth'")
      button.staff-shell__mobile-toggle(
        v-if="staffSession"
        type="button"
        @click="toggleStaffHeadMenu()"
      ) {{ staffHeadMenuOpen ? '關閉選單' : '選單' }}
      .staff-shell__mobile-backdrop(
        v-if="staffSession && staffHeadMenuOpen"
        @click="closeStaffHeadMenu()"
      )
      aside.staff-shell__head(:class="{ 'is-mobile-open': staffHeadMenuOpen }")
        .staff-shell__topbar-main
          .staff-shell__brand
            strong.staff-shell__title DineCore 員工後台
            span.staff-shell__meta(v-if="staffSession") {{ `${staffSession.name} | ${staffSession.account}` }}
            span.staff-shell__meta(v-else) 尚未登入員工帳號

          .staff-shell__actions(v-if="staffSession")
            button.staff-shell__logout(type="button" @click="handleStaffLogout()") 登出
        nav.staff-shell__nav(v-if="staffNavItems.length > 0")
          RouterLink.staff-shell__nav-item(
            v-for="item in activeStaffNavItems"
            :key="item.key"
            :to="item.to"
            @click="closeStaffHeadMenu()"
            :class="{ 'is-active': route.path.startsWith(item.to) }"
          ) {{ item.label }}
          .staff-shell__planned(v-if="plannedStaffNavItems.length > 0")
            span.staff-shell__planned-title 下個階段功能
            span.staff-shell__nav-item.is-disabled(
              v-for="item in plannedStaffNavItems"
              :key="item.key"
            ) {{ item.label }}

      main.staff-shell__body
        RouterView
        #staff-shell-overlay-root.staff-shell__overlay-root

    StaffAuthPanel(
      v-else-if="isStaffGuest"
      :demo-table-code="demoTableCode"
      :demo-qr-image-url="demoQrImageUrl"
      :demo-entry-path="demoEntryPath"
      :demo-entry-url="demoEntryUrl"
    )

  template(v-else)
    .guest-shell
      header.guest-shell__head
        .guest-shell__topbar-main
          strong.guest-shell__topbar-title 桌邊點餐
          span.guest-shell__topbar-meta {{ "Table " + currentTableCode }}
          span.guest-shell__topbar-meta(v-if="orderNo") {{ "Order " + orderNo }}
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
        section.category-row.guest-shell__category-row(v-if="showCategoryRow")
          button.category-chip(
            v-for="category in menuCategories"
            :key="category.id"
            type="button"
            :class="{ 'is-active': activeMenuCategoryId === category.id }"
            @click="handleGuestCategorySelect(category.id)"
          ) {{ category.name }}

      main.guest-shell__body
        RouterView

  button.dev-menu-toggle(type="button" @click="toggleDevMenu()")
    span.dev-menu-toggle__title 切換
  section.dev-menu(v-if="devMenuOpen")
    .dev-menu__backdrop(@click="closeDevMenu()")
    .dev-menu__panel
      .dev-menu__head
        .dev-menu__title-block
          strong.dev-menu__title DineCore 開發捷徑
          p.dev-menu__meta 僅供本機測試使用，不影響正式訂餐流程。
        button.dev-menu__close(type="button" @click="closeDevMenu()") 關閉

      .dev-menu__section(v-if="devGuestLinks.length > 0")
        h3.dev-menu__section-title 顧客路由
        .dev-menu__links
          RouterLink.dev-menu__link(
            v-for="item in devGuestLinks"
            :key="item.key"
            :to="item.to"
          ) {{ item.label }}

      .dev-menu__section(v-if="devStaffLinks.length > 0")
        h3.dev-menu__section-title 員工路由
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

.dine-root.is-guest-shell
  width: min(540px, 100%)
  margin: 0 auto
  box-shadow: 0 0 16px #c7c7c7

.guest-shell,
.staff-shell
  min-height: 100vh
  display: grid
  gap: 18px

.guest-shell
  padding: 26px
  grid-template-rows: auto 1fr

.staff-shell
  grid-template-columns: 220px minmax(0, 1fr)
  gap: 0
  align-items: stretch
  background: #eef4f6

.staff-shell__mobile-toggle,
.staff-shell__mobile-backdrop
  display: none

.staff-auth-mask
  min-height: 100vh
  display: grid
  place-items: center
  padding: 32px
  background: linear-gradient(180deg, rgba(238, 244, 246, 0.98) 0%, rgba(227, 239, 241, 0.98) 100%)

.staff-auth-mask__panel
  width: min(420px, 100%)
  padding: 28px 24px
  border-radius: 24px
  background: rgba(255, 255, 255, 0.92)
  border: 1px solid rgba(109, 180, 177, 0.18)
  box-shadow: 0 24px 56px rgba(21, 36, 44, 0.12)
  display: grid
  justify-items: center
  gap: 12px
  text-align: center

.staff-auth-mask__spinner
  width: 44px
  height: 44px
  border-radius: 999px
  border: 4px solid rgba(109, 180, 177, 0.2)
  border-top-color: #58b8b1
  animation: staff-auth-mask-spin 0.8s linear infinite

.staff-auth-mask__title
  margin: 0
  color: #21393d
  font-size: 18px
  font-weight: 800

.staff-auth-mask__copy
  margin: 0
  color: #62797d
  line-height: 1.6

.staff-auth-full
  min-height: 100vh
  display: grid
  place-items: center
  padding: 32px
  position: relative
  overflow: hidden
  isolation: isolate
  background: #000

.staff-auth-full::before
  content: ''
  position: absolute
  inset: 0
  z-index: 0
  background: linear-gradient(180deg, rgba(17, 36, 40, 0.48) 0%, rgba(17, 36, 40, 0.36) 100%), url('https://images.pexels.com/photos/4669298/pexels-photo-4669298.jpeg') center / cover no-repeat
  opacity: 0.58

.staff-auth-full__panel
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

.staff-demo-qr
  display: grid
  gap: 10px
  padding: 16px
  border-radius: 20px
  background: rgba(255, 255, 255, 0.94)
  border: 1px dashed rgba(109, 180, 177, 0.5)
  box-shadow: 0 14px 32px rgba(40, 88, 92, 0.16)

.staff-demo-qr--floating
  position: fixed
  right: 20px
  top: 24px
  width: min(300px, calc(100vw - 40px))
  z-index: 50

.staff-demo-qr__eyebrow
  margin: 0
  color: #3f7e7a
  font-size: 12px
  font-weight: 700
  letter-spacing: 0.08em
  text-transform: uppercase

.staff-demo-qr__title
  margin: 0
  font-size: 18px
  color: #224246

.staff-demo-qr__copy
  margin: 0
  color: #4d6f72
  line-height: 1.6

.staff-demo-qr__image
  width: min(220px, 100%)
  border-radius: 16px
  background: #fff
  border: 1px solid rgba(109, 180, 177, 0.22)
  padding: 8px

.staff-demo-qr__link
  color: #1e6663
  font-weight: 700
  word-break: break-all
  text-decoration: none

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

.staff-auth-form__demo-fill
  display: inline-flex
  align-items: center
  gap: 6px
  padding: 0
  border: 0
  background: transparent
  color: inherit
  cursor: pointer

.staff-auth-form__demo-fill code
  padding: 4px 8px
  border-radius: 999px
  background: rgba(121, 214, 207, 0.14)
  color: #486c70

.staff-auth-form__demo-fill span
  color: #4b8a85
  font-weight: 700

.staff-auth-form__demo-fill:hover code
  background: rgba(121, 214, 207, 0.24)

.staff-auth-form__demo-fill:focus-visible
  outline: 2px solid rgba(98, 201, 195, 0.45)
  outline-offset: 4px

.staff-shell__head,
.guest-shell__head
  position: sticky
  top: 0
  z-index: 20
  backdrop-filter: blur(10px)

.staff-shell__head
  display: grid
  gap: 18px
  width: 100%
  margin: 0
  padding: 52px 18px 24px
  background: #15242c
  color: #f3f7f8
  border: 0
  border-radius: 0
  height: 100vh
  max-height: 100vh
  align-content: start
  box-sizing: border-box

.guest-shell__head
  background: rgba(240, 251, 248, 0.94)
  width: calc(100% + 52px)
  margin: -26px -26px 0
  padding: 14px 26px 12px
  display: grid
  grid-template-columns: 1fr
  align-items: start
  gap: 14px
  padding-top: 18px
  padding-bottom: 14px
  border-bottom: 1px solid rgba(109, 180, 177, 0.18)

.staff-shell__topbar-main,
.guest-shell__topbar-main
  display: flex
  align-items: center
  gap: 10px

.staff-shell__topbar-main
  flex-direction: column
  align-items: flex-start
  gap: 10px

.guest-shell__topbar-main
  flex-wrap: wrap
  align-items: center
  gap: 8px 10px

.staff-shell__brand
  display: grid
  gap: 6px

.staff-shell__title,
.guest-shell__topbar-title
  color: #21393d

.staff-shell__title
  color: #f4f8f9
  font-size: 20px
  font-weight: 800
  letter-spacing: 0.01em

.guest-shell__topbar-title
  font-size: 18px
  font-weight: 800
  letter-spacing: 0.01em

.staff-shell__meta,
.guest-shell__topbar-meta
  color: #6e8083
  font-size: 13px

.staff-shell__meta
  color: rgba(233, 242, 245, 0.72)
  line-height: 1.5

.guest-shell__topbar-meta
  display: inline-flex
  align-items: center
  min-height: 30px
  padding: 0 12px
  border-radius: 999px
  background: rgba(121, 214, 207, 0.12)
  color: #537174
  font-weight: 700

.staff-shell__actions
  position: fixed
  top: 12px
  right: 16px
  z-index: 30
  display: inline-flex
  gap: 8px

.staff-shell__logout
  border: 1px solid rgba(21, 36, 44, 0.12)
  border-radius: 999px
  padding: 7px 11px
  background: rgba(255, 255, 255, 0.94)
  color: #1c3138
  font-size: 12px
  font-weight: 800
  line-height: 1
  cursor: pointer
  box-shadow: 0 12px 24px rgba(21, 36, 44, 0.12)

.staff-shell__logout:hover
  background: #ffffff
  color: #fff
  color: #15242c

.staff-shell__nav,
.guest-shell__nav
  display: flex
  flex-wrap: wrap
  gap: 10px

.staff-shell__nav
  flex-direction: column
  flex-wrap: nowrap

.guest-shell__nav
  justify-content: flex-start
  align-items: center

.guest-shell__category-anchor
  position: relative
  width: 100%
  min-height: 60px
  display: block
  margin: 0
  padding: 0

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

.staff-shell__nav-item
  width: 100%
  min-height: 50px
  padding: 12px 14px
  border-radius: 0
  justify-content: flex-start
  background: transparent
  color: rgba(233, 242, 245, 0.74)
  border: 0
  border-left: 3px solid transparent

.staff-shell__nav-item:hover
  background: rgba(255, 255, 255, 0.06)
  color: #ffffff

.staff-shell__nav-item.is-active,
.guest-shell__nav-item.is-active
  background: linear-gradient(135deg, #7cd6cf 0%, #62c9c3 100%)
  color: #fff

.staff-shell__nav-item.is-active
  border-left-color: #7cd6cf
  background: rgba(124, 214, 207, 0.18)
  color: #f5fbfb

.staff-shell__planned
  margin-top: 10px
  display: grid
  gap: 8px

.staff-shell__planned-title
  color: rgba(233, 242, 245, 0.52)
  font-size: 11px
  font-weight: 700
  letter-spacing: 0.08em
  text-transform: uppercase

.staff-shell__nav-item.is-disabled
  width: 100%
  min-height: 50px
  padding: 12px 14px
  border-radius: 0
  justify-content: flex-start
  background: rgba(255, 255, 255, 0.04)
  color: rgba(233, 242, 245, 0.38)
  border: 0
  border-left: 3px solid rgba(233, 242, 245, 0.18)
  cursor: not-allowed

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

.staff-shell__content
  min-width: 0
  display: grid
  grid-template-rows: auto 1fr
  gap: 14px

.staff-shell__body
  position: relative
  width: 100%
  min-width: 0
  margin: 0
  padding: 56px 28px 28px 24px
  box-sizing: border-box

.staff-shell__overlay-root
  position: absolute
  inset: 0
  pointer-events: none
  z-index: 20

.staff-shell__body,
.guest-shell__body
  min-height: 0

.dev-menu-toggle
  position: fixed
  right: 14px
  bottom: 14px
  z-index: 40
  border: 0
  border-radius: 999px
  width: 56px
  height: 56px
  background: #17383f
  color: #fff
  display: grid
  place-items: center
  box-shadow: 0 10px 20px rgba(23, 56, 63, 0.22)
  cursor: pointer

.dev-menu-toggle__title
  font-weight: 700
  font-size: 13px

.dev-menu-toggle__hint
  opacity: 0.72
  display: none

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
  .dine-root.is-guest-shell
    width: 100%

  .guest-shell,
  .staff-shell
    padding: 16px

  .staff-shell
    padding: 0

  .guest-shell
    padding: 16px

  .guest-shell__head
    width: calc(100% + 32px)
    margin: -16px -16px 0
    padding: 12px 16px 10px

  .staff-shell__actions
    top: 10px
    right: 10px

  .staff-demo-qr--floating
    position: static
    width: min(520px, 100%)
    margin-top: 12px

@media (max-width: 768px)
  .staff-shell
    grid-template-columns: 1fr

  .staff-shell__mobile-toggle
    position: fixed
    top: 10px
    left: 10px
    z-index: 36
    display: inline-flex
    align-items: center
    justify-content: center
    border: 0
    border-radius: 999px
    padding: 10px 14px
    background: rgba(21, 36, 44, 0.92)
    color: #f4f8f9
    font-weight: 700
    box-shadow: 0 12px 24px rgba(21, 36, 44, 0.24)

  .staff-shell__mobile-backdrop
    display: block
    position: fixed
    inset: 0
    z-index: 34
    background: rgba(17, 40, 44, 0.42)

  .staff-shell__head
    position: fixed
    top: 0
    left: 0
    width: min(280px, 82vw)
    height: 100vh
    max-height: 100vh
    padding: 56px 16px 16px
    z-index: 35
    transform: translateX(-106%)
    transition: transform 0.22s ease

  .staff-shell__head.is-mobile-open
    transform: translateX(0)

  .staff-shell__actions
    position: static
    top: auto
    right: auto

  .staff-shell__body
    padding: 52px 16px 24px

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
    gap: 8px

  .staff-auth-full
    padding: 18px

  .dev-menu__panel
    width: 100vw

  .dev-menu-toggle
    right: 12px
    bottom: 12px
    width: 50px
    height: 50px

.guest-shell__category-row
  margin: 0
  padding-top: 6px

.guest-shell__category-row .category-chip
  font-size: 14px
  padding: 8px 10px
  border-radius: 0
  border-bottom-width: 2px
  border-bottom-style: solid

@keyframes staff-auth-mask-spin
  from
    transform: rotate(0deg)
  to
    transform: rotate(360deg)
</style>

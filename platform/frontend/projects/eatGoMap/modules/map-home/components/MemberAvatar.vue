<script setup>
defineProps({
  memberId: { type: String, required: true }
})
</script>

<template lang="pug">
svg(viewBox="0 0 48 48" aria-hidden="true" focusable="false")
  template(v-if="memberId === 'female'")
    circle(cx="24" cy="24" r="24" fill="#c9e8df")
    path(d="M7 46c1-9 7-13 17-13s16 4 17 13Z" fill="#527e6f")
    path(d="M12 35c-4-4 1-8 1-14 0-8 5-12 11-12s12 5 12 12c0 6 5 10 1 14-3 3-7 1-13 1s-9 2-12-1Z" fill="#3d2b25")
    path(d="M20 31h8v8l-4 6-4-6Z" fill="#f6c3a2")
    path(d="M16 21c4 0 7-3 8-6 2 3 5 5 8 6v4c0 6-4 10-8 10s-8-4-8-10Z" fill="#ffdbc0")
    path(d="M7 17c1-3 4-4 7-5l2-6c4-3 12-3 16 0l2 6c4 1 7 3 7 5-1 3-5 3-7 2-4-7-16-7-20 0-2 1-6 1-7-2Z" fill="#e6c58b")
    path(d="M15 11c6-2 12-2 18 0" fill="none" stroke="#8d6347" stroke-width="2")
    circle(cx="21" cy="25" r="1" fill="#3d2b25")
    circle(cx="27" cy="25" r="1" fill="#3d2b25")
    path(d="M22 29q2 2 4 0" fill="none" stroke="#c87168" stroke-linecap="round")
  template(v-else)
    circle(cx="24" cy="24" r="24" fill="#d7e9f4")
    path(d="M7 46c1-9 7-13 17-13s16 4 17 13Z" fill="#3d6d87")
    path(d="M20 30h8v8l-4 4-4-4Z" fill="#eeb998")
    path(d="M14 19c0-7 4-11 10-11s10 4 10 11v6c0 6-4 10-10 10s-10-4-10-10Z" fill="#ffdbc0")
    path(d="M14 23c-4-3-3-10 1-14 4-4 13-5 17 0 5 2 6 9 2 14l-2-7c-6 1-10-1-12-4-1 4-3 6-6 7Z" fill="#362d30")
    circle(cx="20" cy="24" r="1" fill="#362d30")
    circle(cx="28" cy="24" r="1" fill="#362d30")
    path(d="M22 29q2 2 4 0" fill="none" stroke="#b46656" stroke-linecap="round")
</template>

<script setup>
import IMG from '../assets/moduCore_con.png'
const sellingPoints = [
  {
    title: "前後台分離設計",
    desc: "未登入使用者可瀏覽系統介紹，登入後依身分進入不同功能頁面。",
  },
  {
    title: "任務派發與管理",
    desc: "可建立任務、指派人員，並追蹤任務執行狀態。",
  },
  {
    title: "投票與意見蒐集",
    desc: "可建立投票主題，提供員工參與並即時統計結果。",
  },
];


const modules = [
  { name: "Dashboard", desc: "登入後首頁，顯示任務與投票重點資訊。", to: "/dashboard" },
  { name: "Employee", desc: "員工資料管理與權限設定。", to: "/employee" },
  { name: "Task", desc: "任務建立、指派與執行狀態管理。", to: "/task" },
  { name: "Vote", desc: "投票主題建立、參與與結果查看。", to: "/vote" },
];

</script>

<template>
  <div class="landing">
    <header class="hero">
      <div class="eyebrow">模組化專案引擎示範</div>
      <h1>任務派發與投票管理系統</h1>
      <p>
        本專案是一個由 <strong>ModuCore 模組驅動的專案引擎（Project Assembly Engine）</strong>
        所組裝而成以前端為主的實際專案示範。
        <br /><br />
        透過模組化前端架構與 API 導向的後端設計，
        將「員工管理」、「任務派發」、「內部投票」等功能
        視為可組裝、可替換的模組單元，
        用以驗證專案級模組組裝、流程編排與系統擴展的可行性。
      </p>

      <div class="imgBox"><img :src=IMG alt=""></div>
      <div class="cta">
        <a href="" class="primary">查看系統功能</a>
        <a href="" class="ghost">功能簡介</a>
      </div>

    </header>

    <section class="grid">
      <article v-for="p in sellingPoints" :key="p.title" class="card">
        <h3>{{ p.title }}</h3>
        <p>{{ p.desc }}</p>
      </article>
    </section>

    <section id="modules" class="modules">
      <h2>系統主要功能</h2>
      <p class="hint">
        以下為本作業系統所提供的主要功能頁面，
        登入後可依使用者身分進行操作。
      </p>

      <div class="module-grid">
        <article v-for="m in modules" :key="m.name" class="module-card">
          <h3>{{ m.name }}</h3>
          <p>{{ m.desc }}</p>
          <RouterLink :to="m.to" class="link">前往</RouterLink>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.landing {
  padding: 48px 6vw;
  display: grid;
  gap: 36px;
}

.hero {
  max-width: 1536px;
  display: grid;
  gap: 12px;
}

.eyebrow {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
  font-weight: 600;
  width: fit-content;
}

h1 {
  margin: 0;
  font-size: clamp(26px, 4vw, 38px);
  line-height: 1.2;
}

.hero p {
  margin: 0;
  opacity: 0.75;
  line-height: 1.6;
}

.cta {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 4px;
}

.primary,
.ghost {
  padding: 10px 14px;
  border-radius: 10px;
  text-decoration: none;
  border: 1px solid #e5e7eb;
  color: inherit;
}

.primary {
  background: #111827;
  color: #fff;
  border-color: #111827;
}

.ghost {
  background: #fff;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}

.card {
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
}

.card h3 {
  margin: 0 0 8px;
  font-size: 16px;
}

.card p {
  margin: 0;
  opacity: 0.72;
}

.modules h2 {
  margin: 0 0 4px;
  font-size: 20px;
}

.modules .hint {
  margin: 0 0 14px;
  opacity: 0.7;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.module-card {
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  display: grid;
  gap: 10px;
}

.module-card h3 {
  margin: 0;
  font-size: 16px;
}

.module-card p {
  margin: 0;
  opacity: 0.72;
}

.link {
  text-decoration: none;
  color: #2563eb;
  font-weight: 600;
}

.imgBox {
  width: 100%;
  margin: auto;
  text-align: center;
}
</style>

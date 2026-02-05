<script setup>
import IMG from '../assets/moducore_platform.jpg'
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

      <h1>任務派發與投票管理系統 - 請直接登入</h1>

      <p>
        本專案是一個由
        <b>ModuCore 模組驅動的專案引擎</b>
        所組裝而成、<b>以前端為核心</b>的實際專案示範。
        <br /><br />

        <b>ModuCore 並非試圖提供完整功能框架</b>，
        而是以
        <b>極小核心</b>
        ，
        專注於在
        <b>容器模式下</b>
        定義並治理
        <b>能力的註冊、存取與作用範圍</b>
        ，使多專案與多模組得以在同一平台下
        <b>安全共存</b>。
        <br /><br />

        在此基礎上，ModuCore 提供
        <b>單一平台工作區</b>
        支援在同一平台中
        <b>自由切換不同專案</b>，
        並允許工程師於
        <b>同一工作區內平行開發多個專案</b>。
        <br /><br />

        透過
        <b>明確的模組邊界</b>
        與
        <b>系統層級的規則約束</b>
        <i>（非人為約定，而是平台內建行為）</i>
        ，各專案可在共享平台環境下
        <b>維持獨立運行與資料隔離</b>，
        在
        <b>不互相干擾</b>
        的前提下持續演化與擴充。
        <br /><br />

        本示範專案以
        <b>「員工管理」</b>、
        <b>「任務派發」</b>、
        <b>「內部投票」</b>
        <i>等業務模組</i>
        ，
        驗證
        <b>專案級模組組裝</b>、
        <b>流程編排</b>
        與
        <b>系統擴展</b>
        的可行性。
      </p>

      <div class="imgBox">
        <img :src="IMG" alt="" />
      </div>

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
.hero big {
  font-size: 1.12em;
  font-weight: bolder;
}

.hero b {
  font-weight: bolder;
  font-size: 1.1em;
}

.hero i {
  font-style: italic;
  opacity: 0.75;
  white-space: nowrap;
}

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

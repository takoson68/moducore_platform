import LayoutRoot from './LayoutRoot.vue';

// 提供遊戲專案的頁面承載外殼。
export function defineLayout() {
  return { id: 'game-demo-layout', component: LayoutRoot };
}

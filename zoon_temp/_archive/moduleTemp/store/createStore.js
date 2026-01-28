// modules/moduleTemp/store/createStore.js
export function createStore() {
  return {
    state: {
      count: 0,
      title: "Module Temp Store",
    },

    inc() {
      this.state.count++;
    },
  };
}

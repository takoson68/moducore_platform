// src/modules/task/index.js
import { registerModule } from '@/modules/index.js'
import { container } from '@/container/container.js'
import { createTaskStore } from './store/createTaskStore.js'

import TaskLayout from './TaskLayout.vue'
import TaskBoardPage from './pages/board.vue'

export const taskModule = {
  name: 'task',
  layout: TaskLayout,

  install() {
    container.register('taskStore', createTaskStore)
  },

  routes: [
    { path: '/task', meta: { module: 'task' }, component: TaskBoardPage }
  ]
}

taskModule.install()
registerModule(taskModule)

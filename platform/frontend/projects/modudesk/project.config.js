//- projects/modudesk/project.config.js
export default {
  name: 'modudesk',
  title: 'ModuDesk',
  tenant_id: 'modudesk',
  modules: ['sticky-board', 'calendar', 'tasks'],
  features: {
    task: {
      enabled: false,
    },
  },
}

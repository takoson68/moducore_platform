import world from '@/world.js'
import { createLeaveRecord, fetchLeaveRecords, updateLeaveRecord } from './service.js'

const leaveTypeLabelMap = {
  annual: '年假',
  sick: '病假',
  personal: '事假',
  marriage: '婚假'
}

const statusLabelMap = {
  draft: '草稿',
  submitted: '送出待審',
  approved: '已核准',
  rejected: '已退回'
}

function currentUser() {
  return world.store('auth').state.user
}

function canAccess() {
  const user = currentUser()
  return Boolean(user) && user.role === 'employee'
}

function createDefaultForm() {
  return {
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
    delegate: ''
  }
}

function normalizeRecord(record) {
  return {
    ...record,
    leaveTypeLabel: leaveTypeLabelMap[record.leave_type] || record.leave_type,
    statusLabel: statusLabelMap[record.status] || record.status
  }
}

function createFormFromRecord(record) {
  return {
    leaveType: record?.leave_type || 'annual',
    startDate: record?.start_date || '',
    endDate: record?.end_date || '',
    reason: record?.reason || '',
    delegate: record?.delegate_name || ''
  }
}

function isEditableRecord(record) {
  return ['draft', 'submitted'].includes(record?.status || '')
}

export function createLeaveStore() {
  return world.createStore({
    name: 'flowCenterLeaveStore',
    defaultValue: {
      loading: false,
      submitting: false,
      error: '',
      records: [],
      selectedId: null,
      editingId: null,
      form: createDefaultForm()
    },
    actions: {
      reset(store) {
        store.set({
          ...store.get(),
          loading: false,
          submitting: false,
          error: '',
          records: [],
          selectedId: null,
          editingId: null,
          form: createDefaultForm()
        })
      },
      selectRecord(store, id) {
        const state = store.get()
        const record = state.records.find((item) => item.id === id) || null
        store.set({
          ...state,
          selectedId: id,
          editingId: isEditableRecord(record) ? record.id : null,
          form: record && isEditableRecord(record) ? createFormFromRecord(record) : state.form
        })
      },
      updateForm(store, patch = {}) {
        const state = store.get()
        store.set({
          ...state,
          form: {
            ...state.form,
            ...patch
          }
        })
      },
      clearForm(store) {
        const state = store.get()
        store.set({
          ...state,
          editingId: null,
          form: createDefaultForm()
        })
      },
      async load(store) {
        if (!canAccess()) {
          store.reset()
          return
        }

        store.set({
          ...store.get(),
          loading: true,
          error: ''
        })

        try {
          const records = (await fetchLeaveRecords()).map(normalizeRecord)
          store.set({
            ...store.get(),
            loading: false,
            records,
            selectedId: records[0]?.id || null,
            editingId: null
          })
        } catch (error) {
          store.set({
            ...store.get(),
            loading: false,
            records: [],
            selectedId: null,
            editingId: null,
            error: error.message
          })
        }
      },
      async submit(store, status) {
        const state = store.get()
        if (state.submitting || !canAccess()) return

        store.set({
          ...state,
          submitting: true,
          error: ''
        })

        try {
          const payload = {
            leave_type: state.form.leaveType,
            start_date: state.form.startDate,
            end_date: state.form.endDate,
            reason: state.form.reason,
            delegate_name: state.form.delegate,
            status
          }

          if (state.editingId) {
            await updateLeaveRecord(state.editingId, payload)
          } else {
            await createLeaveRecord(payload)
          }
          store.clearForm()
          await store.load()
        } catch (error) {
          store.set({
            ...store.get(),
            submitting: false,
            error: error.message
          })
          return
        }

        store.set({
          ...store.get(),
          submitting: false
        })
      }
    }
  })
}

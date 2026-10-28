import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// ─── Contacts ─────────────────────────────────────────────────────────────────

export const getContacts = (page = 1, limit = 50, status = '') =>
  api.get('/contacts', { params: { page, limit, ...(status && { status }) } })

export const uploadContacts = (formData) =>
  api.post('/contacts/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

export const addContact = (data) => api.post('/contacts', data)

export const deleteContact = (id) => api.delete(`/contacts/${id}`)

export const deleteAllContacts = () => api.delete('/contacts')

export const getContactStats = () => api.get('/contacts/stats')

// ─── Campaign ─────────────────────────────────────────────────────────────────

export const getCampaign = () => api.get('/campaign')

export const saveCampaign = (data) => api.post('/campaign', data)

// ─── Calls ────────────────────────────────────────────────────────────────────

export const startCalls = () => api.post('/calls/start')

export const startSingleCall = (contactId) =>
  api.post(`/calls/start/${contactId}`)

export const getCalls = () => api.get('/calls')

export const getCallStats = () => api.get('/calls/stats')

export const stopCalls = () => api.post('/calls/stop')

export default api

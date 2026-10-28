import React, { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Upload, UserPlus, Trash2, Phone, ChevronLeft, ChevronRight, Filter } from 'lucide-react'

import StatusBadge from '../components/StatusBadge.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import {
  getContacts,
  uploadContacts,
  addContact,
  deleteContact,
  deleteAllContacts,
  getContactStats,
  startSingleCall
} from '../api/index.js'

const STATUSES = ['', 'pending', 'called', 'failed']

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [stats, setStats] = useState({ total: 0 })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const [confirmDeleteOne, setConfirmDeleteOne] = useState(null)
  const fileInputRef = useRef(null)

  // Add contact form state
  const [form, setForm] = useState({ name: '', phone: '', village: '' })
  const [formError, setFormError] = useState('')
  const [addingContact, setAddingContact] = useState(false)

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getContacts(page, 50, statusFilter)
      const data = res.data
      setContacts(data.contacts || data || [])
      if (data.totalPages) setTotalPages(data.totalPages)
      else setTotalPages(1)
    } catch {
      toast.error('Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  const fetchStats = useCallback(async () => {
    try {
      const res = await getContactStats()
      setStats(res.data)
    } catch {}
  }, [])

  useEffect(() => {
    fetchContacts()
    fetchStats()
  }, [fetchContacts, fetchStats])

  // ── Upload ──────────────────────────────────────────────────────────────────

  const handleFileUpload = async (file) => {
    if (!file) return
    const allowed = ['.csv', '.xlsx', '.xls']
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    if (!allowed.includes(ext)) {
      toast.error('Please upload a CSV or Excel file')
      return
    }
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await uploadContacts(formData)
      const count = res.data?.imported || res.data?.count || '?'
      toast.success(`✅ Imported ${count} contacts successfully!`)
      setPage(1)
      await fetchContacts()
      await fetchStats()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  // ── Add Contact ─────────────────────────────────────────────────────────────

  const validatePhone = (phone) => /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''))

  const handleAddContact = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim()) return setFormError('Name is required')
    if (!validatePhone(form.phone)) return setFormError('Enter a valid 10-digit Indian mobile number')
    setAddingContact(true)
    try {
      await addContact({ ...form, phone: form.phone.trim() })
      toast.success(`👤 ${form.name} added successfully!`)
      setForm({ name: '', phone: '', village: '' })
      await fetchContacts()
      await fetchStats()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add contact')
    } finally {
      setAddingContact(false)
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  const handleDeleteOne = async (id) => {
    try {
      await deleteContact(id)
      toast.success('Contact deleted')
      setContacts((prev) => prev.filter((c) => c._id !== id))
      await fetchStats()
    } catch {
      toast.error('Failed to delete contact')
    }
    setConfirmDeleteOne(null)
  }

  const handleDeleteAll = async () => {
    try {
      await deleteAllContacts()
      toast.success('All contacts deleted')
      setContacts([])
      setStats({ total: 0 })
      setPage(1)
    } catch {
      toast.error('Failed to delete all contacts')
    }
    setConfirmDeleteAll(false)
  }

  // ── Call Now ────────────────────────────────────────────────────────────────

  const handleCallNow = async (contact) => {
    try {
      await startSingleCall(contact._id)
      toast.success(`📞 Calling ${contact.name}...`)
      setTimeout(fetchContacts, 3000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate call')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#138808] to-green-500 text-white px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">👥 Contacts</h1>
            <p className="text-green-100">
              Manage your voter contact list ·{' '}
              <span className="font-semibold text-white bg-white/20 px-2 py-0.5 rounded-full text-sm">
                {stats.total || 0} total
              </span>
            </p>
          </div>
          <button
            onClick={() => setConfirmDeleteAll(true)}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <Trash2 size={15} />
            Delete All
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Upload + Add Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CSV Upload */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Upload size={20} className="text-[#FF9933]" />
              Upload Contacts
            </h2>

            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragging
                  ? 'border-[#FF9933] bg-orange-50'
                  : 'border-gray-200 hover:border-[#FF9933] hover:bg-orange-50/30'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-4xl mb-2">{uploading ? '⏳' : '📎'}</div>
              <p className="text-gray-700 font-medium">
                {uploading ? 'Uploading...' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-gray-400 text-sm mt-1">Supports CSV and Excel (.xlsx, .xls)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files[0])}
              />
            </div>

            <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 mb-1">📋 Sample CSV Format:</p>
              <code className="text-xs text-blue-600 font-mono">
                name,phone,village<br />
                రాము,9876543210,చిన్న గ్రామం<br />
                Ramu,9876543210,Small Village
              </code>
            </div>
          </div>

          {/* Add Single Contact */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <UserPlus size={20} className="text-[#138808]" />
              Add Single Contact
            </h2>

            <form onSubmit={handleAddContact} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. రాజేష్ కుమార్"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number (+91) *
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933] focus:border-transparent font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Village / Area
                </label>
                <input
                  type="text"
                  placeholder="e.g. నాంద్యాల"
                  value={form.village}
                  onChange={(e) => setForm({ ...form, village: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                />
              </div>
              {formError && (
                <p className="text-red-500 text-xs flex items-center gap-1">
                  ⚠️ {formError}
                </p>
              )}
              <button
                type="submit"
                disabled={addingContact}
                className="w-full bg-[#138808] hover:bg-green-700 disabled:opacity-60 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {addingContact ? '⏳ Adding...' : '➕ Add Contact'}
              </button>
            </form>
          </div>
        </div>

        {/* Filter + Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              📋 Contact List
            </h2>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="called">Called</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner message="Loading contacts..." />
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center py-14 text-gray-400">
              <span className="text-5xl mb-3">👥</span>
              <p className="font-medium">No contacts found</p>
              <p className="text-sm mt-1">Upload a CSV or add contacts manually</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-3 font-semibold w-10">#</th>
                    <th className="pb-3 font-semibold">Name</th>
                    <th className="pb-3 font-semibold">Phone</th>
                    <th className="pb-3 font-semibold">Village</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {contacts.map((contact, idx) => (
                    <tr key={contact._id || idx} className="hover:bg-gray-50 transition-colors group">
                      <td className="py-3 text-gray-400 text-xs">
                        {(page - 1) * 50 + idx + 1}
                      </td>
                      <td className="py-3 font-medium text-gray-800">
                        {contact.name || '—'}
                      </td>
                      <td className="py-3 font-mono text-gray-600">
                        +91 {contact.phone || '—'}
                      </td>
                      <td className="py-3 text-gray-500">
                        {contact.village || '—'}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={contact.status || 'pending'} />
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleCallNow(contact)}
                            title="Call Now"
                            className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                          >
                            <Phone size={14} />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteOne(contact._id)}
                            title="Delete"
                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={15} /> Prev
              </button>
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Delete All */}
      <ConfirmDialog
        isOpen={confirmDeleteAll}
        title="Delete All Contacts?"
        message={`This will permanently delete all ${stats.total || ''} contacts. This cannot be undone.`}
        confirmLabel="Yes, Delete All"
        onConfirm={handleDeleteAll}
        onCancel={() => setConfirmDeleteAll(false)}
      />

      {/* Confirm Delete One */}
      <ConfirmDialog
        isOpen={!!confirmDeleteOne}
        title="Delete Contact?"
        message="This contact will be permanently removed."
        confirmLabel="Delete"
        onConfirm={() => handleDeleteOne(confirmDeleteOne)}
        onCancel={() => setConfirmDeleteOne(null)}
      />
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Save, Eye, Volume2 } from 'lucide-react'
import { getCampaign, saveCampaign } from '../api/index.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

const DEFAULT_TELUGU = `నమస్కారం! నేను [మీ పేరు], మీ సర్పంచ్ అభ్యర్థిగా మీ ముందు నిలబడ్డాను. మీ గ్రామ అభివృద్ధికి, మీ కుటుంబ సంక్షేమానికి నేను నిరంతరం కృషి చేస్తాను. మీ విలువైన ఓటు నాకు ఇవ్వండి. ధన్యవాదాలు! 🙏`

const DEFAULT_ENGLISH = `Hello! I am [Your Name], standing as your Sarpanch candidate. I will continuously work for the development of your village and the welfare of your family. Please give me your valuable vote. Thank you!`

export default function Campaign() {
  const [form, setForm] = useState({
    candidateName: '',
    villageName: '',
    messageTelugu: DEFAULT_TELUGU,
    messageEnglish: DEFAULT_ENGLISH
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    getCampaign()
      .then((res) => {
        const d = res.data
        if (d) {
          setForm({
            candidateName: d.candidateName || '',
            villageName: d.villageName || '',
            messageTelugu: d.messageTelugu || DEFAULT_TELUGU,
            messageEnglish: d.messageEnglish || DEFAULT_ENGLISH
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.candidateName.trim()) return toast.error('Candidate name is required')
    setSaving(true)
    try {
      await saveCampaign(form)
      toast.success('✅ Campaign settings saved!')
      setShowPreview(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save campaign')
    } finally {
      setSaving(false)
    }
  }

  const previewTelugu = form.messageTelugu
    .replace(/\[మీ పేరు\]/g, form.candidateName || '[మీ పేరు]')
    .replace(/\[Your Name\]/gi, form.candidateName || '[Your Name]')

  const previewEnglish = form.messageEnglish
    .replace(/\[Your Name\]/gi, form.candidateName || '[Your Name]')
    .replace(/\[మీ పేరు\]/g, form.candidateName || '[Your Name]')

  const handleTestVoice = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(previewTelugu)
      utterance.lang = 'te-IN'
      utterance.rate = 0.85
      speechSynthesis.speak(utterance)
      toast.success('🔊 Playing voice preview...')
    } else {
      toast.error('Speech synthesis not supported in this browser')
    }
  }

  if (loading) return <LoadingSpinner message="Loading campaign settings..." size="lg" />

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FF9933] to-orange-500 text-white px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-1">⚙️ Campaign Settings</h1>
          <p className="text-orange-100">
            Configure your candidate details and campaign voice message
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* Campaign Details Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
            🏛️ Campaign Details
          </h2>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Candidate Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. రాజేష్ కుమార్ / Rajesh Kumar"
                  value={form.candidateName}
                  onChange={(e) => setForm({ ...form, candidateName: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Village / Constituency Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. నాంద్యాల మండలం"
                  value={form.villageName}
                  onChange={(e) => setForm({ ...form, villageName: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                📣 Campaign Message in Telugu{' '}
                <span className="text-xs font-normal text-gray-400 ml-1">
                  (This will be spoken to voters via Twilio TTS)
                </span>
              </label>
              <textarea
                rows={5}
                placeholder="నమస్కారం! నేను [మీ పేరు], మీ సర్పంచ్ అభ్యర్థిగా..."
                value={form.messageTelugu}
                onChange={(e) => setForm({ ...form, messageTelugu: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933] focus:border-transparent resize-none leading-relaxed"
                style={{ fontFamily: 'serif' }}
              />
              <p className="text-xs text-gray-400 mt-1">
                Use <code className="bg-gray-100 px-1 rounded">[మీ పేరు]</code> as placeholder for candidate name
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                🇬🇧 English Translation{' '}
                <span className="text-xs font-normal text-gray-400 ml-1">(for reference only)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Hello! I am [Your Name], standing as your Sarpanch candidate..."
                value={form.messageEnglish}
                onChange={(e) => setForm({ ...form, messageEnglish: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933] focus:border-transparent resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-[#138808] hover:bg-green-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Campaign'}
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 bg-[#000080] hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm"
              >
                <Eye size={16} />
                {showPreview ? 'Hide' : 'Preview'} Message
              </button>
            </div>
          </form>
        </div>

        {/* Message Preview */}
        {showPreview && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                🔊 Message Preview
              </h2>
              <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200">
                🇮🇳 Telugu
              </span>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-5 border border-orange-100 mb-4">
              <p className="text-xs font-semibold text-orange-600 mb-2 uppercase tracking-wide">
                Telugu Voice Message (as heard by voters)
              </p>
              <p
                className="text-gray-800 text-lg leading-relaxed"
                style={{ fontFamily: 'serif' }}
              >
                {previewTelugu}
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 mb-5">
              <p className="text-xs font-semibold text-blue-600 mb-2 uppercase tracking-wide">
                English Translation
              </p>
              <p className="text-gray-700 text-sm leading-relaxed">{previewEnglish}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleTestVoice}
                className="flex items-center gap-2 bg-[#FF9933] hover:bg-orange-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm"
              >
                <Volume2 size={16} />
                🔊 Test Voice (Browser TTS)
              </button>
              <p className="text-xs text-gray-400">
                Uses browser speech synthesis · Actual calls use Twilio TTS
              </p>
            </div>

            {/* Candidate Card */}
            {form.candidateName && (
              <div className="mt-5 p-4 bg-gradient-to-r from-[#000080] to-blue-700 text-white rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🗳️</div>
                  <div>
                    <p className="font-bold text-lg">{form.candidateName}</p>
                    <p className="text-blue-200 text-sm">
                      Sarpanch Candidate · {form.villageName || 'Your Village'}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="flex gap-0.5">
                      <div className="w-4 h-6 bg-[#FF9933] rounded-l" />
                      <div className="w-4 h-6 bg-white" />
                      <div className="w-4 h-6 bg-[#138808] rounded-r" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

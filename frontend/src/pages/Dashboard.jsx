import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Users, Phone, CheckCircle, Clock, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

import StatCard from '../components/StatCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { getContactStats, getCallStats, getCalls, getCampaign } from '../api/index.js'

const PIE_COLORS = ['#138808', '#ef4444', '#FF9933', '#6b7280', '#3b82f6']

export default function Dashboard() {
  const navigate = useNavigate()
  const [contactStats, setContactStats] = useState(null)
  const [callStats, setCallStats] = useState(null)
  const [recentCalls, setRecentCalls] = useState([])
  const [campaignName, setCampaignName] = useState('Your Candidate')
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const fetchData = useCallback(async () => {
    try {
      const [cStats, kStats, callsRes, campaignRes] = await Promise.allSettled([
        getContactStats(),
        getCallStats(),
        getCalls(),
        getCampaign()
      ])

      if (cStats.status === 'fulfilled') setContactStats(cStats.value.data)
      if (kStats.status === 'fulfilled') setCallStats(kStats.value.data)
      if (callsRes.status === 'fulfilled') {
        const calls = callsRes.value.data?.calls || callsRes.value.data || []
        setRecentCalls(Array.isArray(calls) ? calls.slice(0, 10) : [])
      }
      if (campaignRes.status === 'fulfilled') {
        const name = campaignRes.value.data?.candidateName
        if (name) setCampaignName(name)
      }
      setLastRefresh(new Date())
    } catch (err) {
      // silent fail on auto-refresh
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const pieData = callStats
    ? [
        { name: 'Completed', value: callStats.completed || 0 },
        { name: 'Failed', value: callStats.failed || 0 },
        { name: 'No Answer', value: callStats.noAnswer || 0 },
        { name: 'Pending', value: callStats.pending || 0 },
        { name: 'In Progress', value: callStats.inProgress || 0 }
      ].filter((d) => d.value > 0)
    : []

  const barData = callStats?.hourly || []

  const totalContacts = contactStats?.total || 0
  const callsMade = callStats?.total || 0
  const completed = callStats?.completed || 0
  const successRate =
    callsMade > 0 ? Math.round((completed / callsMade) * 100) : 0
  const pending = contactStats?.pending || 0

  const handleRefresh = () => {
    setLoading(true)
    fetchData().then(() => toast.success('Dashboard refreshed!'))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#000080] via-[#1a1a8c] to-[#FF9933] text-white px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold mb-1">🗳️ Sarpanch Campaign Dashboard</h1>
              <p className="text-blue-200 text-lg">
                Welcome back! Campaign for{' '}
                <span className="text-[#FF9933] font-semibold">{campaignName}</span>
              </p>
              <p className="text-blue-300 text-sm mt-1">
                🕐 Last updated: {lastRefresh.toLocaleTimeString()} · Auto-refreshes every 30s
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all backdrop-blur-sm border border-white/20 flex-shrink-0"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {loading && !contactStats ? (
          <LoadingSpinner message="Loading dashboard..." size="lg" />
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Users}
                value={totalContacts.toLocaleString()}
                label="Total Contacts"
                color="blue"
              />
              <StatCard
                icon={Phone}
                value={callsMade.toLocaleString()}
                label="Calls Made"
                color="orange"
              />
              <StatCard
                icon={CheckCircle}
                value={`${successRate}%`}
                label="Success Rate"
                color="green"
              />
              <StatCard
                icon={Clock}
                value={pending.toLocaleString()}
                label="Pending Calls"
                color="gray"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  📊 Call Status Distribution
                </h2>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {pieData.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => [val, 'Calls']}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-60 text-gray-400">
                    <span className="text-4xl mb-2">📭</span>
                    <p className="text-sm">No call data yet</p>
                  </div>
                )}
              </div>

              {/* Bar Chart */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  📈 Hourly Call Activity
                </h2>
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px' }} />
                      <Legend />
                      <Bar dataKey="completed" name="Completed" fill="#138808" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-60 text-gray-400">
                    <span className="text-4xl mb-2">📭</span>
                    <p className="text-sm">No hourly data yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-lg font-bold text-gray-800 mb-4">⚡ Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/calls')}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#138808] to-green-600 hover:from-green-600 hover:to-green-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md"
                >
                  🚀 Start Campaign Calls
                </button>
                <button
                  onClick={() => navigate('/contacts')}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#000080] to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md"
                >
                  👥 View Contacts
                </button>
                <button
                  onClick={() => navigate('/campaign')}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#FF9933] to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md"
                >
                  ✏️ Edit Message
                </button>
              </div>
            </div>

            {/* Recent Call Activity */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">🕐 Recent Call Activity</h2>
                <button
                  onClick={() => navigate('/calls')}
                  className="text-sm text-[#FF9933] hover:text-orange-600 font-medium"
                >
                  View All →
                </button>
              </div>

              {recentCalls.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-gray-400">
                  <span className="text-4xl mb-2">📭</span>
                  <p className="text-sm">No calls yet. Start your campaign!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-100">
                        <th className="pb-3 font-semibold">Contact</th>
                        <th className="pb-3 font-semibold">Phone</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold">Duration</th>
                        <th className="pb-3 font-semibold">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recentCalls.map((call, idx) => (
                        <tr key={call._id || idx} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 font-medium text-gray-800">
                            {call.contactName || call.name || '—'}
                          </td>
                          <td className="py-3 text-gray-500 font-mono">
                            {call.phone || '—'}
                          </td>
                          <td className="py-3">
                            <StatusBadge status={call.status} />
                          </td>
                          <td className="py-3 text-gray-500">
                            {call.duration ? `${call.duration}s` : '—'}
                          </td>
                          <td className="py-3 text-gray-500">
                            {call.createdAt
                              ? new Date(call.createdAt).toLocaleString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

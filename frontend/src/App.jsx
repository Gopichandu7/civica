import React, { useState } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import {
  LayoutDashboard,
  Users,
  Settings,
  Phone,
  ChevronRight,
  Menu,
  X
} from 'lucide-react'

import Dashboard from './pages/Dashboard.jsx'
import Contacts from './pages/Contacts.jsx'
import Campaign from './pages/Campaign.jsx'
import Calls from './pages/Calls.jsx'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', emoji: '📊' },
  { path: '/contacts', icon: Users, label: 'Contacts', emoji: '👥' },
  { path: '/campaign', icon: Settings, label: 'Campaign Settings', emoji: '⚙️' },
  { path: '/calls', icon: Phone, label: 'Call Logs', emoji: '📞' }
]

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } flex flex-col bg-gradient-to-b from-[#000080] via-[#000060] to-[#000040] text-white transition-all duration-300 ease-in-out shadow-2xl z-20 flex-shrink-0`}
      >
        {/* Logo / Header */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-blue-700">
          {sidebarOpen ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-2xl">🗳️</span>
              <div className="min-w-0">
                <p className="font-bold text-saffron-500 text-sm leading-tight truncate" style={{ color: '#FF9933' }}>
                  Sarpanch Campaign
                </p>
                <p className="text-blue-300 text-xs truncate">Calling System</p>
              </div>
            </div>
          ) : (
            <span className="text-xl mx-auto">🗳️</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-blue-300 hover:text-white transition-colors p-1 rounded-lg hover:bg-blue-700 flex-shrink-0"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* India Flag Strip */}
        <div className="flex h-1 flex-shrink-0">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#138808]" />
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto scrollbar-thin">
          {navItems.map(({ path, icon: Icon, label, emoji }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-[#FF9933] text-white shadow-lg shadow-orange-900/30'
                    : 'text-blue-200 hover:bg-blue-700/50 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="text-lg flex-shrink-0">{emoji}</span>
                  {sidebarOpen && (
                    <>
                      <span className="text-sm font-medium flex-1 truncate">{label}</span>
                      {isActive && <ChevronRight size={14} className="flex-shrink-0" />}
                    </>
                  )}
                  {!sidebarOpen && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                      {label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="px-4 py-4 border-t border-blue-700">
            <p className="text-blue-300 text-xs text-center leading-relaxed">
              Made with ❤️ for Democracy
            </p>
            <p className="text-blue-400 text-xs text-center mt-1">🇮🇳 Jai Hind</p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/campaign" element={<Campaign />} />
            <Route path="/calls" element={<Calls />} />
          </Routes>
        </div>
      </main>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            borderRadius: '12px',
            fontSize: '14px'
          },
          success: {
            iconTheme: { primary: '#138808', secondary: '#fff' }
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' }
          }
        }}
      />
    </div>
  )
}

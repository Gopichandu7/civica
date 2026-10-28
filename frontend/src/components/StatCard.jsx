import React from 'react'

export default function StatCard({ icon: Icon, value, label, color = 'orange', emoji }) {
  const colorMap = {
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      iconBg: 'bg-[#FF9933]',
      text: 'text-[#FF9933]',
      shadow: 'hover:shadow-orange-100'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      iconBg: 'bg-[#138808]',
      text: 'text-[#138808]',
      shadow: 'hover:shadow-green-100'
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      iconBg: 'bg-[#000080]',
      text: 'text-[#000080]',
      shadow: 'hover:shadow-blue-100'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      iconBg: 'bg-red-500',
      text: 'text-red-500',
      shadow: 'hover:shadow-red-100'
    },
    gray: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      iconBg: 'bg-gray-500',
      text: 'text-gray-500',
      shadow: 'hover:shadow-gray-100'
    }
  }

  const c = colorMap[color] || colorMap.orange

  return (
    <div
      className={`${c.bg} ${c.border} border rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md ${c.shadow} transition-all duration-200 cursor-default`}
    >
      <div className={`${c.iconBg} text-white rounded-xl p-3 flex-shrink-0`}>
        {Icon ? (
          <Icon size={22} />
        ) : (
          <span className="text-xl leading-none">{emoji}</span>
        )}
      </div>
      <div className="min-w-0">
        <p className={`text-2xl font-bold ${c.text} leading-tight`}>
          {value ?? '—'}
        </p>
        <p className="text-gray-500 text-sm font-medium truncate">{label}</p>
      </div>
    </div>
  )
}

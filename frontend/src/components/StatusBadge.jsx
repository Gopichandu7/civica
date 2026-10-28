import React from 'react'

const statusConfig = {
  // Contact statuses
  pending:    { label: 'Pending',    classes: 'bg-gray-100 text-gray-600 border-gray-200' },
  called:     { label: 'Called',     classes: 'bg-green-100 text-green-700 border-green-200' },
  failed:     { label: 'Failed',     classes: 'bg-red-100 text-red-600 border-red-200' },
  // Call statuses
  completed:  { label: 'Completed',  classes: 'bg-green-100 text-green-700 border-green-200' },
  initiated:  { label: 'Initiated',  classes: 'bg-blue-100 text-blue-700 border-blue-200' },
  ringing:    { label: 'Ringing',    classes: 'bg-blue-100 text-blue-600 border-blue-200' },
  busy:       { label: 'Busy',       classes: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  'no-answer':{ label: 'No Answer',  classes: 'bg-gray-100 text-gray-600 border-gray-200' },
  canceled:   { label: 'Canceled',   classes: 'bg-orange-100 text-orange-600 border-orange-200' },
  'in-progress':{ label: 'In Progress', classes: 'bg-blue-100 text-blue-700 border-blue-200' }
}

export default function StatusBadge({ status }) {
  const cfg = statusConfig[status?.toLowerCase()] || {
    label: status || 'Unknown',
    classes: 'bg-gray-100 text-gray-500 border-gray-200'
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.classes} capitalize`}
    >
      {cfg.label}
    </span>
  )
}

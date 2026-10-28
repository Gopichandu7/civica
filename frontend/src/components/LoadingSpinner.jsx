import React from 'react'

export default function LoadingSpinner({ message = 'Loading...', size = 'md' }) {
  const sizeMap = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-4',
    lg: 'h-16 w-16 border-4'
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div
        className={`${sizeMap[size]} animate-spin rounded-full border-[#FF9933] border-t-transparent`}
      />
      {message && (
        <p className="text-gray-500 text-sm font-medium animate-pulse">{message}</p>
      )}
    </div>
  )
}

// Calculate plant status based on next_watering_at
export const getPlantStatus = (nextWateringAt) => {
  if (!nextWateringAt) return 'red' // Never watered

  const now = new Date()
  const nextDate = new Date(nextWateringAt)

  // Compare dates at midnight
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const nextMidnight = new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate())

  if (nextMidnight < nowDate) return 'red' // Overdue
  if (nextMidnight.getTime() === nowDate.getTime()) return 'yellow' // Today
  return 'green' // Future
}

export const getStatusColor = (status) => {
  switch (status) {
    case 'red': return '#ef4444'
    case 'yellow': return '#f59e0b'
    case 'green': return '#10b981'
    default: return '#d1d5db'
  }
}

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
  if (!date) return 'Never'

  const now = new Date()
  const then = new Date(date)
  const diffMs = now - then
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

// Format date for display
export const formatDate = (date) => {
  if (!date) return 'N/A'
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

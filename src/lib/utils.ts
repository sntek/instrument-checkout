import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(d: Date) {
  let h = d.getHours()
  const m = d.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  if (h === 0) h = 12
  const mm = m.toString().padStart(2, '0')
  return `${h}:${mm} ${ampm}`
}

export function generateTimeSlots() {
  const slots: string[] = []
  const start = new Date()
  start.setHours(7, 30, 0, 0)
  const end = new Date()
  end.setHours(17, 0, 0, 0)
  const cursor = new Date(start)
  while (cursor < end) {
    const next = new Date(cursor.getTime() + 30 * 60 * 1000)
    const label = `${formatTime(cursor)} - ${formatTime(next)}`
    slots.push(label)
    cursor.setTime(next.getTime())
  }
  return slots
}

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatVolume(volume: bigint | number): string {
  const num = typeof volume === 'bigint' ? Number(volume) / 1e18 : volume
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toFixed(2)
}

export function formatPercent(value: number | bigint, decimals: number = 2): string {
  const num = typeof value === 'bigint' ? Number(value) / 100 : value
  return `${num.toFixed(decimals)}%`
}

export function formatROI(roi: number | bigint): string {
  const num = typeof roi === 'bigint' ? Number(roi) / 100 : roi
  const sign = num > 0 ? '+' : ''
  return `${sign}${num.toFixed(2)}%`
}

export function formatTimestamp(timestamp: bigint | number): string {
  const date = new Date(Number(timestamp) * 1000)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

export function getWinRateColor(winRate: number): string {
  if (winRate >= 80) return '#FFD700' // Gold
  if (winRate >= 60) return '#FFEB3B' // Yellow
  if (winRate >= 40) return '#FF9500' // Orange
  return '#FF3B30' // Red
}

export function getROIColor(roi: number): string {
  if (roi > 0) return '#00D46E' // Green
  if (roi < 0) return '#FF3B30' // Red
  return '#A0A0A0' // Gray
}

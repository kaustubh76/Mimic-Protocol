import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { getWinRateColor } from '../../lib/utils'

interface WinRateGaugeProps {
  value: number // 0-100
  size?: number
  showLabel?: boolean
}

export function WinRateGauge({ value, size = 200, showLabel = true }: WinRateGaugeProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setDisplayValue(value), 100)
    return () => clearTimeout(timer)
  }, [value])

  const radius = 80
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (displayValue / 100) * circumference
  const color = getWinRateColor(value)

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background glow */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-20"
        style={{ background: color }}
      />

      {/* SVG Circle */}
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2A2A2A"
          strokeWidth="12"
          fill="none"
        />

        {/* Animated Progress Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
          style={{
            strokeDasharray: circumference,
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
        />
      </svg>

      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          className="text-5xl font-extrabold font-display"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5, type: 'spring' }}
        >
          {Math.round(displayValue)}%
        </motion.div>
        {showLabel && (
          <motion.p
            className="text-sm text-gray-text mt-2 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Win Rate
          </motion.p>
        )}
      </div>
    </div>
  )
}

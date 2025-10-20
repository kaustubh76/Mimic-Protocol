import { motion } from 'framer-motion'
import { clsx } from 'clsx'

interface CardProps {
  variant?: 'default' | 'elevated' | 'glass'
  hover?: boolean
  glow?: boolean
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function Card({
  variant = 'default',
  hover = true,
  glow = false,
  children,
  className,
  onClick,
}: CardProps) {
  const variants = {
    default: 'bg-black-card border border-gray-border',
    elevated: 'bg-black-elevated border border-yellow-primary/20',
    glass: 'glass',
  }

  return (
    <motion.div
      className={clsx(
        'rounded-2xl p-6 transition-all duration-300 relative group',
        variants[variant],
        onClick && 'cursor-pointer',
        glow && 'shadow-glow',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={hover && !onClick ? {
        y: -4,
        transition: { type: 'spring', stiffness: 400, damping: 17 }
      } : hover && onClick ? {
        scale: 1.02,
        y: -4,
        boxShadow: '0 0 30px rgba(255,215,0,0.3)',
        transition: { type: 'spring', stiffness: 400, damping: 17 }
      } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
    >
      {children}

      {/* Hover glow effect */}
      {hover && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-radial from-yellow-primary/0 via-yellow-primary/5 to-yellow-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}
    </motion.div>
  )
}

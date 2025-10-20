import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-gradient-to-r from-yellow-primary to-yellow-glow text-black-bg shadow-glow hover:shadow-glow-strong font-bold',
    secondary: 'bg-transparent border-2 border-yellow-primary text-yellow-primary hover:bg-yellow-primary/10',
    danger: 'bg-error/10 border border-error text-error hover:bg-error/20',
    ghost: 'bg-transparent text-gray-text hover:text-white hover:bg-white/5',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return (
    <motion.button
      className={clsx(
        'rounded-xl font-semibold transition-all duration-300 relative overflow-hidden',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-yellow-primary focus:ring-offset-2 focus:ring-offset-black-bg',
        variants[variant],
        sizes[size],
        className
      )}
      whileHover={!disabled && !loading ? {
        scale: 1.02,
        transition: { type: 'spring', stiffness: 400, damping: 17 }
      } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      disabled={disabled || loading}
      {...props}
    >
      {/* Shine effect on hover */}
      {variant === 'primary' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
        />
      )}

      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading && <Loader2 className="animate-spin" size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />}
        {children}
      </span>
    </motion.button>
  )
}

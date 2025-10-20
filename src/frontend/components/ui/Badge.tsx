import { clsx } from 'clsx'

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'muted' | 'gold'
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
  children: React.ReactNode
  className?: string
}

export function Badge({
  variant = 'muted',
  size = 'md',
  pulse = false,
  children,
  className,
}: BadgeProps) {
  const variants = {
    success: 'bg-success/20 text-success border-success/30',
    warning: 'bg-warning/20 text-warning border-warning/30',
    error: 'bg-error/20 text-error border-error/30',
    info: 'bg-info/20 text-info border-info/30',
    muted: 'bg-gray-muted/20 text-gray-text border-gray-border',
    gold: 'bg-yellow-primary/20 text-yellow-primary border-yellow-primary/30',
  }

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-semibold border',
        'transition-all duration-200',
        variants[variant],
        sizes[size],
        pulse && 'animate-pulse-glow',
        className
      )}
    >
      {/* Dot indicator */}
      <span className={clsx(
        'w-1.5 h-1.5 rounded-full',
        variant === 'success' && 'bg-success',
        variant === 'warning' && 'bg-warning',
        variant === 'error' && 'bg-error',
        variant === 'info' && 'bg-info',
        variant === 'muted' && 'bg-gray-text',
        variant === 'gold' && 'bg-yellow-primary',
        pulse && 'animate-ping'
      )} />
      {children}
    </span>
  )
}

# 🛠️ Mirror Protocol UI - Implementation Guide

**Goal:** Transform current UI into ETHGlobal winner-quality interface
**Theme:** Black/Yellow Cyberpunk Financial
**Timeline:** 4 days

---

## 📁 **File Structure**

```
src/frontend/
├── components/
│   ├── ui/                    # Base components
│   │   ├── Button.tsx         # Primary, secondary, danger
│   │   ├── Card.tsx           # Pattern, delegation, stat cards
│   │   ├── Input.tsx          # Text, number, slider
│   │   ├── Badge.tsx          # Status indicators
│   │   ├── Spinner.tsx        # Loading states
│   │   ├── Toast.tsx          # Notifications
│   │   └── Progress.tsx       # Progress bars, gauges
│   │
│   ├── layout/                # Layout components
│   │   ├── Header.tsx         # Sticky glassmorphism nav
│   │   ├── Hero.tsx           # Landing section
│   │   ├── StatsBar.tsx       # Live stats ticker
│   │   └── Footer.tsx         # Footer section
│   │
│   ├── features/              # Feature components
│   │   ├── PatternCard.tsx    # Pattern showcase card
│   │   ├── PatternGrid.tsx    # Grid of patterns
│   │   ├── PatternWizard.tsx  # Create pattern flow
│   │   ├── DelegationCard.tsx # Delegation display
│   │   ├── DelegationDash.tsx # Portfolio dashboard
│   │   └── ExecutionTimeline.tsx # Execution history
│   │
│   ├── viz/                   # Data visualizations
│   │   ├── WinRateGauge.tsx   # Circular progress
│   │   ├── VolumeChart.tsx    # Area chart
│   │   ├── ROISparkline.tsx   # Mini line chart
│   │   ├── AllocationDonut.tsx # Donut chart
│   │   └── PerformanceGraph.tsx # Historical performance
│   │
│   └── effects/               # Special effects
│       ├── ParticleBackground.tsx # Floating particles
│       ├── GlowOrbs.tsx       # Ambient orbs
│       └── GridLines.tsx      # Animated grid
│
├── styles/
│   ├── globals.css            # Global styles, reset
│   ├── animations.css         # Keyframe animations
│   └── utilities.css          # Utility classes
│
├── hooks/
│   ├── useCountUp.ts          # Number animation
│   ├── useInView.ts           # Scroll animations
│   └── useMediaQuery.ts       # Responsive
│
└── lib/
    ├── colors.ts              # Color constants
    ├── animations.ts          # Animation presets
    └── utils.ts               # Helper functions
```

---

## 🎨 **Step-by-Step Implementation**

### **PHASE 1: Foundation Setup**

#### Step 1: Install Dependencies
```bash
cd "src/frontend"

# Core UI libraries
pnpm add framer-motion
pnpm add clsx tailwind-merge

# Visualization
pnpm add recharts
pnpm add react-countup

# 3D (optional for hero)
pnpm add three @react-three/fiber @react-three/drei

# Icons
pnpm add lucide-react
```

#### Step 2: Configure Tailwind
Update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        black: {
          bg: '#0A0A0A',
          card: '#141414',
          elevated: '#1C1C1C',
        },
        yellow: {
          primary: '#FFD700',
          glow: '#FFC107',
          bright: '#FFEB3B',
        },
        gray: {
          border: '#2A2A2A',
          text: '#A0A0A0',
          muted: '#606060',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 30px rgba(255, 215, 0, 0.3)',
        'glow-strong': '0 0 50px rgba(255, 215, 0, 0.6)',
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      },
    },
  },
  plugins: [],
}
```

#### Step 3: Global Styles
Create/update `src/styles/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-gray-border;
  }

  body {
    @apply bg-black-bg text-white font-sans antialiased;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-display font-bold;
  }
}

@layer utilities {
  .text-gradient-gold {
    @apply bg-gradient-to-r from-yellow-primary to-yellow-glow bg-clip-text text-transparent;
  }

  .glow-text {
    text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  }

  .glass {
    @apply bg-black-card/70 backdrop-blur-xl border border-yellow-primary/10;
  }
}
```

---

### **PHASE 2: Base Components**

#### Component 1: Button
Create `src/components/ui/Button.tsx`:

```typescript
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
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
    primary: 'bg-gradient-to-r from-yellow-primary to-yellow-glow text-black-bg shadow-glow',
    secondary: 'bg-transparent border-2 border-yellow-primary text-yellow-primary hover:bg-yellow-primary/10',
    danger: 'bg-red-500/10 border border-red-500 text-red-500 hover:bg-red-500/20',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return (
    <motion.button
      className={clsx(
        'rounded-xl font-bold transition-all duration-300',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      whileHover={!disabled && !loading ? { scale: 1.02, boxShadow: '0 5px 40px rgba(255,215,0,0.5)' } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Spinner size="sm" />
          Loading...
        </span>
      ) : (
        children
      )}
    </motion.button>
  )
}

function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <svg
      className={clsx('animate-spin', sizes[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
```

#### Component 2: Card
Create `src/components/ui/Card.tsx`:

```typescript
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

interface CardProps {
  variant?: 'default' | 'elevated' | 'glass'
  hover?: boolean
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function Card({
  variant = 'default',
  hover = true,
  children,
  className,
  onClick,
}: CardProps) {
  const variants = {
    default: 'bg-black-card border border-gray-border',
    elevated: 'bg-black-elevated border border-yellow-primary/20 shadow-glow',
    glass: 'glass',
  }

  return (
    <motion.div
      className={clsx(
        'rounded-2xl p-6 transition-all duration-300',
        variants[variant],
        onClick && 'cursor-pointer',
        className
      )}
      whileHover={hover ? {
        scale: 1.02,
        boxShadow: '0 0 30px rgba(255,215,0,0.3)',
        y: -4,
      } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}
```

#### Component 3: Stats Counter
Create `src/components/ui/Counter.tsx`:

```typescript
import { useCountUp } from 'react-countup'
import { useInView } from 'framer-motion'
import { useRef, useEffect } from 'react'

interface CounterProps {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  duration?: number
  className?: string
}

export function Counter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 2,
  className,
}: CounterProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  const { countUp, start } = useCountUp({
    start: 0,
    end: value,
    duration,
    decimals,
    prefix,
    suffix,
    separator: ',',
  })

  useEffect(() => {
    if (isInView) start()
  }, [isInView, start])

  return (
    <span
      ref={ref}
      className={clsx('text-gradient-gold font-display font-extrabold', className)}
    >
      {countUp}
    </span>
  )
}
```

---

### **PHASE 3: Feature Components**

#### Component 4: Pattern Card
Create `src/components/features/PatternCard.tsx`:

```typescript
import { motion } from 'framer-motion'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { WinRateGauge } from '../viz/WinRateGauge'
import { TrendingUp, User, Clock } from 'lucide-react'

interface PatternCardProps {
  tokenId: number
  type: string
  creator: string
  winRate: number
  volume: bigint
  roi: number
  isActive: boolean
  onDelegate?: () => void
}

export function PatternCard({
  tokenId,
  type,
  creator,
  winRate,
  volume,
  roi,
  isActive,
  onDelegate,
}: PatternCardProps) {
  const winRatePercent = Number(winRate) / 100

  return (
    <Card variant="elevated" className="group">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gradient-gold mb-1">
            {type.toUpperCase()} STRATEGY
          </h3>
          <p className="text-gray-text text-sm">Token ID: #{tokenId}</p>
        </div>
        <Badge variant={isActive ? 'success' : 'muted'}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Win Rate Gauge - Center Piece */}
      <div className="flex justify-center my-8">
        <WinRateGauge value={winRatePercent} size={180} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatItem
          icon={<TrendingUp size={20} />}
          label="ROI"
          value={`${roi > 0 ? '+' : ''}${roi}%`}
          color={roi > 0 ? 'text-green-500' : 'text-red-500'}
        />
        <StatItem
          icon={<TrendingUp size={20} />}
          label="Volume"
          value={`${formatVolume(volume)} MON`}
          color="text-yellow-primary"
        />
      </div>

      {/* Creator Info */}
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-text">
        <User size={16} />
        <span>{formatAddress(creator)}</span>
      </div>

      {/* Action Button */}
      <motion.button
        className="w-full bg-gradient-to-r from-yellow-primary to-yellow-glow text-black-bg font-bold py-3 rounded-xl"
        whileHover={{ scale: 1.02, boxShadow: '0 5px 30px rgba(255,215,0,0.5)' }}
        whileTap={{ scale: 0.98 }}
        onClick={onDelegate}
      >
        Delegate to Pattern
      </motion.button>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-radial from-yellow-primary/0 to-yellow-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </Card>
  )
}

function StatItem({ icon, label, value, color }: any) {
  return (
    <div className="flex flex-col items-center p-4 bg-black-bg rounded-xl">
      <div className={clsx('mb-2', color)}>{icon}</div>
      <p className="text-xs text-gray-text mb-1">{label}</p>
      <p className={clsx('text-lg font-bold', color)}>{value}</p>
    </div>
  )
}

function formatVolume(volume: bigint): string {
  const num = Number(volume) / 1e18
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toFixed(2)
}

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
```

#### Component 5: Win Rate Gauge
Create `src/components/viz/WinRateGauge.tsx`:

```typescript
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface WinRateGaugeProps {
  value: number // 0-100
  size?: number
}

export function WinRateGauge({ value, size = 200 }: WinRateGaugeProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setDisplayValue(value), 100)
    return () => clearTimeout(timer)
  }, [value])

  const circumference = 2 * Math.PI * 80
  const offset = circumference - (displayValue / 100) * circumference

  const getColor = (val: number) => {
    if (val >= 80) return '#FFD700' // Gold
    if (val >= 60) return '#FFEB3B' // Yellow
    if (val >= 40) return '#FF9500' // Orange
    return '#FF3B30' // Red
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background Circle */}
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={80}
          stroke="#2A2A2A"
          strokeWidth="12"
          fill="none"
        />

        {/* Animated Progress Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={80}
          stroke={getColor(value)}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
            filter: `drop-shadow(0 0 10px ${getColor(value)})`,
          }}
        />
      </svg>

      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          className="text-5xl font-extrabold"
          style={{ color: getColor(value) }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {Math.round(displayValue)}%
        </motion.div>
        <p className="text-sm text-gray-text mt-2">Win Rate</p>
      </div>

      {/* Glow Effect */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-30"
        style={{ background: getColor(value) }}
      />
    </div>
  )
}
```

---

### **PHASE 4: Layout Components**

#### Component 6: Hero Section
Create `src/components/layout/Hero.tsx`:

```typescript
import { motion } from 'framer-motion'
import { Button } from '../ui/Button'
import { ParticleBackground } from '../effects/ParticleBackground'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <ParticleBackground />

      {/* Content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
        {/* Main Headline */}
        <motion.h1
          className="text-7xl md:text-8xl font-display font-black mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <span className="text-gradient-gold glow-text">
            Your Trading Style,
          </span>
          <br />
          <span className="text-white">
            Now a Product
          </span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="text-xl md:text-2xl text-gray-text mb-12 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          Transform on-chain trading behavior into executable, delegatable infrastructure.
          Powered by <span className="text-yellow-primary font-bold">Envio HyperSync</span>.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <Button variant="primary" size="lg">
            Create Pattern
          </Button>
          <Button variant="secondary" size="lg">
            Browse Patterns
          </Button>
        </motion.div>

        {/* Stats Preview */}
        <motion.div
          className="grid grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          <StatPreview value="2,847" label="Patterns" />
          <StatPreview value="12.4K" label="Delegations" />
          <StatPreview value="$45.2M" label="Volume" />
        </motion.div>
      </div>
    </section>
  )
}

function StatPreview({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-gradient-gold mb-2">{value}</div>
      <div className="text-sm text-gray-text">{label}</div>
    </div>
  )
}
```

---

## 🎯 **Priority Implementation Order**

### Week 1: Core Visual Impact
1. ✅ Install dependencies
2. ✅ Configure Tailwind colors
3. ✅ Create Button component
4. ✅ Create Card component
5. ✅ Update Hero section
6. ✅ Create Pattern cards
7. ✅ Add hover animations

### Week 2: Features & Data
8. ✅ Win Rate Gauge
9. ✅ Stats Counters
10. ✅ Delegation Dashboard
11. ✅ Volume Charts
12. ✅ Loading states
13. ✅ Toast notifications

### Week 3: Polish & Effects
14. ✅ Particle background
15. ✅ Micro-interactions
16. ✅ Page transitions
17. ✅ Responsive design
18. ✅ Performance optimization

---

## 🚀 **Quick Start Commands**

```bash
# Navigate to frontend
cd "src/frontend"

# Install all dependencies
pnpm add framer-motion recharts react-countup lucide-react clsx tailwind-merge

# Start development
pnpm dev

# Build for production
pnpm build
```

---

**Ready to transform the UI! Let's build a winner! 🏆**

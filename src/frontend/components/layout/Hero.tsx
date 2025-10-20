import { motion } from 'framer-motion'
import { Button } from '../ui/Button'
import { Zap, TrendingUp, Shield } from 'lucide-react'

interface HeroProps {
  onCreatePattern?: () => void
  onBrowsePatterns?: () => void
}

export function Hero({ onCreatePattern, onBrowsePatterns }: HeroProps) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-20">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Radial gradient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-primary/10 rounded-full blur-3xl animate-pulse-glow" />

        {/* Grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,215,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,215,0,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-yellow-primary rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 container-custom text-center">
        {/* Main Headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-display font-black mb-6 leading-tight">
            <span className="text-gradient-gold glow-text-strong inline-block">
              Your Trading Style,
            </span>
            <br />
            <span className="text-white">
              Now a Product
            </span>
          </h1>
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="text-xl md:text-2xl text-gray-text mb-12 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          Transform on-chain trading behavior into{' '}
          <span className="text-yellow-primary font-semibold">executable infrastructure</span>.
          Powered by{' '}
          <span className="text-yellow-primary font-semibold">Envio HyperSync</span>
          {' '}on Monad.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <Button
            variant="primary"
            size="lg"
            onClick={onCreatePattern}
            className="group"
          >
            <Zap className="group-hover:animate-pulse" />
            Create Pattern
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={onBrowsePatterns}
          >
            <TrendingUp />
            Browse Patterns
          </Button>
        </motion.div>

        {/* Stats Preview */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          <StatPreview
            icon={<TrendingUp size={24} />}
            value="2,847"
            label="Active Patterns"
            delay={1.0}
          />
          <StatPreview
            icon={<Shield size={24} />}
            value="12.4K"
            label="Delegations"
            delay={1.1}
          />
          <StatPreview
            icon={<Zap size={24} />}
            value="$45.2M"
            label="Total Volume"
            delay={1.2}
          />
        </motion.div>

        {/* Feature Pills */}
        <motion.div
          className="flex flex-wrap gap-3 justify-center mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.8 }}
        >
          <FeaturePill text="Sub-50ms Queries" />
          <FeaturePill text="Multi-Layer Delegation" />
          <FeaturePill text="Automated Execution" />
          <FeaturePill text="Gas Optimized" />
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-yellow-primary/30 flex justify-center p-2">
          <motion.div
            className="w-1 h-3 bg-yellow-primary rounded-full"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  )
}

// Helper Components
function StatPreview({ icon, value, label, delay }: any) {
  return (
    <motion.div
      className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-black-card/50 border border-gray-border hover:border-yellow-primary/30 transition-colors"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring' }}
      whileHover={{ scale: 1.05 }}
    >
      <div className="text-yellow-primary">{icon}</div>
      <div className="text-3xl font-bold text-gradient-gold">{value}</div>
      <div className="text-sm text-gray-text font-medium">{label}</div>
    </motion.div>
  )
}

function FeaturePill({ text }: { text: string }) {
  return (
    <motion.div
      className="px-4 py-2 rounded-full bg-black-card border border-yellow-primary/20 text-sm text-gray-text hover:text-yellow-primary hover:border-yellow-primary/50 transition-colors cursor-default"
      whileHover={{ scale: 1.05 }}
    >
      {text}
    </motion.div>
  )
}

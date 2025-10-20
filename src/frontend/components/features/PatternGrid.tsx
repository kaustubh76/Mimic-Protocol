import { motion } from 'framer-motion'
import { PatternCard } from './PatternCard'
import { Loader2 } from 'lucide-react'

interface Pattern {
  tokenId: number
  type: string
  creator: string
  winRate: number
  volume: bigint
  roi: number
  isActive: boolean
  createdAt?: bigint
}

interface PatternGridProps {
  patterns: Pattern[]
  loading?: boolean
  onDelegate?: (tokenId: number) => void
  onViewDetails?: (tokenId: number) => void
}

export function PatternGrid({ patterns, loading, onDelegate, onViewDetails }: PatternGridProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-12 h-12 text-yellow-primary animate-spin" />
        <p className="text-gray-text text-lg">Loading patterns...</p>
      </div>
    )
  }

  if (patterns.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-center p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-24 h-24 rounded-full bg-yellow-primary/10 flex items-center justify-center">
          <span className="text-5xl">🎨</span>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">No Patterns Yet</h3>
          <p className="text-gray-text max-w-md">
            Be the first to create a trading pattern! Successful patterns earn reputation and delegation fees.
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
    >
      {patterns.map((pattern, index) => (
        <motion.div
          key={pattern.tokenId}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <PatternCard
            tokenId={pattern.tokenId}
            type={pattern.type}
            creator={pattern.creator}
            winRate={pattern.winRate}
            volume={pattern.volume}
            roi={pattern.roi}
            isActive={pattern.isActive}
            createdAt={pattern.createdAt}
            onDelegate={() => onDelegate?.(pattern.tokenId)}
            onViewDetails={() => onViewDetails?.(pattern.tokenId)}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, User, Clock, Zap } from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { WinRateGauge } from '../viz/WinRateGauge'
import { formatAddress, formatVolume, formatROI, formatTimestamp } from '../../lib/utils'

interface PatternCardProps {
  tokenId: number
  type: string
  creator: string
  winRate: number  // 0-10000 (basis points)
  volume: bigint
  roi: number      // basis points
  isActive: boolean
  createdAt?: bigint
  onDelegate?: () => void
  onViewDetails?: () => void
}

export function PatternCard({
  tokenId,
  type,
  creator,
  winRate,
  volume,
  roi,
  isActive,
  createdAt,
  onDelegate,
  onViewDetails,
}: PatternCardProps) {
  // Convert basis points to percentage
  const winRatePercent = Number(winRate) / 100
  const roiPercent = Number(roi) / 100

  return (
    <Card
      variant="elevated"
      className="group overflow-hidden"
      hover={!!onViewDetails}
      onClick={onViewDetails}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gradient-gold glow-text mb-2">
            {type.toUpperCase()} STRATEGY
          </h3>
          <p className="text-gray-text text-sm flex items-center gap-2">
            <Zap size={14} className="text-yellow-primary" />
            Token ID #{tokenId}
          </p>
        </div>
        <Badge variant={isActive ? 'success' : 'muted'} pulse={isActive}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Win Rate Gauge - Center Showpiece */}
      <div className="flex justify-center my-8">
        <WinRateGauge value={winRatePercent} size={180} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatItem
          icon={roiPercent > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          label="ROI"
          value={formatROI(roiPercent)}
          color={roiPercent > 0 ? 'text-success' : 'text-error'}
        />
        <StatItem
          icon={<TrendingUp size={20} />}
          label="Volume"
          value={`${formatVolume(volume)} MON`}
          color="text-yellow-primary"
        />
      </div>

      {/* Creator & Time Info */}
      <div className="flex items-center justify-between mb-6 pt-4 border-t border-gray-border">
        <div className="flex items-center gap-2 text-sm text-gray-text">
          <User size={16} />
          <span>{formatAddress(creator)}</span>
        </div>
        {createdAt && (
          <div className="flex items-center gap-2 text-sm text-gray-text">
            <Clock size={16} />
            <span>{formatTimestamp(createdAt)}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="primary"
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation()
            onDelegate?.()
          }}
        >
          Delegate
        </Button>
        {onViewDetails && (
          <Button
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails()
            }}
          >
            Details
          </Button>
        )}
      </div>

      {/* Performance Badge Overlay */}
      {winRatePercent >= 80 && (
        <motion.div
          className="absolute top-4 right-4 bg-yellow-primary text-black-bg px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: -12 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          <TrendingUp size={14} />
          TOP PERFORMER
        </motion.div>
      )}
    </Card>
  )
}

// Helper component for stats
function StatItem({ icon, label, value, color }: any) {
  return (
    <motion.div
      className="flex flex-col items-center p-4 bg-black-bg rounded-xl border border-gray-border hover:border-yellow-primary/30 transition-colors"
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400 }}
    >
      <div className={`mb-2 ${color}`}>{icon}</div>
      <p className="text-xs text-gray-text mb-1 font-medium">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </motion.div>
  )
}

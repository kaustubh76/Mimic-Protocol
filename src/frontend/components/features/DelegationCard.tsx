import { motion } from 'framer-motion'
import { TrendingUp, Percent, Calendar, X } from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { formatAddress, formatVolume, formatPercent, formatTimestamp } from '../../lib/utils'

interface DelegationCardProps {
  delegationId: bigint
  patternTokenId: bigint
  patternType?: string
  percentageAllocation: bigint
  smartAccountAddress: string
  isActive: boolean
  createdAt: bigint
  totalSpentToday: bigint
  maxSpendPerDay: bigint
  onRevoke?: () => void
  onViewPattern?: () => void
}

export function DelegationCard({
  delegationId,
  patternTokenId,
  patternType = 'Unknown',
  percentageAllocation,
  smartAccountAddress,
  isActive,
  createdAt,
  totalSpentToday,
  maxSpendPerDay,
  onRevoke,
  onViewPattern,
}: DelegationCardProps) {
  // Convert basis points to percentage
  const allocationPercent = Number(percentageAllocation) / 100
  const spentToday = Number(totalSpentToday) / 1e18
  const maxDaily = Number(maxSpendPerDay)
  const isUnlimited = maxDaily >= 10000000000000000000n // Very large number = unlimited

  return (
    <Card variant="elevated" className="group">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-bold text-white">
              {patternType.toUpperCase()} STRATEGY
            </h3>
            <Badge variant={isActive ? 'success' : 'muted'} pulse={isActive}>
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="text-gray-text text-sm">
            Delegation #{Number(delegationId)} • Pattern #{Number(patternTokenId)}
          </p>
        </div>
      </div>

      {/* Allocation Display */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-text">Allocation</span>
          <span className="text-2xl font-bold text-gradient-gold">
            {allocationPercent}%
          </span>
        </div>
        <div className="w-full h-3 bg-black-bg rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-yellow-primary to-yellow-glow shadow-glow"
            initial={{ width: 0 }}
            animate={{ width: `${allocationPercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatItem
          icon={<Percent size={18} />}
          label="Daily Spend"
          value={isUnlimited ? 'Unlimited' : `${spentToday.toFixed(2)} / ${formatVolume(maxDaily)}`}
          color="text-yellow-primary"
        />
        <StatItem
          icon={<Calendar size={18} />}
          label="Created"
          value={formatTimestamp(createdAt)}
          color="text-gray-text"
        />
      </div>

      {/* Smart Account */}
      <div className="mb-6 p-4 bg-black-bg rounded-xl border border-gray-border">
        <p className="text-xs text-gray-text mb-1">Smart Account</p>
        <p className="text-sm font-mono text-yellow-primary">
          {formatAddress(smartAccountAddress)}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onViewPattern && (
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onViewPattern}
          >
            <TrendingUp size={18} />
            View Pattern
          </Button>
        )}
        {onRevoke && isActive && (
          <Button
            variant="danger"
            onClick={onRevoke}
          >
            <X size={18} />
            Revoke
          </Button>
        )}
      </div>
    </Card>
  )
}

// Helper component
function StatItem({ icon, label, value, color }: any) {
  return (
    <div className="flex flex-col gap-2 p-3 bg-black-bg rounded-xl border border-gray-border">
      <div className={`flex items-center gap-2 ${color}`}>
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={`text-sm font-semibold ${color}`}>{value}</p>
    </div>
  )
}

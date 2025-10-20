/**
 * @file My Delegations with beautiful UI
 * @description Clean, modern delegation management interface
 */

import { useAccount } from 'wagmi'
import { useDelegationsByUser } from '../hooks/useDelegationData'
import { DelegationCard } from './features/DelegationCard'
import { motion } from 'framer-motion'
import { Loader2, TrendingUp, Shield } from 'lucide-react'
import { Button } from './ui/Button'

export function MyDelegations() {
  const { address } = useAccount()
  const { delegations, loading, error, refetch } = useDelegationsByUser(address)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-12 h-12 text-yellow-primary animate-spin" />
        <p className="text-gray-text text-lg">Loading your delegations...</p>
      </div>
    )
  }

  if (error) {
    return (
      <motion.div
        className="p-8 bg-error/10 border border-error/30 rounded-2xl max-w-2xl mx-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <h3 className="text-xl font-bold text-error mb-2">Error Loading Delegations</h3>
        <p className="text-sm text-gray-text mb-4">{error.message}</p>
        <Button variant="danger" onClick={refetch}>
          Try Again
        </Button>
      </motion.div>
    )
  }

  if (delegations.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-center p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-32 h-32 rounded-full bg-yellow-primary/10 flex items-center justify-center">
          <Shield className="w-16 h-16 text-yellow-primary" />
        </div>
        <div>
          <h3 className="text-3xl font-bold text-white mb-3">No Delegations Yet</h3>
          <p className="text-gray-text max-w-md mb-6">
            You haven't delegated to any trading patterns yet. Browse available patterns and start delegating to earn passive returns!
          </p>
          <Button variant="primary" size="lg">
            <TrendingUp size={20} />
            Browse Patterns
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 w-full max-w-3xl">
          <InfoCard
            emoji="🎨"
            title="Find Patterns"
            description="Browse proven trading strategies"
          />
          <InfoCard
            emoji="💰"
            title="Delegate Funds"
            description="Allocate % of your capital"
          />
          <InfoCard
            emoji="⚡"
            title="Earn Returns"
            description="Patterns execute automatically"
          />
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <motion.div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="text-3xl font-bold text-gradient-gold mb-2">
            My Delegations
          </h2>
          <p className="text-gray-text">
            Manage your active delegations to trading patterns
          </p>
        </div>
        <Button variant="primary" onClick={refetch}>
          <TrendingUp size={18} />
          Refresh
        </Button>
      </motion.div>

      {/* Portfolio Summary */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <SummaryCard
          label="Total Delegations"
          value={delegations.length}
          icon="🤝"
        />
        <SummaryCard
          label="Active"
          value={delegations.filter(d => d.isActive).length}
          icon="✅"
        />
        <SummaryCard
          label="Total Delegated"
          value="0 MON"
          icon="💰"
          subtitle="Coming soon"
        />
      </motion.div>

      {/* Delegations Grid */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
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
        {delegations.map((delegation) => (
          <motion.div
            key={Number(delegation.delegationId)}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            <DelegationCard
              delegationId={delegation.delegationId}
              patternTokenId={delegation.patternTokenId}
              patternType="Pattern" // TODO: Fetch pattern type
              percentageAllocation={delegation.percentageAllocation}
              smartAccountAddress={delegation.smartAccountAddress}
              isActive={delegation.isActive}
              createdAt={delegation.createdAt}
              totalSpentToday={delegation.totalSpentToday}
              maxSpendPerDay={delegation.permissions.maxSpendPerDay}
              onRevoke={() => {
                console.log('Revoke delegation:', delegation.delegationId)
                alert('Revoke functionality coming soon!')
              }}
              onViewPattern={() => {
                console.log('View pattern:', delegation.patternTokenId)
              }}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

// Helper Components
function SummaryCard({ label, value, icon, subtitle }: any) {
  return (
    <div className="p-6 bg-black-card border border-gray-border rounded-xl hover:border-yellow-primary/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-text text-sm font-medium">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-gradient-gold mb-1">
        {typeof value === 'number' ? value : value}
      </div>
      {subtitle && (
        <div className="text-xs text-gray-muted">{subtitle}</div>
      )}
    </div>
  )
}

function InfoCard({ emoji, title, description }: any) {
  return (
    <div className="p-4 bg-black-card border border-gray-border rounded-xl text-center">
      <div className="text-3xl mb-2">{emoji}</div>
      <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>
      <p className="text-xs text-gray-text">{description}</p>
    </div>
  )
}

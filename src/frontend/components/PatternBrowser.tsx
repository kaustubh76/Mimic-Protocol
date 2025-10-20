/**
 * @file Pattern Browser with beautiful UI
 * @description Uses PatternCard and PatternGrid components for modern, responsive design
 */

import { useAllPatterns } from '../hooks/usePatternData'
import { PatternGrid } from './features/PatternGrid'
import { motion } from 'framer-motion'
import { Search, Filter, TrendingUp } from 'lucide-react'
import { Button } from './ui/Button'
import { useState } from 'react'

export function PatternBrowser() {
  const { patterns, loading, error, refetch } = useAllPatterns()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | null>(null)

  // Filter patterns
  const filteredPatterns = patterns.filter(pattern => {
    const matchesSearch = pattern.patternType.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterActive === null || pattern.isActive === filterActive
    return matchesSearch && matchesFilter
  })

  // Transform to PatternGrid format
  const gridPatterns = filteredPatterns.map(p => ({
    tokenId: Number(p.tokenId),
    type: p.patternType,
    creator: p.creator,
    winRate: Number(p.winRate),
    volume: p.totalVolume,
    roi: Number(p.roi),
    isActive: p.isActive,
    createdAt: p.createdAt,
  }))

  const handleDelegate = (tokenId: number) => {
    console.log('Delegate to pattern:', tokenId)
    // TODO: Implement delegation flow
    alert(`Delegation flow for Pattern #${tokenId} will be implemented here!`)
  }

  const handleViewDetails = (tokenId: number) => {
    console.log('View pattern details:', tokenId)
    // TODO: Implement pattern details modal
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
            Trading Patterns
          </h2>
          <p className="text-gray-text">
            Browse and delegate to proven on-chain trading strategies
          </p>
        </div>
        <Button variant="primary" onClick={refetch}>
          <TrendingUp size={18} />
          Refresh
        </Button>
      </motion.div>

      {/* Search and Filter Bar */}
      <motion.div
        className="flex flex-col sm:flex-row gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-text" size={20} />
          <input
            type="text"
            placeholder="Search patterns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-black-card border border-gray-border rounded-xl text-white placeholder-gray-text focus:outline-none focus:border-yellow-primary focus:ring-2 focus:ring-yellow-primary/20 transition-all"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <Button
            variant={filterActive === null ? 'primary' : 'secondary'}
            size="md"
            onClick={() => setFilterActive(null)}
          >
            <Filter size={18} />
            All
          </Button>
          <Button
            variant={filterActive === true ? 'primary' : 'secondary'}
            size="md"
            onClick={() => setFilterActive(true)}
          >
            Active
          </Button>
          <Button
            variant={filterActive === false ? 'primary' : 'secondary'}
            size="md"
            onClick={() => setFilterActive(false)}
          >
            Inactive
          </Button>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <StatCard
          label="Total Patterns"
          value={patterns.length}
          icon="🎨"
        />
        <StatCard
          label="Active Patterns"
          value={patterns.filter(p => p.isActive).length}
          icon="✅"
        />
        <StatCard
          label="Showing"
          value={filteredPatterns.length}
          icon="🔍"
        />
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div
          className="p-6 bg-error/10 border border-error/30 rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-error font-semibold mb-2">Error loading patterns</p>
          <p className="text-sm text-gray-text">{error.message}</p>
          <Button variant="danger" size="sm" onClick={refetch} className="mt-4">
            Try Again
          </Button>
        </motion.div>
      )}

      {/* Pattern Grid */}
      <PatternGrid
        patterns={gridPatterns}
        loading={loading}
        onDelegate={handleDelegate}
        onViewDetails={handleViewDetails}
      />
    </div>
  )
}

// Helper Component
function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="p-6 bg-black-card border border-gray-border rounded-xl hover:border-yellow-primary/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-text text-sm font-medium">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-gradient-gold">{value}</div>
    </div>
  )
}

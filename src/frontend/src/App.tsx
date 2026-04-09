/**
 * @file Main Application Component - Redesigned with Glassmorphism & Fluid Animations
 * @description Mirror Protocol - Complete integration with stunning modern UI
 */

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import { WalletConnect } from './components/WalletConnect'
import { useSmartAccount } from './hooks/useSmartAccount'
import { PatternBrowser } from './components/PatternBrowser'
import { PatternLeaderboard } from './components/PatternLeaderboard'
import { MyDelegations } from './components/MyDelegations'
import { EnvioMetricsDashboard } from './components/EnvioMetricsDashboard'
import { useUserStats } from './hooks/useUserStats'
import { ENVIO_GRAPHQL_URL } from './contracts/config'
import { useEnvioMetrics } from './hooks/useEnvioMetrics'
import { MONAD_CHAIN_ID } from './contracts/config'
import './globals.css'

type Tab = 'patterns' | 'delegations' | 'account'

export function App() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { smartAccount, isLoading, error } = useSmartAccount()
  const { data: userStats } = useUserStats(address)
  const { metrics } = useEnvioMetrics()
  const [activeTab, setActiveTab] = useState<Tab>('patterns')
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const isCorrectChain = chainId === MONAD_CHAIN_ID

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <div className="min-h-screen relative" style={{ position: 'relative', zIndex: 1 }}>
      {/* Main Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${
        scrolled ? 'border-white/10 shadow-lg shadow-black/20' : 'border-white/5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Brand Section */}
            <div className={`flex items-center gap-4 ${mounted ? 'animate-slide-up' : 'opacity-0'}`}>
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-2xl shadow-glow">
                🔄
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient-primary">
                  Mirror Protocol
                </h1>
                <p className="text-sm text-muted">
                  Powered by Envio HyperSync · Monad Testnet
                </p>
              </div>
            </div>

            {/* Wallet Connection */}
            <div className={mounted ? 'animate-fade-in' : 'opacity-0'} style={{ animationDelay: '100ms' }}>
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      {/* Chain Warning Banner */}
      {isConnected && !isCorrectChain && (
        <div className="bg-gradient-accent border-b border-yellow-500/20 animate-slide-up">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-xl">⚠️</span>
              <span className="font-semibold">
                Please switch to Monad Testnet (Chain ID: {MONAD_CHAIN_ID})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {!isConnected ? (
          /* Hero Section - Not Connected */
          <motion.div
            className="space-y-16"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.15 } }
            }}
          >
            {/* Hero Banner */}
            <section className="text-center space-y-6 py-16">
              <motion.div
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm font-semibold mb-4"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-gradient-secondary">Sub-50ms Pattern Detection</span>
              </motion.div>

              <motion.h1
                variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
              >
                <span className="text-gradient-primary">Transform Trading</span>
                <br />
                <span className="text-white">Into Infrastructure</span>
              </motion.h1>

              <motion.p
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                className="text-xl text-secondary max-w-2xl mx-auto"
              >
                Mirror Protocol turns on-chain trading behavior into executable, delegatable NFTs.
                Powered by Envio's lightning-fast indexing on Monad.
              </motion.p>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                className="flex flex-wrap items-center justify-center gap-4 pt-4"
              >
                <div className="glass-card px-6 py-3">
                  <div className="text-2xl font-bold text-gradient-primary">
                    {metrics?.peakEventsPerSecond || 102}
                  </div>
                  <div className="text-xs text-muted">Events/Second (Peak)</div>
                </div>
                <div className="glass-card px-6 py-3">
                  <div className="text-2xl font-bold text-gradient-secondary">
                    {metrics?.averageProcessingTime || 1}ms
                  </div>
                  <div className="text-xs text-muted">Avg Processing Time</div>
                </div>
                <div className="glass-card px-6 py-3">
                  <div className="text-2xl font-bold text-gradient-accent">
                    {metrics?.totalPatterns || 7}
                  </div>
                  <div className="text-xs text-muted">Live Patterns</div>
                </div>
                <div className="glass-card px-6 py-3">
                  <div className="text-2xl font-bold text-green-400">
                    {metrics?.totalExecutions || 16}
                  </div>
                  <div className="text-xs text-muted">Trades Executed</div>
                </div>
              </motion.div>
            </section>

            {/* Feature Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: '⚡', gradient: 'bg-gradient-primary', title: 'Real-time Detection', desc: "Envio HyperSync indexes trading patterns in sub-50ms, 50x faster than alternatives" },
                { icon: '🎨', gradient: 'bg-gradient-secondary', title: 'NFT-based Patterns', desc: "Successful trading patterns become tradeable ERC-721 NFTs with performance metrics" },
                { icon: '🤝', gradient: 'bg-gradient-accent', title: 'Smart Delegations', desc: "Delegate capital to proven patterns via MetaMask smart accounts" },
                { icon: '⚙️', gradient: 'bg-gradient-success', title: 'Auto Execution', desc: "Patterns execute automatically when on-chain conditions match" },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ delay: i * 0.08 }}
                  className="glass-card glass-card-hover p-6 space-y-3"
                >
                  <div className={`w-12 h-12 rounded-lg ${feature.gradient} flex items-center justify-center text-2xl`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold">{feature.title}</h3>
                  <p className="text-sm text-secondary">{feature.desc}</p>
                </motion.div>
              ))}
            </section>

            {/* Live Envio Metrics — visible to everyone */}
            <motion.section
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            >
              <EnvioMetricsDashboard />
            </motion.section>

            {/* Live Pattern Leaderboard — show real indexed data */}
            <motion.section
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            >
              <PatternLeaderboard />
            </motion.section>

            {/* CTA Section */}
            <motion.section
              variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
              className="text-center py-12"
            >
              <div className="glass-card inline-block p-8 space-y-4">
                <h2 className="text-2xl font-bold">Ready to Start?</h2>
                <p className="text-secondary">Connect your wallet to browse patterns and create delegations</p>
                <div className="pt-2">
                  <div className="inline-flex items-center gap-2 text-sm text-muted">
                    <span>👆</span>
                    <span>Click "Connect Wallet" above</span>
                  </div>
                </div>
              </div>
            </motion.section>
          </motion.div>
        ) : (
          /* Connected User Interface */
          <div className="space-y-8">
            {/* Stats Dashboard */}
            {userStats && (
              <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: userStats.patternsCreated, label: 'Patterns Created' },
                  { value: userStats.activeDelegations, label: 'Active Delegations' },
                  { value: userStats.totalVolume.toFixed(2), label: 'Total Volume' },
                  { value: userStats.totalEarnings.toFixed(2), label: 'Total Earnings' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    className="stat-card"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.3 }}
                  >
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                  </motion.div>
                ))}
              </section>
            )}

            {/* Envio Live Metrics Dashboard */}
            <section className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <EnvioMetricsDashboard />
            </section>

            {/* Tab Navigation */}
            <nav className="glass-card p-2 inline-flex gap-2 animate-slide-up">
              {([
                { id: 'patterns' as Tab, label: 'Browse Patterns' },
                { id: 'delegations' as Tab, label: 'My Delegations' },
                { id: 'account' as Tab, label: 'Smart Account' },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className="relative px-6 py-3 rounded-lg font-semibold transition-colors"
                  style={{ color: activeTab === tab.id ? '#fff' : undefined }}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute inset-0 rounded-lg bg-gradient-primary shadow-lg"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className={`relative z-10 ${activeTab !== tab.id ? 'text-secondary hover:text-white/80' : ''}`}>
                    {tab.label}
                  </span>
                  {tab.id === 'delegations' && userStats && userStats.activeDelegations > 0 && (
                    <span className="absolute -top-1 -right-1 z-20 w-5 h-5 bg-gradient-accent rounded-full flex items-center justify-center text-xs font-bold">
                      {userStats.activeDelegations}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {activeTab === 'patterns' && (
                  <div className="space-y-8">
                    <PatternLeaderboard />
                    <PatternBrowser />
                  </div>
                )}

                {activeTab === 'delegations' && <MyDelegations />}

                {activeTab === 'account' && (
                  <div className="space-y-6">
                    <div className="glass-card p-8">
                      <h2 className="text-2xl font-bold mb-6">Smart Account Status</h2>

                      {isLoading && (
                        <div className="text-center py-12 space-y-4">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary animate-pulse">
                            <div className="spinner-small"></div>
                          </div>
                          <p className="text-secondary">Creating smart account...</p>
                        </div>
                      )}

                      {error && (
                        <div className="error-message">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">❌</span>
                            <div>
                              <p className="font-semibold mb-2">Error creating smart account</p>
                              <code className="text-sm">{error.message}</code>
                            </div>
                          </div>
                        </div>
                      )}

                      {smartAccount && (
                        <motion.div
                          className="space-y-6"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="glass-card p-6 border-green-500/20 bg-green-500/5">
                            <div className="flex items-center gap-3 mb-4">
                              <span className="text-3xl">✅</span>
                              <h3 className="text-xl font-bold text-success">Smart Account Active!</h3>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                <span className="text-sm text-muted">Smart Account</span>
                                <code className="hash-code text-xs">{smartAccount.address}</code>
                              </div>
                              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                <span className="text-sm text-muted">Owner (EOA)</span>
                                <code className="hash-code text-xs">{address}</code>
                              </div>
                            </div>
                          </div>

                          {userStats && (
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="glass-card p-6 text-center">
                                <div className="text-4xl font-bold text-gradient-primary mb-2">
                                  {userStats.patternsCreated}
                                </div>
                                <div className="text-sm text-muted">Patterns Created</div>
                              </div>
                              <div className="glass-card p-6 text-center">
                                <div className="text-4xl font-bold text-gradient-secondary mb-2">
                                  {userStats.activeDelegations}
                                </div>
                                <div className="text-sm text-muted">Active Delegations</div>
                              </div>
                            </div>
                          )}

                          <div className="glass-card p-6 bg-blue-500/5 border-blue-500/20">
                            <p className="text-success font-semibold">
                              🎉 Your smart account is ready! You can now delegate to trading patterns.
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {!isLoading && !error && !smartAccount && (
                        <div className="text-center py-12 text-muted">
                          <div className="loading-skeleton w-24 h-24 rounded-full mx-auto mb-4"></div>
                          <p>Initializing smart account...</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col items-center md:items-start gap-1">
              <p className="text-sm text-muted">
                Mirror Protocol · Monad Hackathon 2025
              </p>
              <div className="flex items-center gap-3 text-xs text-muted">
                <a href="https://github.com/kaustubh76/Mimic-Protocol" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  GitHub
                </a>
                <span>·</span>
                <a href={ENVIO_GRAPHQL_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  GraphQL API
                </a>
                <span>·</span>
                <a href="https://explorer.testnet.monad.xyz/address/0x6943e7D39F3799d0b8fa9D6aD6B63861a15a8d26" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Contracts
                </a>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-primary">
                Powered by Envio
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-secondary">
                MetaMask Toolkit
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-accent">
                Deployed on Monad
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

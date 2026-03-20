/**
 * @file Main Application Component - Redesigned with Glassmorphism & Fluid Animations
 * @description Mirror Protocol - Complete integration with stunning modern UI
 */

import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { WalletConnect } from './components/WalletConnect'
import { useSmartAccount } from './hooks/useSmartAccount'
import { PatternBrowser } from './components/PatternBrowser'
import { PatternLeaderboard } from './components/PatternLeaderboard'
import { MyDelegations } from './components/MyDelegations'
import { EnvioMetricsDashboard } from './components/EnvioMetricsDashboard'
import { useUserStats } from './hooks/useUserStats'
import { MONAD_CHAIN_ID } from './contracts/config'
import './globals.css'

type Tab = 'patterns' | 'delegations' | 'account'

export function App() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { smartAccount, isLoading, error } = useSmartAccount()
  const { data: userStats } = useUserStats(address)
  const [activeTab, setActiveTab] = useState<Tab>('patterns')
  const [mounted, setMounted] = useState(false)

  const isCorrectChain = chainId === MONAD_CHAIN_ID

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen relative" style={{ position: 'relative', zIndex: 1 }}>
      {/* Main Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5">
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
          <div className="space-y-16">
            {/* Hero Banner */}
            <section className={`text-center space-y-6 py-16 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm font-semibold mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-gradient-secondary">Sub-50ms Pattern Detection</span>
              </div>

              <h1 className="text-6xl md:text-7xl font-bold leading-tight">
                <span className="text-gradient-primary">Transform Trading</span>
                <br />
                <span className="text-white">Into Infrastructure</span>
              </h1>

              <p className="text-xl text-secondary max-w-2xl mx-auto">
                Mirror Protocol turns on-chain trading behavior into executable, delegatable NFTs.
                Powered by Envio's lightning-fast indexing on Monad.
              </p>

              <div className="flex items-center justify-center gap-4 pt-4">
                <div className="glass-card px-6 py-3">
                  <div className="text-2xl font-bold text-gradient-primary">10,000+</div>
                  <div className="text-xs text-muted">Events/Second</div>
                </div>
                <div className="glass-card px-6 py-3">
                  <div className="text-2xl font-bold text-gradient-secondary">&lt;50ms</div>
                  <div className="text-xs text-muted">Detection Time</div>
                </div>
                <div className="glass-card px-6 py-3">
                  <div className="text-2xl font-bold text-gradient-accent">10M+</div>
                  <div className="text-xs text-muted">Transactions Analyzed</div>
                </div>
              </div>
            </section>

            {/* Feature Grid */}
            <section className="stagger-animation grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-card glass-card-hover p-6 space-y-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center text-2xl">
                  ⚡
                </div>
                <h3 className="text-lg font-bold">Real-time Detection</h3>
                <p className="text-sm text-secondary">
                  Envio HyperSync indexes trading patterns in sub-50ms, 50x faster than alternatives
                </p>
              </div>

              <div className="glass-card glass-card-hover p-6 space-y-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-secondary flex items-center justify-center text-2xl">
                  🎨
                </div>
                <h3 className="text-lg font-bold">NFT-based Patterns</h3>
                <p className="text-sm text-secondary">
                  Successful trading patterns become tradeable ERC-721 NFTs with performance metrics
                </p>
              </div>

              <div className="glass-card glass-card-hover p-6 space-y-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-accent flex items-center justify-center text-2xl">
                  🤝
                </div>
                <h3 className="text-lg font-bold">Smart Delegations</h3>
                <p className="text-sm text-secondary">
                  Delegate capital to proven patterns via MetaMask smart accounts
                </p>
              </div>

              <div className="glass-card glass-card-hover p-6 space-y-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-success flex items-center justify-center text-2xl">
                  ⚙️
                </div>
                <h3 className="text-lg font-bold">Auto Execution</h3>
                <p className="text-sm text-secondary">
                  Patterns execute automatically when on-chain conditions match
                </p>
              </div>
            </section>

            {/* CTA Section */}
            <section className="text-center py-12 animate-fade-in" style={{ animationDelay: '400ms' }}>
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
            </section>
          </div>
        ) : (
          /* Connected User Interface */
          <div className="space-y-8">
            {/* Stats Dashboard */}
            {userStats && (
              <section className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-animation">
                <div className="stat-card">
                  <div className="stat-value">{userStats.patternsCreated}</div>
                  <div className="stat-label">Patterns Created</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{userStats.activeDelegations}</div>
                  <div className="stat-label">Active Delegations</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{userStats.totalVolume.toFixed(2)}</div>
                  <div className="stat-label">Total Volume</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{userStats.totalEarnings.toFixed(2)}</div>
                  <div className="stat-label">Total Earnings</div>
                </div>
              </section>
            )}

            {/* Envio Live Metrics Dashboard */}
            <section className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <EnvioMetricsDashboard />
            </section>

            {/* Tab Navigation */}
            <nav className="glass-card p-2 inline-flex gap-2 animate-slide-up">
              <button
                onClick={() => setActiveTab('patterns')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'patterns'
                    ? 'bg-gradient-primary text-white shadow-lg'
                    : 'hover:bg-white/5 text-secondary'
                }`}
              >
                Browse Patterns
              </button>
              <button
                onClick={() => setActiveTab('delegations')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all relative ${
                  activeTab === 'delegations'
                    ? 'bg-gradient-primary text-white shadow-lg'
                    : 'hover:bg-white/5 text-secondary'
                }`}
              >
                My Delegations
                {userStats && userStats.activeDelegations > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-accent rounded-full flex items-center justify-center text-xs font-bold">
                    {userStats.activeDelegations}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'account'
                    ? 'bg-gradient-primary text-white shadow-lg'
                    : 'hover:bg-white/5 text-secondary'
                }`}
              >
                Smart Account
              </button>
            </nav>

            {/* Tab Content */}
            <div className="animate-fade-in">
              {activeTab === 'patterns' && (
                <div className="space-y-8">
                  {/* Leaderboard - Show Top 10 Patterns */}
                  <PatternLeaderboard />

                  {/* All Patterns Browser */}
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
                      <div className="space-y-6">
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
                      </div>
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
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted">
              Built for Monad Hackathon 2025 · Mirror Protocol
            </p>
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

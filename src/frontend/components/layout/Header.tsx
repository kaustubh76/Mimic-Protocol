import { motion } from 'framer-motion'
import { Zap, Menu, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { useState } from 'react'

interface HeaderProps {
  isConnected: boolean
  address?: string
  chainName?: string
  onConnect?: () => void
  onDisconnect?: () => void
  patternsCount?: number
  delegationsCount?: number
}

export function Header({
  isConnected,
  address,
  chainName = 'Monad Testnet',
  onConnect,
  onDisconnect,
  patternsCount = 0,
  delegationsCount = 0,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-yellow-primary/10"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-primary to-yellow-glow flex items-center justify-center shadow-glow">
              <Zap size={24} className="text-black-bg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient-gold">
                Mirror Protocol
              </h1>
              <p className="text-xs text-gray-text">Behavioral Liquidity</p>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <NavLink href="#patterns" label="Patterns" count={patternsCount} />
            <NavLink href="#delegations" label="Delegations" count={delegationsCount} />
            <NavLink href="#execute" label="Execute" />
            <NavLink href="#docs" label="Docs" />
          </nav>

          {/* Right Section */}
          <div className="hidden md:flex items-center gap-4">
            {/* Network Badge */}
            <Badge variant="success" pulse>
              {chainName}
            </Badge>

            {/* Wallet Button */}
            {isConnected && address ? (
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="flex flex-col items-end mr-2">
                  <span className="text-xs text-gray-text">Connected</span>
                  <span className="text-sm font-semibold text-yellow-primary">
                    {formatAddress(address)}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onDisconnect}
                >
                  Disconnect
                </Button>
              </motion.div>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={onConnect}
              >
                <Zap size={18} />
                Connect Wallet
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden py-4 border-t border-gray-border"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <nav className="flex flex-col gap-4">
              <MobileNavLink href="#patterns" label="Patterns" count={patternsCount} />
              <MobileNavLink href="#delegations" label="Delegations" count={delegationsCount} />
              <MobileNavLink href="#execute" label="Execute" />
              <MobileNavLink href="#docs" label="Docs" />
              <div className="pt-4 border-t border-gray-border">
                {isConnected ? (
                  <Button variant="secondary" size="md" className="w-full" onClick={onDisconnect}>
                    Disconnect
                  </Button>
                ) : (
                  <Button variant="primary" size="md" className="w-full" onClick={onConnect}>
                    <Zap size={18} />
                    Connect Wallet
                  </Button>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </div>
    </motion.header>
  )
}

// Helper Components
function NavLink({ href, label, count }: { href: string; label: string; count?: number }) {
  return (
    <motion.a
      href={href}
      className="text-gray-text hover:text-yellow-primary transition-colors font-medium flex items-center gap-2"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {label}
      {typeof count === 'number' && count > 0 && (
        <span className="px-2 py-0.5 rounded-full bg-yellow-primary/20 text-yellow-primary text-xs font-bold">
          {count}
        </span>
      )}
    </motion.a>
  )
}

function MobileNavLink({ href, label, count }: { href: string; label: string; count?: number }) {
  return (
    <a
      href={href}
      className="text-gray-text hover:text-yellow-primary transition-colors font-medium flex items-center justify-between py-2"
    >
      <span>{label}</span>
      {typeof count === 'number' && count > 0 && (
        <span className="px-3 py-1 rounded-full bg-yellow-primary/20 text-yellow-primary text-xs font-bold">
          {count}
        </span>
      )}
    </a>
  )
}

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

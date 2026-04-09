import { useState, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { MONAD_CHAIN_ID } from '../contracts/config';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [copied, setCopied] = useState(false);

  const formatAddress = (addr: string) => {
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  };

  const handleConnect = () => {
    const connector = connectors[0];
    if (connector) {
      connect({ connector });
    }
  };

  const handleNetworkSwitch = () => {
    if (switchChain) {
      switchChain({ chainId: MONAD_CHAIN_ID });
    }
  };

  const handleCopyAddress = useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback: select text approach
    }
  }, [address]);

  if (isConnected && address) {
    return (
      <motion.div
        className="flex items-center gap-1 sm:gap-2 flex-wrap"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {chainId !== MONAD_CHAIN_ID && (
          <motion.button
            onClick={handleNetworkSwitch}
            className="btn btn--warning btn--sm"
            whileTap={{ scale: 0.97 }}
          >
            <span>Switch to Monad</span>
          </motion.button>
        )}

        {/* Address pill — click to copy */}
        <button
          onClick={handleCopyAddress}
          className="relative glass-card px-3 py-2 flex items-center gap-2 cursor-pointer hover:border-purple-500/30 transition-all group"
          title={address}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <code className="text-xs sm:text-sm font-semibold text-secondary group-hover:text-white transition-colors">
            {formatAddress(address)}
          </code>
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span
                key="copied"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-xs text-green-400 font-semibold"
              >
                Copied!
              </motion.span>
            ) : (
              <motion.span
                key="copy-icon"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-muted group-hover:text-secondary transition-colors"
              >
                ⎘
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <motion.button
          onClick={() => disconnect()}
          className="btn btn--ghost btn--sm"
          whileTap={{ scale: 0.97 }}
        >
          <span>Disconnect</span>
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.button
      onClick={handleConnect}
      className="btn btn--primary"
      whileTap={{ scale: 0.97 }}
      disabled={isConnecting}
    >
      <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
    </motion.button>
  );
}

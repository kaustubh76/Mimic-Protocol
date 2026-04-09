import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { useCreateDelegation } from '../hooks/useCreateDelegation';
import { Pattern } from '../hooks/usePatterns';
import { formatEther } from 'viem';

interface CreateDelegationModalProps {
  pattern: Pattern;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateDelegationModal({
  pattern,
  isOpen,
  onClose,
  onSuccess,
}: CreateDelegationModalProps) {
  const { address } = useAccount();
  const { createDelegation, hash, isWriting, isConfirming, isConfirmed, error, isPending } = useCreateDelegation();

  const [allocationPercent, setAllocationPercent] = useState<string>('50');
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Handle successful delegation
  useEffect(() => {
    if (isConfirmed && !showSuccess) {
      setShowSuccess(true);
      setCountdown(5);
    }
  }, [isConfirmed, showSuccess]);

  // Countdown timer
  useEffect(() => {
    if (showSuccess && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showSuccess && countdown === 0) {
      onSuccess?.();
      handleClose();
    }
  }, [showSuccess, countdown, onSuccess]);

  const handleClose = () => {
    if (isPending) return; // Don't close during transaction
    setAllocationPercent('50');
    setShowSuccess(false);
    setCountdown(5);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      setValidationError('Please connect your wallet');
      return;
    }

    const percent = parseFloat(allocationPercent);
    if (isNaN(percent) || percent <= 0 || percent > 100) {
      setValidationError('Please enter a valid allocation between 0.01% and 100%');
      return;
    }
    setValidationError(null);

    // Convert percentage to basis points (1% = 100 basis points)
    const basisPoints = BigInt(Math.floor(percent * 100));

    await createDelegation({
      patternTokenId: pattern.tokenId,
      percentageAllocation: basisPoints,
      smartAccountAddress: address as `0x${string}`, // Using EOA as smart account for now
    });
  };

  const winRate = Number(pattern.winRate) / 100;
  const volume = formatEther(pattern.totalVolume);
  const roi = Number(pattern.roi) / 100;

  if (!isOpen) return null;

  return (
    <motion.div
      className="modal-overlay"
      onClick={handleClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {showSuccess ? (
          /* Success State */
          <div className="success-state">
            <div className="mb-6">
              <div className="success-icon">✅</div>
            </div>

            <h2 className="text-2xl font-bold mb-3">Delegation Created!</h2>
            <p className="text-secondary mb-6">
              Your delegation to <span className="text-gradient-primary font-bold">{pattern.patternType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span> has been created successfully.
            </p>

            {hash && (
              <div className="glass-card p-4 mb-6 space-y-2">
                <p className="text-xs text-muted">Transaction Hash</p>
                <code className="hash-code block text-center">
                  {hash.slice(0, 10)}...{hash.slice(-8)}
                </code>
                <a
                  href={`https://explorer.testnet.monad.xyz/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gradient-secondary hover:underline flex items-center justify-center gap-1"
                >
                  <span>View on Explorer</span>
                  <span>↗</span>
                </a>
              </div>
            )}

            <div className="glass-card px-4 sm:px-6 py-3 inline-block">
              <p className="text-sm text-muted">
                Closing in <span className="text-gradient-primary font-bold text-lg">{countdown}</span> seconds...
              </p>
            </div>
          </div>
        ) : (
          /* Form State */
          <>
            <div className="modal-header">
              <div>
                <h2 className="text-2xl font-bold">Create Delegation</h2>
                <p className="text-sm text-muted mt-1">
                  Delegate capital to proven trading patterns
                </p>
              </div>
              <button
                className="close-button"
                onClick={handleClose}
                disabled={isPending}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {/* Pattern Summary */}
              <div className="glass-card p-4 sm:p-6 mb-6 space-y-4">
                <div className="flex items-center gap-3">
                  <span className={`pattern-badge pattern-badge--${pattern.patternType}`}>
                    {pattern.patternType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                  <h3 className="text-lg font-bold">
                    Pattern #{Number(pattern.tokenId)}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-gradient-primary mb-1">
                      {winRate}%
                    </div>
                    <div className="text-xs text-muted">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-gradient-secondary mb-1">
                      {parseFloat(volume).toFixed(0)}
                    </div>
                    <div className="text-xs text-muted">Volume</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg sm:text-xl font-bold mb-1 ${roi >= 0 ? 'text-success' : 'text-error'}`}>
                      {roi > 0 ? '+' : ''}{roi}%
                    </div>
                    <div className="text-xs text-muted">ROI</div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Allocation Input */}
                <div className="form-group">
                  <label htmlFor="allocation" className="block mb-2">
                    <span className="font-semibold">Allocation Percentage</span>
                    <span className="label-hint">How much of your portfolio to delegate</span>
                  </label>

                  <div className="input-with-suffix">
                    <input
                      type="number"
                      id="allocation"
                      min="0.01"
                      max="100"
                      step="0.01"
                      value={allocationPercent}
                      onChange={(e) => { setAllocationPercent(e.target.value); setValidationError(null); }}
                      disabled={isPending}
                      required
                      className={`w-full ${validationError ? 'border-red-500/50 focus:border-red-500' : ''}`}
                    />
                    <span className="input-suffix">%</span>
                  </div>

                  {/* Preset Buttons */}
                  <div className="preset-buttons">
                    <button
                      type="button"
                      className={`btn-preset ${allocationPercent === '25' ? 'bg-purple-500/20 border-purple-500/50 text-white' : ''}`}
                      onClick={() => setAllocationPercent('25')}
                      disabled={isPending}
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      className={`btn-preset ${allocationPercent === '50' ? 'bg-purple-500/20 border-purple-500/50 text-white' : ''}`}
                      onClick={() => setAllocationPercent('50')}
                      disabled={isPending}
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      className={`btn-preset ${allocationPercent === '75' ? 'bg-purple-500/20 border-purple-500/50 text-white' : ''}`}
                      onClick={() => setAllocationPercent('75')}
                      disabled={isPending}
                    >
                      75%
                    </button>
                    <button
                      type="button"
                      className={`btn-preset ${allocationPercent === '100' ? 'bg-purple-500/20 border-purple-500/50 text-white' : ''}`}
                      onClick={() => setAllocationPercent('100')}
                      disabled={isPending}
                    >
                      100%
                    </button>
                  </div>
                  {validationError && (
                    <p className="text-xs text-red-400 mt-1">{validationError}</p>
                  )}
                </div>

                {/* Account Info */}
                <div className="glass-card p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 text-sm">
                    <span className="text-muted">Your Address</span>
                    <code className="hash-code-small">
                      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                    </code>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 text-sm">
                    <span className="text-muted">Smart Account</span>
                    <code className="hash-code-small">
                      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                    </code>
                  </div>
                  <div className="text-xs text-muted bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
                    <span>ℹ️ Currently using your EOA as smart account. MetaMask Delegation Toolkit integration coming soon.</span>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="error-message animate-slide-in">
                    <div className="flex items-start gap-2">
                      <span className="text-xl">❌</span>
                      <div>
                        <p className="font-semibold">Transaction Error</p>
                        <p className="text-sm mt-1">{error.message}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Transaction Status */}
                {isWriting && (
                  <div className="status-message status-message--pending">
                    <span className="spinner-small"></span>
                    <div>
                      <p className="font-semibold">Waiting for confirmation...</p>
                      <p className="text-xs text-muted mt-1">Please approve the transaction in your wallet</p>
                    </div>
                  </div>
                )}

                {isConfirming && (
                  <div className="status-message status-message--confirming">
                    <span className="spinner-small"></span>
                    <div className="flex-1">
                      <p className="font-semibold">Transaction submitted!</p>
                      <p className="text-xs text-muted mt-1">Waiting for blockchain confirmation...</p>
                      {hash && (
                        <code className="hash-code-small mt-2 block">
                          {hash.slice(0, 10)}...{hash.slice(-8)}
                        </code>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn--secondary flex-1"
                    onClick={handleClose}
                    disabled={isPending}
                  >
                    <span>Cancel</span>
                  </button>
                  <button
                    type="submit"
                    className="btn btn--primary flex-1"
                    disabled={isPending || !address}
                  >
                    <span>{isPending ? 'Creating...' : 'Create Delegation'}</span>
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

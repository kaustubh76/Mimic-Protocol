import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUpdateDelegation } from '../hooks/useUpdateDelegation';
import type { Delegation } from '../hooks/useDelegations';

interface UpdateDelegationModalProps {
  isOpen: boolean;
  onClose: () => void;
  delegation: Delegation | null;
  onSuccess?: () => void;
}

export function UpdateDelegationModal({
  isOpen,
  onClose,
  delegation,
  onSuccess
}: UpdateDelegationModalProps) {
  const [percentage, setPercentage] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    updateDelegation,
    hash,
    isWriting,
    isConfirming,
    isConfirmed,
    error,
    reset
  } = useUpdateDelegation();

  // Initialize with current allocation and reset error state on open
  useEffect(() => {
    if (delegation && isOpen) {
      setPercentage((Number(delegation.percentageAllocation) / 100).toString());
      setShowSuccess(false);
      setCountdown(5);
      reset();
    }
  }, [delegation, isOpen]);

  // Handle success state
  useEffect(() => {
    if (isConfirmed) {
      setShowSuccess(true);
      setCountdown(5);
    }
  }, [isConfirmed]);

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
    setPercentage('');
    setShowSuccess(false);
    setCountdown(5);
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!delegation) return;

    const percentageNum = parseFloat(percentage);
    if (isNaN(percentageNum) || percentageNum <= 0 || percentageNum > 100) {
      setValidationError('Please enter a valid percentage between 0.01 and 100');
      return;
    }
    setValidationError(null);

    try {
      await updateDelegation({
        delegationId: delegation.delegationId,
        newPercentageAllocation: Math.floor(percentageNum * 100), // Convert to basis points
      });
    } catch (err) {
      console.error('Update delegation failed:', err);
    }
  };

  const setPresetPercentage = (value: number) => {
    setPercentage(value.toString());
  };

  if (!isOpen || !delegation) return null;

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
            <div className="success-icon">✅</div>
            <h2 className="text-2xl font-bold mb-2">Delegation Updated!</h2>
            <p className="text-secondary mb-6">
              Your delegation allocation has been successfully updated
            </p>
            <div className="glass-card p-4 mb-6">
              <p className="text-sm text-muted mb-2">Transaction Hash</p>
              <code className="hash-code">
                {hash?.slice(0, 10)}...{hash?.slice(-8)}
              </code>
            </div>
            <p className="text-sm text-muted">
              Closing in {countdown} second{countdown !== 1 ? 's' : ''}...
            </p>
          </div>
        ) : (
          /* Update Form */
          <>
            <div className="modal-header">
              <h2>Update Delegation</h2>
              <button className="close-button" onClick={handleClose}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Delegation Info */}
                <div className="glass-card p-4 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                    <span className="text-sm text-muted">Pattern</span>
                    <span className="font-bold">{delegation.patternName}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                    <span className="text-sm text-muted">Current Allocation</span>
                    <span className="font-bold text-gradient-primary">
                      {Number(delegation.percentageAllocation) / 100}%
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-sm text-muted">Pattern #</span>
                    <span className="font-bold">{Number(delegation.patternTokenId)}</span>
                  </div>
                </div>

                {/* Percentage Input */}
                <div className="form-group">
                  <label>
                    New Allocation Percentage
                    <span className="label-hint">
                      Choose how much of your capital to allocate to this pattern
                    </span>
                  </label>
                  <div className="input-with-suffix">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="100"
                      value={percentage}
                      onChange={(e) => { setPercentage(e.target.value); setValidationError(null); }}
                      placeholder="Enter percentage (0.01 - 100)"
                      required
                      disabled={isWriting || isConfirming}
                      className={validationError ? 'border-red-500/50 focus:border-red-500' : ''}
                    />
                    <span className="input-suffix">%</span>
                  </div>
                  <div className="preset-buttons">
                    {[10, 25, 50, 100].map((val) => (
                      <button
                        key={val}
                        type="button"
                        className={`btn-preset ${percentage === val.toString() ? 'bg-purple-500/20 border-purple-500/50 text-white' : ''}`}
                        onClick={() => setPresetPercentage(val)}
                        disabled={isWriting || isConfirming}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                  {validationError && (
                    <p className="text-xs text-red-400 mt-1">{validationError}</p>
                  )}
                </div>

                {/* Transaction Status */}
                {isWriting && (
                  <div className="status-message status-message--pending">
                    <div className="spinner-small"></div>
                    <span>Waiting for wallet confirmation...</span>
                  </div>
                )}

                {isConfirming && hash && (
                  <div className="status-message status-message--confirming">
                    <div className="spinner-small"></div>
                    <div>
                      <div className="font-semibold mb-1">Transaction Submitted</div>
                      <div className="text-xs opacity-75">
                        Waiting for confirmation on Ethereum Sepolia...
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="error-message">
                    <strong>Transaction Failed</strong>
                    <p className="text-sm mt-1">{error.message}</p>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn--secondary flex-1"
                  onClick={handleClose}
                  disabled={isWriting || isConfirming}
                >
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  className="btn btn--primary flex-1"
                  disabled={isWriting || isConfirming || !percentage}
                >
                  {isWriting ? (
                    <>
                      <div className="spinner-small"></div>
                      <span>Confirming...</span>
                    </>
                  ) : isConfirming ? (
                    <>
                      <div className="spinner-small"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>📊 Update Delegation</span>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

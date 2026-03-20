import { useState, useEffect } from 'react';
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
  const [countdown, setCountdown] = useState(3);

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
      setCountdown(3);
      reset();
    }
  }, [delegation, isOpen]);

  // Handle success state
  useEffect(() => {
    if (isConfirmed) {
      setShowSuccess(true);
      setCountdown(3);
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
    setCountdown(3);
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!delegation) return;

    const percentageNum = parseFloat(percentage);
    if (isNaN(percentageNum) || percentageNum <= 0 || percentageNum > 100) {
      alert('Please enter a valid percentage between 0.01 and 100');
      return;
    }

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
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted">Pattern</span>
                    <span className="font-bold">{delegation.patternName}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted">Current Allocation</span>
                    <span className="font-bold text-gradient-primary">
                      {Number(delegation.percentageAllocation) / 100}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
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
                      onChange={(e) => setPercentage(e.target.value)}
                      placeholder="Enter percentage (0.01 - 100)"
                      required
                      disabled={isWriting || isConfirming}
                    />
                    <span className="input-suffix">%</span>
                  </div>
                  <div className="preset-buttons">
                    <button
                      type="button"
                      className="btn-preset"
                      onClick={() => setPresetPercentage(10)}
                      disabled={isWriting || isConfirming}
                    >
                      10%
                    </button>
                    <button
                      type="button"
                      className="btn-preset"
                      onClick={() => setPresetPercentage(25)}
                      disabled={isWriting || isConfirming}
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      className="btn-preset"
                      onClick={() => setPresetPercentage(50)}
                      disabled={isWriting || isConfirming}
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      className="btn-preset"
                      onClick={() => setPresetPercentage(100)}
                      disabled={isWriting || isConfirming}
                    >
                      100%
                    </button>
                  </div>
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
                        Waiting for confirmation on Monad testnet...
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
      </div>
    </div>
  );
}

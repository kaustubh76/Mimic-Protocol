import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useMintPattern, type MintPatternParams } from '../hooks/useMintPattern';

const EXPLORER_URL = 'https://sepolia.etherscan.io';

const PATTERN_TYPES = [
  { value: 'Momentum', label: 'Momentum', desc: 'Trend-following strategy based on RSI/MACD signals' },
  { value: 'MeanReversion', label: 'Mean Reversion', desc: 'Bollinger Band reversal detection' },
  { value: 'Arbitrage', label: 'Arbitrage', desc: 'Cross-DEX price difference exploitation' },
  { value: 'Liquidity', label: 'Liquidity', desc: 'LP provision and rebalancing strategy' },
  { value: 'Yield', label: 'Yield', desc: 'Yield farming optimizer across protocols' },
  { value: 'Composite', label: 'Composite', desc: 'Multi-signal combined strategy' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePatternModal({ isOpen, onClose }: Props) {
  const { address } = useAccount();
  const { mintPattern, hash, isPending, isConfirming, isSuccess, error } = useMintPattern();

  const [patternType, setPatternType] = useState('Momentum');
  const [description, setDescription] = useState('RSI-based momentum strategy');
  const [totalTrades, setTotalTrades] = useState('15');
  const [successfulTrades, setSuccessfulTrades] = useState('12');
  const [totalVolume, setTotalVolume] = useState('0.5');
  const [totalPnL, setTotalPnL] = useState('0.1');
  const [confidence, setConfidence] = useState('80');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!address) {
      setValidationError('Please connect your wallet');
      return;
    }

    const trades = parseInt(totalTrades);
    const successful = parseInt(successfulTrades);
    const conf = parseInt(confidence);

    if (trades < 3) { setValidationError('Minimum 3 trades required'); return; }
    if (successful > trades) { setValidationError('Successful trades cannot exceed total trades'); return; }
    if ((successful / trades) * 100 < 50) { setValidationError('Minimum 50% win rate required'); return; }
    if (conf < 50) { setValidationError('Minimum 50% confidence required'); return; }
    if (parseFloat(totalVolume) < 0.0001) { setValidationError('Minimum 0.0001 ETH volume required'); return; }

    setValidationError(null);

    const params: MintPatternParams = {
      patternType,
      patternData: description,
      totalTrades: trades,
      successfulTrades: successful,
      totalVolume,
      totalPnL,
      confidence: conf,
    };

    mintPattern(params, address);
  };

  const winRate = parseInt(totalTrades) > 0
    ? ((parseInt(successfulTrades) / parseInt(totalTrades)) * 100).toFixed(1)
    : '0';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="glass-card p-6 sm:p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gradient-primary">Mint Trading Pattern</h2>
            <button onClick={onClose} className="text-muted hover:text-white text-xl">&times;</button>
          </div>

          {isSuccess && hash ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">🎉</div>
              <h3 className="text-lg font-bold text-green-400">Pattern Minted!</h3>
              <p className="text-sm text-muted">Your trading strategy is now an NFT on Ethereum Sepolia.</p>
              <a
                href={`${EXPLORER_URL}/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-gradient-secondary hover:underline"
              >
                View on Sepolia Etherscan ↗
              </a>
              <p className="text-xs text-muted mt-2">
                Other users can now delegate to your pattern and the bot will
                auto-execute trades matching your strategy.
              </p>
              <button
                onClick={onClose}
                className="btn btn--primary w-full mt-4"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pattern Type */}
              <div>
                <label className="text-xs font-semibold text-muted mb-1.5 block">Strategy Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {PATTERN_TYPES.map(pt => (
                    <button
                      key={pt.value}
                      onClick={() => {
                        setPatternType(pt.value);
                        setDescription(pt.desc);
                      }}
                      className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                        patternType === pt.value
                          ? 'border-purple-500/50 bg-purple-500/10 text-white'
                          : 'border-white/10 bg-white/[0.02] text-muted hover:border-white/20'
                      }`}
                    >
                      <div className="font-semibold">{pt.label}</div>
                      <div className="text-[10px] opacity-70 mt-0.5">{pt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Trade Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Total Trades</label>
                  <input
                    type="number"
                    min="3"
                    value={totalTrades}
                    onChange={(e) => setTotalTrades(e.target.value)}
                    className="w-full glass-card px-3 py-2 text-sm rounded-lg border border-white/10 bg-transparent focus:border-purple-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Successful Trades</label>
                  <input
                    type="number"
                    min="0"
                    value={successfulTrades}
                    onChange={(e) => setSuccessfulTrades(e.target.value)}
                    className="w-full glass-card px-3 py-2 text-sm rounded-lg border border-white/10 bg-transparent focus:border-purple-500/50 outline-none"
                  />
                </div>
              </div>

              {/* Calculated Win Rate */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-xs">
                <span className="text-muted">Calculated Win Rate:</span>
                <span className={`font-bold ${parseFloat(winRate) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                  {winRate}%
                </span>
                {parseFloat(winRate) < 50 && <span className="text-red-400/60">(min 50%)</span>}
              </div>

              {/* Volume & PnL */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Volume (ETH)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.0001"
                    value={totalVolume}
                    onChange={(e) => setTotalVolume(e.target.value)}
                    className="w-full glass-card px-3 py-2 text-sm rounded-lg border border-white/10 bg-transparent focus:border-purple-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Profit (ETH)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={totalPnL}
                    onChange={(e) => setTotalPnL(e.target.value)}
                    className="w-full glass-card px-3 py-2 text-sm rounded-lg border border-white/10 bg-transparent focus:border-purple-500/50 outline-none"
                  />
                </div>
              </div>

              {/* Confidence */}
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">
                  Confidence Score: {confidence}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={confidence}
                  onChange={(e) => setConfidence(e.target.value)}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-[10px] text-muted mt-0.5">
                  <span>50% min</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Validation Error */}
              {validationError && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                  {validationError}
                </div>
              )}

              {/* Contract Error */}
              {error && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                  <strong>Transaction Failed:</strong> {error.message?.slice(0, 200)}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={isPending || isConfirming || !address}
                className="btn btn--primary w-full"
              >
                {isPending ? 'Confirming in wallet...' :
                 isConfirming ? 'Mining on Sepolia...' :
                 !address ? 'Connect Wallet First' :
                 'Mint Pattern NFT'}
              </button>

              <p className="text-[10px] text-muted text-center">
                Pattern will be minted as an ERC-721 on Ethereum Sepolia.
                Other users can delegate to it for automated execution.
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

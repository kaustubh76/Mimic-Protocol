import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS, ABIS } from '../contracts/config';
import { parseEther, encodeFunctionData } from 'viem';
import { useSendTransaction } from 'wagmi';

export interface MintPatternParams {
  patternType: string;
  patternData: string;
  totalTrades: number;
  successfulTrades: number;
  totalVolume: string;   // in ETH (e.g. "1.5")
  totalPnL: string;      // in ETH (e.g. "0.3")
  confidence: number;    // 0-100 percentage
}

/**
 * Hook for minting a new pattern NFT via PatternDetector.validateAndMintPattern.
 *
 * Uses useSendTransaction with manually encoded callData to avoid wagmi's
 * strict type inference issues with the complex DetectedPattern struct.
 *
 * Demo thresholds (lowered for Sepolia):
 *   minTrades: 3, minWinRate: 50%, minVolume: 0.0001 ETH,
 *   minConfidence: 50%, cooldown: 60s between mints
 */
export function useMintPattern() {
  const { sendTransaction, data: hash, isPending, error } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const mintPattern = (params: MintPatternParams, userAddress: `0x${string}`) => {
    const volumeWei = parseEther(params.totalVolume);
    const pnlWei = parseEther(params.totalPnL);
    const confidenceBps = BigInt(Math.floor(params.confidence * 100));
    const detectedAt = BigInt(Math.floor(Date.now() / 1000)) - 120n; // 2 min ago

    // Encode the patternData string as bytes
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(params.patternData);
    const hexData = '0x' + Array.from(dataBytes).map(b => b.toString(16).padStart(2, '0')).join('') as `0x${string}`;

    const patternStruct = [
      userAddress,
      params.patternType,
      hexData,
      BigInt(params.totalTrades),
      BigInt(params.successfulTrades),
      volumeWei,
      pnlWei,
      confidenceBps,
      detectedAt,
    ] as const;

    const callData = encodeFunctionData({
      abi: ABIS.PATTERN_DETECTOR,
      functionName: 'validateAndMintPattern',
      args: [patternStruct],
    });

    sendTransaction({
      to: CONTRACTS.PATTERN_DETECTOR,
      data: callData,
    });
  };

  return { mintPattern, hash, isPending, isConfirming, isSuccess, error };
}

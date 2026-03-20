import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { CONTRACTS, ABIS } from '../contracts/config';

export interface CreateDelegationParams {
  patternTokenId: bigint;
  percentageAllocation: bigint; // In basis points (e.g., 7500 = 75%)
  smartAccountAddress: `0x${string}`;
}

export function useCreateDelegation() {
  const { address } = useAccount();
  const [error, setError] = useState<Error | null>(null);

  const {
    data: hash,
    writeContract,
    isPending: isWriting,
    error: writeError
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError
  } = useWaitForTransactionReceipt({
    hash,
  });

  const createDelegation = async (params: CreateDelegationParams) => {
    try {
      setError(null);

      if (!address) {
        throw new Error('Wallet not connected');
      }

      // Validate inputs
      if (params.percentageAllocation <= 0n || params.percentageAllocation > 10000n) {
        throw new Error('Allocation must be between 0.01% and 100%');
      }

      console.log('Creating delegation with params:', {
        patternTokenId: params.patternTokenId.toString(),
        percentageAllocation: params.percentageAllocation.toString(),
        smartAccountAddress: params.smartAccountAddress,
      });

      // Call createSimpleDelegation on DelegationRouter
      writeContract({
        address: CONTRACTS.DELEGATION_ROUTER,
        abi: ABIS.DELEGATION_ROUTER,
        functionName: 'createSimpleDelegation',
        args: [
          params.patternTokenId,
          params.percentageAllocation,
          params.smartAccountAddress,
        ],
      } as any);

    } catch (err) {
      const error = err as Error;
      console.error('Error creating delegation:', error);
      setError(error);
    }
  };

  return {
    createDelegation,
    hash,
    isWriting,
    isConfirming,
    isConfirmed,
    error: error || writeError || confirmError,
    isPending: isWriting || isConfirming,
  };
}

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS, ABIS } from '../contracts/config';

export interface UpdateDelegationParams {
  delegationId: bigint;
  newPercentageAllocation: number; // in basis points (e.g., 2500 = 25%)
}

export function useUpdateDelegation() {
  const {
    data: hash,
    writeContract,
    isPending: isWriting,
    error: writeError,
    reset
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError
  } = useWaitForTransactionReceipt({
    hash,
  });

  const updateDelegation = async (params: UpdateDelegationParams) => {
    try {
      writeContract({
        address: CONTRACTS.DELEGATION_ROUTER,
        abi: ABIS.DELEGATION_ROUTER,
        functionName: 'updateDelegationPercentage',
        args: [
          params.delegationId,
          BigInt(params.newPercentageAllocation),
        ],
      } as any);
    } catch (err) {
      console.error('Failed to update delegation:', err);
      throw err;
    }
  };

  return {
    updateDelegation,
    hash,
    isWriting,
    isConfirming,
    isConfirmed,
    error: writeError || confirmError,
    reset
  };
}

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS, ABIS } from '../contracts/config';

export function useRevokeDelegation() {
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

  const revokeDelegation = async (delegationId: bigint) => {
    try {
      writeContract({
        address: CONTRACTS.DELEGATION_ROUTER,
        abi: ABIS.DELEGATION_ROUTER,
        functionName: 'revokeDelegation',
        args: [delegationId],
      } as any);
    } catch (err) {
      console.error('Failed to revoke delegation:', err);
      throw err;
    }
  };

  return {
    revokeDelegation,
    hash,
    isWriting,
    isConfirming,
    isConfirmed,
    error: writeError || confirmError,
    reset
  };
}

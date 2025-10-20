/**
 * @file useSmartAccount Hook
 * @description Following official MetaMask docs
 * @see https://docs.metamask.io/delegation-toolkit/get-started/smart-account-quickstart/
 */

import { useEffect, useState } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { toMetaMaskSmartAccount, Implementation } from '@metamask/delegation-toolkit'
import type { MetaMaskSmartAccount } from '@metamask/delegation-toolkit'

export function useSmartAccount() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [smartAccount, setSmartAccount] = useState<MetaMaskSmartAccount | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function createSmartAccount() {
      if (!address || !publicClient || !walletClient) {
        setSmartAccount(null)
        return
      }

      setIsLoading(true)
      setError(null)

      console.log('🏗️ Creating smart account for:', address)

      try {
        const account = await toMetaMaskSmartAccount({
          client: publicClient,
          implementation: Implementation.Hybrid,
          deployParams: [address, [], [], []],
          deploySalt: '0x',
          signer: { walletClient }
        })

        setSmartAccount(account)
        console.log('✅ Smart Account Created:', account.address)
      } catch (err) {
        const error = err as Error
        setError(error)
        console.error('❌ Smart Account Creation Failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    createSmartAccount()
  }, [address, publicClient, walletClient])

  return { smartAccount, isLoading, error }
}

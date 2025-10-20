/**
 * @file Wagmi Configuration
 * @description Following official MetaMask docs with Monad Testnet support
 * @see https://docs.metamask.io/delegation-toolkit/get-started/smart-account-quickstart/
 */

import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { defineChain } from 'viem'

// Define Monad Testnet as a custom chain
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://monad-testnet.g.alchemy.com/v2/pFkOAygOyJ72KbT_I-LM0'],
    },
    public: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://explorer.testnet.monad.xyz',
    },
  },
  testnet: true,
})

export const config = createConfig({
  chains: [monadTestnet, sepolia],
  connectors: [injected()],
  transports: {
    [monadTestnet.id]: http(),
    [sepolia.id]: http(),
  },
})

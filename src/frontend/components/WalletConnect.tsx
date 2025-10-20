/**
 * @file WalletConnect Component
 * @description Following official MetaMask docs
 * @see https://docs.metamask.io/delegation-toolkit/get-started/smart-account-quickstart/
 */

import { useAccount, useConnect, useDisconnect } from 'wagmi'

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <div className="wallet-connect">
        <div className="wallet-connect__info">
          <div className="wallet-connect__status">
            <span className="wallet-connect__dot">●</span>
            <span>Connected</span>
          </div>
          <div className="wallet-connect__address">
            <span className="wallet-connect__label">Address:</span>
            <code>{address.slice(0, 6)}...{address.slice(-4)}</code>
          </div>
        </div>
        <button
          onClick={() => disconnect()}
          className="wallet-connect__button wallet-connect__button--disconnect"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="wallet-connect">
      <h3>Connect Wallet</h3>
      <div className="wallet-connect__connectors">
        {connectors.map((connector) => (
          <button
            key={connector.id}
            onClick={() => connect({ connector })}
            disabled={isPending}
            className="wallet-connect__button wallet-connect__button--primary"
          >
            {isPending ? 'Connecting...' : `Connect with ${connector.name}`}
          </button>
        ))}
      </div>
    </div>
  )
}

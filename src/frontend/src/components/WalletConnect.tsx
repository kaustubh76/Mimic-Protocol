import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { MONAD_CHAIN_ID } from '../contracts/config';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const formatAddress = (addr: string) => {
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  };

  const handleConnect = () => {
    const connector = connectors[0];
    if (connector) {
      connect({ connector });
    }
  };

  const handleNetworkSwitch = () => {
    if (switchChain) {
      switchChain({ chainId: MONAD_CHAIN_ID });
    }
  };

  if (isConnected && address) {
    return (
      <div className="wallet-connect">
        {chainId !== MONAD_CHAIN_ID && (
          <button onClick={handleNetworkSwitch} className="btn btn--warning btn--sm">
            Switch to Monad
          </button>
        )}
        <div className="wallet-address">
          {formatAddress(address)}
        </div>
        <button onClick={() => disconnect()} className="btn btn--secondary btn--sm">
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button onClick={handleConnect} className="btn btn--primary">
      Connect Wallet
    </button>
  );
}

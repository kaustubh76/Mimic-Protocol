/**
 * @file Basic Integration Example
 * @description Complete example of integrating Mirror Protocol delegation flow
 * @author Mirror Protocol Team
 *
 * This example shows how to build a complete delegation interface using
 * Mirror Protocol's React hooks and components.
 */

import React from 'react';
import { WalletConnect, CreateDelegation, DelegationList } from '../components';
import { useMetaMask, useDelegation } from '../hooks';

/**
 * Basic Integration Example
 *
 * This component demonstrates:
 * 1. Wallet connection with MetaMask
 * 2. Smart Account creation
 * 3. Creating delegations
 * 4. Viewing and managing delegations
 */
export function BasicIntegration() {
  const { isConnected, smartAccountAddress } = useMetaMask();
  const { getTotalDelegations, getTotalPatterns } = useDelegation();

  const [totalDelegations, setTotalDelegations] = React.useState<bigint | null>(null);
  const [totalPatterns, setTotalPatterns] = React.useState<bigint | null>(null);

  // Load stats when connected
  React.useEffect(() => {
    if (isConnected) {
      loadStats();
    }
  }, [isConnected]);

  const loadStats = async () => {
    try {
      const [delegations, patterns] = await Promise.all([
        getTotalDelegations(),
        getTotalPatterns(),
      ]);
      setTotalDelegations(delegations);
      setTotalPatterns(patterns);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  return (
    <div className="basic-integration">
      {/* Header */}
      <header className="basic-integration__header">
        <h1>Mirror Protocol - Delegation Interface</h1>
        <p>Delegate to behavioral trading patterns with MetaMask Smart Accounts</p>
      </header>

      {/* Wallet Connection */}
      <section className="basic-integration__section">
        <WalletConnect
          onConnected={(address) => {
            console.log('Wallet connected:', address);
            loadStats();
          }}
        />
      </section>

      {/* Stats Display */}
      {isConnected && (
        <section className="basic-integration__section">
          <div className="basic-integration__stats">
            <div className="basic-integration__stat">
              <span className="basic-integration__stat-label">Total Patterns</span>
              <span className="basic-integration__stat-value">
                {totalPatterns !== null ? totalPatterns.toString() : '...'}
              </span>
            </div>
            <div className="basic-integration__stat">
              <span className="basic-integration__stat-label">Total Delegations</span>
              <span className="basic-integration__stat-value">
                {totalDelegations !== null ? totalDelegations.toString() : '...'}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Create Delegation Form */}
      {isConnected && smartAccountAddress && (
        <section className="basic-integration__section">
          <CreateDelegation
            onSuccess={(delegationId) => {
              console.log('Delegation created:', delegationId);
              loadStats();
            }}
          />
        </section>
      )}

      {/* Delegation List */}
      {isConnected && (
        <section className="basic-integration__section">
          <DelegationList
            onDelegationClick={(id) => {
              console.log('Delegation clicked:', id);
            }}
          />
        </section>
      )}
    </div>
  );
}

/**
 * Example CSS (for reference)
 */
export const exampleStyles = `
.basic-integration {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.basic-integration__header {
  text-align: center;
  margin-bottom: 3rem;
}

.basic-integration__header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.basic-integration__section {
  margin-bottom: 2rem;
}

.basic-integration__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.basic-integration__stat {
  background: #f5f5f5;
  padding: 1.5rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.basic-integration__stat-label {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.basic-integration__stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
}
`;

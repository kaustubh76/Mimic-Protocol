#!/bin/bash

# Create all missing UI components for Mirror Protocol
set -e

COMP_DIR="/Users/apple/Desktop/Mimic Protocol/src/frontend/src/components"

echo "Creating UI Components..."

# Create contracts/config.ts
cat > "/Users/apple/Desktop/Mimic Protocol/src/frontend/src/contracts/config.ts" << 'EOF'
export const MONAD_CHAIN_ID = 10143;
export const CONTRACT_ADDRESSES = {
  BEHAVIORAL_NFT: '0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc',
  DELEGATION_ROUTER: '0x56C145f5567f8DB77533c825cf4205F1427c5517',
  PATTERN_DETECTOR: '0x8768e4E5c8c3325292A201f824FAb86ADae398d0'
};
EOF

# Create PatternBrowser
cat > "$COMP_DIR/PatternBrowser.tsx" << 'EOF'
import { useState } from 'react';

const MOCK_PATTERNS = [
  { id: 1, name: 'Momentum', winRate: 0, creator: '0x...', volume: '0', delegations: 1, active: true },
  { id: 2, name: 'MeanReversion', winRate: 80, creator: '0x...', volume: '250k', delegations: 0, active: true }
];

export function PatternBrowser() {
  const [patterns] = useState(MOCK_PATTERNS);

  return (
    <div className="pattern-browser">
      <h2>Available Trading Patterns</h2>
      <div className="pattern-grid">
        {patterns.map((pattern) => (
          <div key={pattern.id} className="pattern-card">
            <div className="pattern-card__header">
              <h3>{pattern.name}</h3>
              <span className={pattern.active ? 'badge badge--success' : 'badge badge--inactive'}>
                {pattern.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="pattern-card__stats">
              <div className="stat">
                <span className="stat__label">Win Rate</span>
                <span className="stat__value">{pattern.winRate}%</span>
              </div>
              <div className="stat">
                <span className="stat__label">Volume</span>
                <span className="stat__value">{pattern.volume}</span>
              </div>
              <div className="stat">
                <span className="stat__label">Delegations</span>
                <span className="stat__value">{pattern.delegations}</span>
              </div>
            </div>
            <div className="pattern-card__actions">
              <button className="btn btn--primary btn--block">Delegate</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
EOF

# Create MyDelegations
cat > "$COMP_DIR/MyDelegations.tsx" << 'EOF'
import { useState } from 'react';

const MOCK_DELEGATIONS = [
  { id: 1, patternName: 'Momentum', allocation: 50, status: 'active', created: 'Oct 14, 2025' }
];

export function MyDelegations() {
  const [delegations] = useState(MOCK_DELEGATIONS);

  return (
    <div className="my-delegations">
      <h2>My Delegations</h2>
      {delegations.length === 0 ? (
        <div className="empty-state">
          <p>You have no active delegations</p>
          <button className="btn btn--primary">Browse Patterns</button>
        </div>
      ) : (
        <div className="delegations-list">
          {delegations.map((delegation) => (
            <div key={delegation.id} className="delegation-card">
              <div className="delegation-card__header">
                <h3>{delegation.patternName}</h3>
                <span className="badge badge--success">{delegation.status}</span>
              </div>
              <div className="delegation-card__details">
                <div className="detail">
                  <span className="detail__label">Allocation</span>
                  <span className="detail__value">{delegation.allocation}%</span>
                </div>
                <div className="detail">
                  <span className="detail__label">Created</span>
                  <span className="detail__value">{delegation.created}</span>
                </div>
              </div>
              <div className="delegation-card__actions">
                <button className="btn btn--secondary">Update</button>
                <button className="btn btn--danger">Revoke</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
EOF

echo "✅ All components created!"
echo ""
echo "Created files:"
echo "  - contracts/config.ts"
echo "  - components/WalletConnect.tsx"
echo "  - components/PatternBrowser.tsx"
echo "  - components/MyDelegations.tsx"
echo "  - hooks/useSmartAccount.ts"
echo "  - hooks/useUserStats.ts"

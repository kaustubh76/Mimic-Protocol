/**
 * @file Custom Hooks Usage Examples
 * @description Detailed examples of using Mirror Protocol hooks
 * @author Mirror Protocol Team
 *
 * This file demonstrates various ways to use the hooks independently
 * for custom implementations.
 */

import React from 'react';
import { useMetaMask, useDelegation } from '../hooks';

/**
 * Example 1: Basic Wallet Connection
 */
export function WalletConnectionExample() {
  const { isConnected, eoaAddress, connect, disconnect, error } = useMetaMask();

  return (
    <div>
      <h2>Wallet Connection</h2>
      {!isConnected ? (
        <button onClick={connect}>Connect</button>
      ) : (
        <div>
          <p>Connected: {eoaAddress}</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      )}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}

/**
 * Example 2: Smart Account Creation
 */
export function SmartAccountExample() {
  const { isConnected, smartAccountConfig, createSmartAccount } = useMetaMask();

  const handleCreateAccount = async () => {
    try {
      await createSmartAccount();
      alert('Smart Account created!');
    } catch (error) {
      console.error('Failed to create Smart Account:', error);
    }
  };

  if (!isConnected) {
    return <p>Please connect wallet first</p>;
  }

  return (
    <div>
      <h2>Smart Account</h2>
      {!smartAccountConfig ? (
        <button onClick={handleCreateAccount}>Create Smart Account</button>
      ) : (
        <div>
          <p>Address: {smartAccountConfig.address}</p>
          <p>Deployed: {smartAccountConfig.isDeployed ? 'Yes' : 'No (Counterfactual)'}</p>
          <p>Owner: {smartAccountConfig.owner}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Example 3: Simple Delegation Creation
 */
export function SimpleDelegationExample() {
  const { createSimpleDelegation, txState, parsePercentage } = useDelegation();
  const [patternId, setPatternId] = React.useState('1');
  const [percentage, setPercentage] = React.useState('50');

  const handleCreate = async () => {
    try {
      const delegationId = await createSimpleDelegation({
        patternTokenId: BigInt(patternId),
        percentageAllocation: parsePercentage(parseFloat(percentage)),
      });
      alert(`Delegation created! ID: ${delegationId}`);
    } catch (error) {
      console.error('Failed to create delegation:', error);
    }
  };

  return (
    <div>
      <h2>Create Simple Delegation</h2>
      <input
        type="number"
        value={patternId}
        onChange={(e) => setPatternId(e.target.value)}
        placeholder="Pattern Token ID"
      />
      <input
        type="number"
        value={percentage}
        onChange={(e) => setPercentage(e.target.value)}
        placeholder="Percentage (1-100)"
      />
      <button onClick={handleCreate} disabled={txState.isLoading}>
        {txState.isLoading ? 'Creating...' : 'Create'}
      </button>
      {txState.error && <p>Error: {txState.error.message}</p>}
    </div>
  );
}

/**
 * Example 4: Advanced Delegation with Custom Permissions
 */
export function AdvancedDelegationExample() {
  const { createDelegation, createDefaultPermissions, createDefaultConditions, parsePercentage } =
    useDelegation();

  const handleCreateAdvanced = async () => {
    try {
      // Create custom permissions
      const permissions = createDefaultPermissions();
      permissions.maxSpendPerTx = BigInt('1000000000000000000'); // 1 ETH
      permissions.maxSpendPerDay = BigInt('5000000000000000000'); // 5 ETH
      permissions.expiresAt = BigInt(Math.floor(Date.now() / 1000) + 86400 * 30); // 30 days
      permissions.requiresConditionalCheck = true;

      // Create custom conditions
      const conditions = createDefaultConditions();
      conditions.minWinRate = 6000n; // 60% win rate
      conditions.minROI = 1000n; // 10% ROI
      conditions.minVolume = BigInt('10000000000000000000'); // 10 ETH
      conditions.isActive = true;

      const delegationId = await createDelegation({
        patternTokenId: 1n,
        percentageAllocation: parsePercentage(50), // 50%
        permissions,
        conditions,
      });

      console.log('Advanced delegation created:', delegationId);
    } catch (error) {
      console.error('Failed to create advanced delegation:', error);
    }
  };

  return (
    <div>
      <h2>Create Advanced Delegation</h2>
      <button onClick={handleCreateAdvanced}>Create Advanced Delegation</button>
      <pre>
        {`
Custom Permissions:
- Max Spend Per Tx: 1 ETH
- Max Spend Per Day: 5 ETH
- Expires: 30 days
- Conditional Checks: Enabled

Conditions:
- Min Win Rate: 60%
- Min ROI: 10%
- Min Volume: 10 ETH
        `}
      </pre>
    </div>
  );
}

/**
 * Example 5: Querying Delegations
 */
export function DelegationQueryExample() {
  const { getMyDelegations, getDelegation } = useDelegation();
  const [delegationIds, setDelegationIds] = React.useState<bigint[]>([]);
  const [selectedDelegation, setSelectedDelegation] = React.useState<any>(null);

  const loadDelegations = async () => {
    try {
      const ids = await getMyDelegations();
      setDelegationIds(ids);
    } catch (error) {
      console.error('Failed to load delegations:', error);
    }
  };

  const loadDelegationDetails = async (id: bigint) => {
    try {
      const delegation = await getDelegation(id);
      setSelectedDelegation(delegation);
    } catch (error) {
      console.error('Failed to load delegation details:', error);
    }
  };

  return (
    <div>
      <h2>My Delegations</h2>
      <button onClick={loadDelegations}>Load Delegations</button>

      <ul>
        {delegationIds.map((id) => (
          <li key={id.toString()}>
            <button onClick={() => loadDelegationDetails(id)}>
              Delegation #{id.toString()}
            </button>
          </li>
        ))}
      </ul>

      {selectedDelegation && (
        <div>
          <h3>Details</h3>
          <pre>{JSON.stringify(selectedDelegation, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

/**
 * Example 6: Pattern Metadata Query
 */
export function PatternMetadataExample() {
  const { getPatternMetadata } = useDelegation();
  const [patternId, setPatternId] = React.useState('1');
  const [metadata, setMetadata] = React.useState<any>(null);

  const loadMetadata = async () => {
    try {
      const data = await getPatternMetadata(BigInt(patternId));
      setMetadata(data);
    } catch (error) {
      console.error('Failed to load pattern metadata:', error);
    }
  };

  return (
    <div>
      <h2>Pattern Metadata</h2>
      <input
        type="number"
        value={patternId}
        onChange={(e) => setPatternId(e.target.value)}
        placeholder="Pattern Token ID"
      />
      <button onClick={loadMetadata}>Load Metadata</button>

      {metadata && (
        <div>
          <h3>Pattern #{patternId}</h3>
          <p>Type: {metadata.patternType}</p>
          <p>Creator: {metadata.creator}</p>
          <p>Win Rate: {Number(metadata.winRate) / 100}%</p>
          <p>ROI: {Number(metadata.roi) / 100}%</p>
          <p>Total Volume: {metadata.totalVolume.toString()}</p>
          <p>Active: {metadata.isActive ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Example 7: Delegation Management (Revoke & Update)
 */
export function DelegationManagementExample() {
  const { revokeDelegation, updatePercentage, parsePercentage, txState } = useDelegation();
  const [delegationId, setDelegationId] = React.useState('1');
  const [newPercentage, setNewPercentage] = React.useState('75');

  const handleRevoke = async () => {
    if (!confirm('Are you sure you want to revoke this delegation?')) return;

    try {
      await revokeDelegation(BigInt(delegationId));
      alert('Delegation revoked!');
    } catch (error) {
      console.error('Failed to revoke:', error);
    }
  };

  const handleUpdatePercentage = async () => {
    try {
      await updatePercentage(
        BigInt(delegationId),
        parsePercentage(parseFloat(newPercentage))
      );
      alert('Percentage updated!');
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  return (
    <div>
      <h2>Manage Delegation</h2>
      <input
        type="number"
        value={delegationId}
        onChange={(e) => setDelegationId(e.target.value)}
        placeholder="Delegation ID"
      />

      <div>
        <h3>Update Percentage</h3>
        <input
          type="number"
          value={newPercentage}
          onChange={(e) => setNewPercentage(e.target.value)}
          placeholder="New Percentage (1-100)"
        />
        <button onClick={handleUpdatePercentage} disabled={txState.isLoading}>
          Update
        </button>
      </div>

      <div>
        <h3>Revoke Delegation</h3>
        <button onClick={handleRevoke} disabled={txState.isLoading}>
          Revoke
        </button>
      </div>

      {txState.isLoading && <p>Transaction in progress...</p>}
      {txState.error && <p>Error: {txState.error.message}</p>}
    </div>
  );
}

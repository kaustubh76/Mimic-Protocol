/**
 * @file EventHandlers.ts
 * @description Main event handlers entry point for Envio
 * @author Mirror Protocol Team
 *
 * This file exports all event handlers for Mirror Protocol contracts.
 * Envio will auto-generate types and call these functions when events are detected.
 *
 * CONTRACTS INDEXED:
 * - BehavioralNFT: Pattern NFT lifecycle (mint, update, deactivate, transfer)
 * - DelegationRouter: Delegation lifecycle (create, update, revoke, execute)
 *
 * PERFORMANCE:
 * - All handlers target <10ms execution time
 * - Optimized database writes
 * - Efficient metric aggregation
 */
// ==========================================
// BehavioralNFT Event Handlers
// ==========================================
export { handlePatternMinted, handlePatternPerformanceUpdated, handlePatternDeactivated, handleTransfer, } from './behavioralNFT.js';
// ==========================================
// DelegationRouter Event Handlers
// ==========================================
export { handleDelegationCreated, handleDelegationRevoked, handleDelegationUpdated, handleTradeExecuted, } from './delegationRouter.js';
// Note: Envio will generate the following types automatically:
//
// BehavioralNFT Events:
// - BehavioralNFT_PatternMinted
// - BehavioralNFT_PatternPerformanceUpdated
// - BehavioralNFT_PatternDeactivated
// - BehavioralNFT_Transfer
//
// DelegationRouter Events:
// - DelegationRouter_DelegationCreated
// - DelegationRouter_DelegationRevoked
// - DelegationRouter_DelegationUpdated
// - DelegationRouter_TradeExecuted
//
// Context:
// - Entity loaders (get)
// - Entity setters (set)
// - Auto-generated entity types
// These handlers will be called by Envio when corresponding events are emitted

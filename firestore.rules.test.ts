/**
 * Security Rules Specification Suite for BROSPAT (/loyaltyCards/{userId})
 * Verifies all "Dirty Dozen" adversarial payloads are rejected with PERMISSION_DENIED.
 */

export interface DirtyPayloadCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  authUid: string | null;
  emailVerified: boolean;
  targetPath: string;
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_CASES: DirtyPayloadCase[] = [
  {
    id: 1,
    name: 'Identity Spoofing on Create',
    operation: 'create',
    authUid: 'user_alpha',
    emailVerified: true,
    targetPath: '/loyaltyCards/user_beta',
    payload: {
      ownerId: 'user_beta',
      displayName: 'Attacker',
      stamps: 0,
      totalBroasters: 0,
      availableRewards: 0,
      redeemedRewards: 0,
      activeRewardCode: 'NONE',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Email Write',
    operation: 'create',
    authUid: 'user_alpha',
    emailVerified: false,
    targetPath: '/loyaltyCards/user_alpha',
    payload: {
      ownerId: 'user_alpha',
      displayName: 'Unverified',
      stamps: 0,
      totalBroasters: 0,
      availableRewards: 0,
      redeemedRewards: 0,
      activeRewardCode: 'NONE',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow Field Injection on Create',
    operation: 'create',
    authUid: 'user_alpha',
    emailVerified: true,
    targetPath: '/loyaltyCards/user_alpha',
    payload: {
      ownerId: 'user_alpha',
      displayName: 'Luis',
      stamps: 0,
      totalBroasters: 0,
      availableRewards: 0,
      redeemedRewards: 0,
      activeRewardCode: 'NONE',
      isAdmin: true,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Reward Minting Shortcut (Violates 10-Broaster Math Invariant)',
    operation: 'create',
    authUid: 'user_alpha',
    emailVerified: true,
    targetPath: '/loyaltyCards/user_alpha',
    payload: {
      ownerId: 'user_alpha',
      displayName: 'Luis',
      stamps: 1,
      totalBroasters: 1,
      availableRewards: 5,
      redeemedRewards: 0,
      activeRewardCode: 'BRS-FAKE',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Bulk Stamp Overflow (>25 Broasters in single order)',
    operation: 'update',
    authUid: 'user_alpha',
    emailVerified: true,
    targetPath: '/loyaltyCards/user_alpha',
    payload: {
      stamps: 0,
      totalBroasters: 100,
      availableRewards: 10,
      activeRewardCode: 'BRS-9999',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Redeem Reward When availableRewards == 0',
    operation: 'update',
    authUid: 'user_alpha',
    emailVerified: true,
    targetPath: '/loyaltyCards/user_alpha',
    payload: {
      availableRewards: -1,
      redeemedRewards: 1,
      activeRewardCode: 'NONE',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Value Poisoning (>80 char displayName)',
    operation: 'update',
    authUid: 'user_alpha',
    emailVerified: true,
    targetPath: '/loyaltyCards/user_alpha',
    payload: {
      displayName: 'X'.repeat(500),
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Shadow Field Injection on Update',
    operation: 'update',
    authUid: 'user_alpha',
    emailVerified: true,
    targetPath: '/loyaltyCards/user_alpha',
    payload: {
      stamps: 2,
      totalBroasters: 2,
      vip: true,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Immutable ownerId Tampering on Update',
    operation: 'update',
    authUid: 'user_alpha',
    emailVerified: true,
    targetPath: '/loyaltyCards/user_alpha',
    payload: {
      ownerId: 'user_beta',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Forged Client Timestamp on Update',
    operation: 'update',
    authUid: 'user_alpha',
    emailVerified: true,
    targetPath: '/loyaltyCards/user_alpha',
    payload: {
      updatedAt: '2099-01-01T00:00:00Z',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Cross-User Read and Collection Scraping',
    operation: 'get',
    authUid: 'user_alpha',
    emailVerified: true,
    targetPath: '/loyaltyCards/user_beta',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Path Variable ID Poisoning',
    operation: 'get',
    authUid: 'bad$id!spaces',
    emailVerified: true,
    targetPath: '/loyaltyCards/bad$id!spaces',
    expectedOutcome: 'PERMISSION_DENIED',
  },
];

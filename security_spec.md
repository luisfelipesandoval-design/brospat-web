# Security Specification — BROSPAT Loyalty Card (`loyaltyCards`)

## 1. Data Invariants
1. **Strict Ownership**: Every document `/loyaltyCards/{userId}` belongs exclusively to `request.auth.uid == userId` and `data.ownerId == request.auth.uid`. No user can read, list, create, or update another user's loyalty card.
2. **Verified Identity**: All writes (`create`, `update`) require `request.auth != null` and `request.auth.token.email_verified == true`.
3. **10-Broaster Mathematical Invariant**: `0 <= stamps <= 9` and `stamps + (availableRewards + redeemedRewards) * 10 == totalBroasters`. A surprise reward can never be minted without accumulating 10 Broasters.
4. **Bounded Order Increment**: A single order action (`isAddStampsAction`) can increase `totalBroasters` by at least `1` and at most `25` (the maximum Broaster order cap), and cannot alter `redeemedRewards`.
5. **Single-Step In-Store Redemption**: A redemption action (`isRedeemRewardAction`) requires `existing().availableRewards >= 1`, decrements `availableRewards` by `1`, increments `redeemedRewards` by `1`, and keeps `totalBroasters` and `stamps` unchanged.
6. **PII Isolation**: No email, phone number, or address is stored in `/loyaltyCards/{userId}`.
7. **Temporal & Immutable Integrity**: `ownerId` and `createdAt` are immutable after creation; `createdAt` and `updatedAt` must equal server `request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Identity Spoofing on Create**: User `uid_A` creates `/loyaltyCards/uid_B` or sets `ownerId: "uid_B"`. -> `PERMISSION_DENIED`
2. **Unverified Email Write**: Authenticated user with `email_verified: false` creates `/loyaltyCards/uid_A`. -> `PERMISSION_DENIED`
3. **Shadow Field Injection on Create**: Payload includes extra field `"isAdmin": true`. -> `PERMISSION_DENIED`
4. **Reward Minting Shortcut**: User creates `/loyaltyCards/uid_A` with `totalBroasters: 1, stamps: 1, availableRewards: 5, redeemedRewards: 0`. -> `PERMISSION_DENIED`
5. **Bulk Stamp Overflow**: User updates `totalBroasters` from `2` to `100` in a single request (`delta > 25`). -> `PERMISSION_DENIED`
6. **Negative / Free Redemption**: User triggers `isRedeemRewardAction` when `availableRewards == 0`. -> `PERMISSION_DENIED`
7. **Update-Gap Type Poisoning**: User updates whitelisted `displayName` to an integer `12345` or 50KB string (`> 80` chars). -> `PERMISSION_DENIED`
8. **Shadow Field Injection on Update**: User updates `stamps` and injects `"vip": true`. -> `PERMISSION_DENIED`
9. **Immutable Field Tampering**: User modifies `createdAt` or `ownerId` during `update`. -> `PERMISSION_DENIED`
10. **Client Timestamp Forgery**: User sends a past or future `updatedAt` instead of `request.time`. -> `PERMISSION_DENIED`
11. **Cross-User Read (`get` / `list`)**: User `uid_A` attempts `get` on `/loyaltyCards/uid_B` or `list` on `/loyaltyCards`. -> `PERMISSION_DENIED`
12. **Path ID Poisoning**: Request targets `/loyaltyCards/invalid$id!with*spaces` or >128 char ID. -> `PERMISSION_DENIED`

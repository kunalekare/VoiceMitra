import { describe, it, expect } from 'vitest';

describe('Escrow State Machine & Ledger Invariants', () => {
  const validTransitions: Record<string, string[]> = {
    pending_payment: ['funded', 'cancelled'],
    funded: ['accepted', 'cancelled', 'disputed'],
    accepted: ['in_progress', 'cancelled', 'disputed'],
    in_progress: ['completed', 'disputed'],
    completed: ['escrow_released', 'disputed'],
    disputed: ['in_progress', 'completed', 'cancelled', 'refunded'],
    cancelled: []
  };

  function canTransition(current: string, next: string): boolean {
    const allowed = validTransitions[current] || [];
    return allowed.includes(next);
  }

  it('allows valid legal transitions through the escrow lifecycle', () => {
    expect(canTransition('pending_payment', 'funded')).toBe(true);
    expect(canTransition('funded', 'accepted')).toBe(true);
    expect(canTransition('accepted', 'in_progress')).toBe(true);
    expect(canTransition('in_progress', 'completed')).toBe(true);
    expect(canTransition('completed', 'escrow_released')).toBe(true);
  });

  it('rejects illegal jumps in status', () => {
    expect(canTransition('pending_payment', 'completed')).toBe(false);
    expect(canTransition('pending_payment', 'escrow_released')).toBe(false);
    expect(canTransition('cancelled', 'funded')).toBe(false);
    expect(canTransition('completed', 'pending_payment')).toBe(false);
  });

  it('enforces double-entry ledger balance invariants in paise', () => {
    // A 3-day job at ₹850/day (255,000 paise) + platform fee ₹150 (15,000 paise) = 270,000 paise total
    const wagePaise = 255000;
    const feePaise = 15000;
    const totalPaise = wagePaise + feePaise;

    interface LedgerEntry {
      type: 'deposit' | 'release_to_worker' | 'platform_fee' | 'refund_to_employer';
      amountPaise: number;
    }

    const ledger: LedgerEntry[] = [];

    // Step 1: Employer deposits funds into escrow
    ledger.push({ type: 'deposit', amountPaise: totalPaise });

    // Invariant check 1: Total held in escrow equals deposit
    const held = ledger.reduce((acc, entry) => {
      if (entry.type === 'deposit') return acc + entry.amountPaise;
      return acc - entry.amountPaise;
    }, 0);
    expect(held).toBe(270000);

    // Step 2: On completion, release wage to worker and fee to platform
    ledger.push({ type: 'release_to_worker', amountPaise: wagePaise });
    ledger.push({ type: 'platform_fee', amountPaise: feePaise });

    // Invariant check 2: Escrow balance must reach exactly 0 after full release
    const finalBalance = ledger.reduce((acc, entry) => {
      if (entry.type === 'deposit') return acc + entry.amountPaise;
      return acc - entry.amountPaise;
    }, 0);
    expect(finalBalance).toBe(0);

    // Invariant check 3: Sum of disbursements equals initial deposit
    const totalDisbursed = ledger
      .filter((e) => e.type !== 'deposit')
      .reduce((acc, e) => acc + e.amountPaise, 0);
    expect(totalDisbursed).toBe(totalPaise);
  });
});

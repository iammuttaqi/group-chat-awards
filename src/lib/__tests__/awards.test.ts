import { describe, expect, it } from 'vitest';
import { calculateAwards } from '../awards';
import { parseChatText } from '../parser';
import { calculateGroupStats, displayName, formatInitials } from '../stats';

const sampleChat = `[10/24/23, 1:15:00 AM] Alice: Hey anyone awake? 😂
[10/24/23, 1:16:00 AM] Alice: <Media omitted>
[10/24/23, 1:17:00 AM] Alice: haha ok gn
[10/24/23, 6:30:00 AM] Bob: Morning!
[10/24/23, 6:31:00 AM] Bob: Up early for the morning marathon run!
[10/24/23, 2:00:00 PM] Charlie: This is an exceptionally long and detailed message explaining our complete itinerary for the upcoming gala weekend in full detail with every reservation.
[10/24/23, 2:00:10 PM] Charlie: Make sure you all pack appropriately!
[10/24/23, 2:00:15 PM] Alice: Awesome!
[10/25/23, 10:00:00 AM] Bob: Where is everyone?
[10/25/23, 10:01:00 AM] Dave: Still here.`;

describe('Awards & Stats Calculation', () => {
  it('calculates all 10 awards correctly', () => {
    const parsed = parseChatText(sampleChat, 'Weekend Gala');
    const awards = calculateAwards(parsed);

    expect(awards.length).toBe(10);
    const awardIds = awards.map((a) => a.id);
    expect(awardIds).toContain('chatterbox');
    expect(awardIds).toContain('night-owl');
    expect(awardIds).toContain('early-bird');
    expect(awardIds).toContain('novelist');
    expect(awardIds).toContain('ghost');
    expect(awardIds).toContain('fastest-reply');
    expect(awardIds).toContain('conversation-starter');
    expect(awardIds).toContain('emoji-royalty');
    expect(awardIds).toContain('media-mogul');
    expect(awardIds).toContain('laugh-track');

    // Verify winners
    const nightOwl = awards.find((a) => a.id === 'night-owl');
    expect(nightOwl?.winner).toBe('Alice');

    const earlyBird = awards.find((a) => a.id === 'early-bird');
    expect(earlyBird?.winner).toBe('Bob');

    const novelist = awards.find((a) => a.id === 'novelist');
    expect(novelist?.winner).toBe('Charlie');

    const ghost = awards.find((a) => a.id === 'ghost');
    expect(ghost?.winner).toBe('Dave');
  });

  it('calculates group stats accurately', () => {
    const parsed = parseChatText(sampleChat, 'Weekend Gala');
    const stats = calculateGroupStats(parsed);

    expect(stats.totalMessages).toBe(10);
    expect(stats.totalSenders).toBe(4);
    expect(stats.busiestDay.count).toBe(8);
    expect(stats.heatmap.length).toBe(7);
    expect(stats.heatmap[0].length).toBe(24);
  });

  it('formats initials consistently', () => {
    expect(formatInitials('John Doe')).toBe('JD');
    expect(formatInitials('Alice')).toBe('AL');
    expect(formatInitials('Mary Jane Watson')).toBe('MW');
    expect(displayName('John Doe', true)).toBe('JD');
    expect(displayName('John Doe', false)).toBe('John Doe');
  });
});

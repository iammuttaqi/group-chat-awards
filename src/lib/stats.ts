import type { GroupStats, ParsedChat } from './types';

const COMMON_STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with',
  'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
  'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out',
  'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just',
  'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use',
  'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
  'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were', 'been', 'has', 'had', 'am', 'did', 'does',
  'im', 'i\'m', 'it\'s', 'dont', 'don\'t', 'cant', 'can\'t', 'youre', 'you\'re', 'thats', 'that\'s',
  'omitted', 'media', 'image', 'video', 'audio', 'sticker', 'gif', 'message', 'deleted', 'ok', 'yeah',
  'yes', 'oh', 'hey', 'hi', 'hello', 'lol', 'haha', 'hahaha', 'lmao',
]);

export function calculateGroupStats(chat: ParsedChat): GroupStats {
  const { messages, senders, startDate, endDate, totalMessages } = chat;

  // Sender counts
  const senderCountsMap = new Map<string, number>();
  for (const s of senders) senderCountsMap.set(s, 0);

  // Heatmap: 7 days x 24 hours
  const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  let maxHeatmapValue = 0;

  // Day counts for busiest day
  const dayCountsMap = new Map<string, number>();

  // Word counts
  const wordFreqMap = new Map<string, number>();

  for (const msg of messages) {
    // Sender counts
    senderCountsMap.set(msg.sender, (senderCountsMap.get(msg.sender) ?? 0) + 1);

    // Heatmap
    const day = msg.timestamp.getDay(); // 0 = Sun
    const hour = msg.timestamp.getHours(); // 0..23
    heatmap[day][hour]++;
    if (heatmap[day][hour] > maxHeatmapValue) {
      maxHeatmapValue = heatmap[day][hour];
    }

    // Busiest day (using local date rather than UTC to prevent timezone splits)
    const y = msg.timestamp.getFullYear();
    const m = String(msg.timestamp.getMonth() + 1).padStart(2, '0');
    const d = String(msg.timestamp.getDate()).padStart(2, '0');
    const dayKey = `${y}-${m}-${d}`;
    const currDayCount = (dayCountsMap.get(dayKey) ?? 0) + 1;
    dayCountsMap.set(dayKey, currDayCount);

    // Word extraction (skip media lines)
    if (!msg.isMedia) {
      const words = msg.text
        .toLowerCase()
        .replace(/https?:\/\/\S+/g, '')
        .replace(/[\p{P}\p{S}\p{N}]/gu, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 3 && !COMMON_STOP_WORDS.has(w));

      for (const w of words) {
        wordFreqMap.set(w, (wordFreqMap.get(w) ?? 0) + 1);
      }
    }
  }

  // Find busiest day
  let busiestDateStr = 'None';
  let busiestCount = 0;
  for (const [dateStr, count] of dayCountsMap.entries()) {
    if (count > busiestCount) {
      busiestCount = count;
      busiestDateStr = dateStr;
    }
  }

  // Format date range
  const fmtOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  const dateRangeStr =
    totalMessages > 0
      ? `${startDate.toLocaleDateString('en-US', fmtOptions)} – ${endDate.toLocaleDateString('en-US', fmtOptions)}`
      : 'No messages';

  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const daysActive = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Top words
  const topWords = Array.from(wordFreqMap.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Sender stats
  const senderCounts = Array.from(senderCountsMap.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalMessages > 0 ? Math.round((count / totalMessages) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalMessages,
    totalSenders: senders.length,
    dateRangeStr,
    daysActive,
    busiestDay: {
      dateStr: busiestDateStr,
      count: busiestCount,
    },
    heatmap,
    maxHeatmapValue,
    topWords,
    senderCounts,
  };
}

export function formatInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function displayName(name: string, useInitials: boolean): string {
  return useInitials ? formatInitials(name) : name;
}

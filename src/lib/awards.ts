import type { Award, ChatMessage, ParsedChat } from './types';

// Emoji detection regex covering Unicode emoji ranges
const EMOJI_REGEX = /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{E0020}-\u{E007F}]/gu;

// Laughter regex
const LAUGH_REGEX = /(?:haha+|hehe+|lmao+|lol+|rofl+|😂|🤣|💀)/i;

export function countEmojis(text: string): number {
  const matches = text.match(EMOJI_REGEX);
  return matches ? matches.length : 0;
}

export function calculateAwards(chat: ParsedChat): Award[] {
  const { messages, senders, totalMessages } = chat;
  if (senders.length === 0 || totalMessages === 0) return [];

  // Metrics trackers per sender
  const msgCount = new Map<string, number>();
  const nightOwlCount = new Map<string, number>();
  const earlyBirdCount = new Map<string, number>();
  const totalChars = new Map<string, number>();
  const longestSingleMsg = new Map<string, number>();
  const emojiCount = new Map<string, number>();
  const mediaCount = new Map<string, number>();
  const laughCount = new Map<string, number>();
  const starterCount = new Map<string, number>();
  const replyLatencies = new Map<string, number[]>();

  for (const s of senders) {
    msgCount.set(s, 0);
    nightOwlCount.set(s, 0);
    earlyBirdCount.set(s, 0);
    totalChars.set(s, 0);
    longestSingleMsg.set(s, 0);
    emojiCount.set(s, 0);
    mediaCount.set(s, 0);
    laughCount.set(s, 0);
    starterCount.set(s, 0);
    replyLatencies.set(s, []);
  }

  // Iterate messages
  let prevMsg: ChatMessage | null = null;
  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
  const ONE_HOUR_MS = 60 * 60 * 1000;

  for (const msg of messages) {
    const s = msg.sender;
    if (!msgCount.has(s)) continue;

    // Basic message count
    msgCount.set(s, (msgCount.get(s) ?? 0) + 1);

    // Time-based: Night Owl (00:00 - 04:59)
    const h = msg.timestamp.getHours();
    if (h >= 0 && h < 5) {
      nightOwlCount.set(s, (nightOwlCount.get(s) ?? 0) + 1);
    }
    // Early Bird (05:00 - 07:59)
    if (h >= 5 && h < 8) {
      earlyBirdCount.set(s, (earlyBirdCount.get(s) ?? 0) + 1);
    }

    // Characters for Novelist
    const chars = msg.text.length;
    totalChars.set(s, (totalChars.get(s) ?? 0) + chars);
    if (chars > (longestSingleMsg.get(s) ?? 0)) {
      longestSingleMsg.set(s, chars);
    }

    // Emojis
    const emojis = countEmojis(msg.text);
    if (emojis > 0) {
      emojiCount.set(s, (emojiCount.get(s) ?? 0) + emojis);
    }

    // Media
    if (msg.isMedia) {
      mediaCount.set(s, (mediaCount.get(s) ?? 0) + 1);
    }

    // Laugh track
    if (LAUGH_REGEX.test(msg.text)) {
      laughCount.set(s, (laughCount.get(s) ?? 0) + 1);
    }

    // Conversation starter & reply speed
    if (prevMsg) {
      const diffMs = msg.timestamp.getTime() - prevMsg.timestamp.getTime();
      if (diffMs >= SIX_HOURS_MS) {
        starterCount.set(s, (starterCount.get(s) ?? 0) + 1);
      } else if (diffMs > 0 && diffMs <= ONE_HOUR_MS && prevMsg.sender !== s) {
        replyLatencies.get(s)?.push(diffMs / 1000); // seconds
      }
    } else {
      // First message ever counts as starter
      starterCount.set(s, (starterCount.get(s) ?? 0) + 1);
    }

    prevMsg = msg;
  }

  // Median helper
  const getMedian = (nums: number[]): number => {
    if (nums.length === 0) return 999999;
    const sorted = [...nums].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  // Helper to pick top 2 winners from a score map
  const getTopTwo = (
    scoreMap: Map<string, number>,
    ascending = false,
  ): { winner: string; winnerScore: number; runnerUp?: { name: string; score: number } } => {
    const list = Array.from(scoreMap.entries()).sort((a, b) =>
      ascending ? a[1] - b[1] : b[1] - a[1],
    );
    const winner = list[0] ? list[0][0] : senders[0];
    const winnerScore = list[0] ? list[0][1] : 0;
    const runnerUp = list[1] && list[1][1] > 0 ? { name: list[1][0], score: list[1][1] } : undefined;
    return { winner, winnerScore, runnerUp };
  };

  const awards: Award[] = [];

  // 1. Chatterbox
  {
    const { winner, winnerScore, runnerUp } = getTopTwo(msgCount);
    const pct = Math.round((winnerScore / totalMessages) * 100);
    awards.push({
      id: 'chatterbox',
      title: 'The Chatterbox',
      subtitle: 'Most Messages Sent',
      description: 'The heartbeat of the chat. Never leaves the conversation hanging.',
      icon: '💬',
      winner,
      winningMetric: `${winnerScore.toLocaleString()} messages`,
      winningDetail: `${pct}% of all messages in this group`,
      runnerUp: runnerUp ? { name: runnerUp.name, metric: `${runnerUp.score.toLocaleString()} msgs` } : undefined,
    });
  }

  // 2. Night Owl
  {
    const { winner, winnerScore, runnerUp } = getTopTwo(nightOwlCount);
    awards.push({
      id: 'night-owl',
      title: 'The Night Owl',
      subtitle: 'Active 12 AM – 5 AM',
      description: 'Sleep is temporary, late-night group banter is forever.',
      icon: '🦉',
      winner,
      winningMetric: `${winnerScore.toLocaleString()} late-night messages`,
      winningDetail: 'Sent while the rest of the world was fast asleep',
      runnerUp: runnerUp ? { name: runnerUp.name, metric: `${runnerUp.score.toLocaleString()} msgs` } : undefined,
    });
  }

  // 3. Early Bird
  {
    const { winner, winnerScore, runnerUp } = getTopTwo(earlyBirdCount);
    awards.push({
      id: 'early-bird',
      title: 'The Early Bird',
      subtitle: 'Active 5 AM – 8 AM',
      description: 'Greeting the dawn and flooding notifications before morning coffee.',
      icon: '🌅',
      winner,
      winningMetric: `${winnerScore.toLocaleString()} morning messages`,
      winningDetail: 'First to wake up and ping the group',
      runnerUp: runnerUp ? { name: runnerUp.name, metric: `${runnerUp.score.toLocaleString()} msgs` } : undefined,
    });
  }

  // 4. Novelist
  {
    const avgCharsMap = new Map<string, number>();
    for (const s of senders) {
      const c = msgCount.get(s) ?? 0;
      avgCharsMap.set(s, c > 0 ? Math.round((totalChars.get(s) ?? 0) / c) : 0);
    }
    const { winner, winnerScore, runnerUp } = getTopTwo(avgCharsMap);
    const longest = longestSingleMsg.get(winner) ?? 0;
    awards.push({
      id: 'novelist',
      title: 'The Novelist',
      subtitle: 'Longest Messages',
      description: 'Why send one sentence when you can write a three-act monologue?',
      icon: '📜',
      winner,
      winningMetric: `${winnerScore} chars / msg`,
      winningDetail: `Longest single message: ${longest.toLocaleString()} characters`,
      runnerUp: runnerUp ? { name: runnerUp.name, metric: `${runnerUp.score} chars/msg` } : undefined,
    });
  }

  // 5. Ghost
  {
    const { winner, winnerScore, runnerUp } = getTopTwo(msgCount, true);
    const pct = Math.round((winnerScore / totalMessages) * 100);
    awards.push({
      id: 'ghost',
      title: 'The Ghost',
      subtitle: 'The Silent Observer',
      description: 'Lurking in the shadows. Seen by all, heard by none.',
      icon: '👻',
      winner,
      winningMetric: `${winnerScore.toLocaleString()} messages`,
      winningDetail: `Only ${pct}% of group traffic — master of the unread badge`,
      runnerUp: runnerUp ? { name: runnerUp.name, metric: `${runnerUp.score.toLocaleString()} msgs` } : undefined,
    });
  }

  // 6. Fastest Reply
  {
    const medianMap = new Map<string, number>();
    for (const s of senders) {
      const latencies = replyLatencies.get(s) ?? [];
      medianMap.set(s, latencies.length >= 2 ? getMedian(latencies) : 99999);
    }
    const { winner, winnerScore, runnerUp } = getTopTwo(medianMap, true);
    const sec = winnerScore < 99999 ? Math.round(winnerScore) : 0;
    const timeStr = sec < 60 ? `${sec}s median` : `${Math.round(sec / 60)}m median`;
    awards.push({
      id: 'fastest-reply',
      title: 'Fastest Reply',
      subtitle: 'Quickest On The Draw',
      description: 'Phones already in hand before the notification chime even finishes.',
      icon: '⚡',
      winner,
      winningMetric: timeStr,
      winningDetail: 'Speediest median reply time to fellow members',
      runnerUp: runnerUp && runnerUp.score < 99999
        ? {
            name: runnerUp.name,
            metric: runnerUp.score < 60 ? `${Math.round(runnerUp.score)}s` : `${Math.round(runnerUp.score / 60)}m`,
          }
        : undefined,
    });
  }

  // 7. Conversation Starter
  {
    const { winner, winnerScore, runnerUp } = getTopTwo(starterCount);
    awards.push({
      id: 'conversation-starter',
      title: 'The Resuscitator',
      subtitle: 'Broke Group Silences',
      description: 'Revives the chat after hours of radio silence. The group defibrillator.',
      icon: '🔥',
      winner,
      winningMetric: `${winnerScore.toLocaleString()} times`,
      winningDetail: 'Started chats after >6 hours of absolute quiet',
      runnerUp: runnerUp ? { name: runnerUp.name, metric: `${runnerUp.score.toLocaleString()} times` } : undefined,
    });
  }

  // 8. Emoji Royalty
  {
    const { winner, winnerScore, runnerUp } = getTopTwo(emojiCount);
    awards.push({
      id: 'emoji-royalty',
      title: 'Emoji Royalty',
      subtitle: 'Most Emojis Sent',
      description: 'Words are overrated. A picture is worth a thousand emojis.',
      icon: '👑',
      winner,
      winningMetric: `${winnerScore.toLocaleString()} emojis`,
      winningDetail: 'Expressing every human emotion through hieroglyphs',
      runnerUp: runnerUp ? { name: runnerUp.name, metric: `${runnerUp.score.toLocaleString()} emojis` } : undefined,
    });
  }

  // 9. Media Mogul
  {
    const { winner, winnerScore, runnerUp } = getTopTwo(mediaCount);
    awards.push({
      id: 'media-mogul',
      title: 'The Media Mogul',
      subtitle: 'Photos, Videos & Audio',
      description: 'Single-handedly maxing out everyone’s phone storage.',
      icon: '📸',
      winner,
      winningMetric: `${winnerScore.toLocaleString()} media items`,
      winningDetail: 'Voice notes, photos, videos and stickers galore',
      runnerUp: runnerUp ? { name: runnerUp.name, metric: `${runnerUp.score.toLocaleString()} items` } : undefined,
    });
  }

  // 10. Laugh Track
  {
    const { winner, winnerScore, runnerUp } = getTopTwo(laughCount);
    awards.push({
      id: 'laugh-track',
      title: 'The Laugh Track',
      subtitle: 'Chief Chuckler',
      description: 'Always laughing in all-caps. The most supportive audience member.',
      icon: '🎭',
      winner,
      winningMetric: `${winnerScore.toLocaleString()} laughs`,
      winningDetail: 'Said "haha", "lol", "lmao" or 😂 more than anyone else',
      runnerUp: runnerUp ? { name: runnerUp.name, metric: `${runnerUp.score.toLocaleString()} laughs` } : undefined,
    });
  }

  return awards;
}

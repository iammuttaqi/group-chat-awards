export interface ChatMessage {
  id: number;
  timestamp: Date;
  sender: string;
  text: string;
  isMedia: boolean;
  isVoiceNote: boolean;
  charCount: number;
}

export interface ParsedChat {
  title: string;
  messages: ChatMessage[];
  senders: string[];
  startDate: Date;
  endDate: Date;
  totalMessages: number;
}

export type AwardId =
  | 'chatterbox'
  | 'night-owl'
  | 'early-bird'
  | 'novelist'
  | 'ghost'
  | 'fastest-reply'
  | 'conversation-starter'
  | 'emoji-royalty'
  | 'media-mogul'
  | 'laugh-track';

export interface Award {
  id: AwardId;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  winner: string;
  winningMetric: string;
  winningDetail: string;
  runnerUp?: {
    name: string;
    metric: string;
  };
}

export interface GroupStats {
  totalMessages: number;
  totalSenders: number;
  dateRangeStr: string;
  daysActive: number;
  busiestDay: {
    dateStr: string;
    count: number;
  };
  heatmap: number[][]; // 7 days (Sun=0..Sat=6) x 24 hours
  maxHeatmapValue: number;
  topWords: Array<{ word: string; count: number }>;
  senderCounts: Array<{ name: string; count: number; percentage: number }>;
}

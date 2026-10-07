import { unzipSync } from 'fflate';
import type { ChatMessage, ParsedChat } from './types';

// Clean invisible directional and zero-width characters common in WhatsApp exports
export function cleanText(input: string): string {
  return input
    .replace(/[\u200E\u200F\u202A-\u202E\uFEFF]/g, '')
    .replace(/\u202F/g, ' ')
    .trim();
}

// Check if a line is a WhatsApp system event rather than a participant message
export function isSystemMessage(senderOrMsg: string, text?: string): boolean {
  const combined = `${senderOrMsg} ${text ?? ''}`.toLowerCase();
  const systemPatterns = [
    'messages and calls are end-to-end encrypted',
    'created group',
    'created this group',
    'changed the group name',
    'changed the group description',
    'changed the subject',
    'changed this group\'s icon',
    'changed the group icon',
    'added',
    'removed',
    'left',
    'you joined using this group\'s invite link',
    'joined using an invite link',
    'security code changed',
    'waiting for this message',
    'this message was deleted',
    'you deleted this message',
  ];
  return systemPatterns.some((pattern) => combined.includes(pattern));
}

// Flexible date parsing for WhatsApp export formats (iOS and Android, 12h/24h, multiple date separators)
export function parseWhatsAppDate(dateStr: string, timeStr: string): Date | null {
  const cleanDate = dateStr.replace(/[\/\.]/g, '-').trim();
  const dateParts = cleanDate.split('-').map(Number);
  if (dateParts.length !== 3 || dateParts.some(isNaN)) return null;

  let year = dateParts[2];
  let month = dateParts[0];
  let day = dateParts[1];

  // Resolve YYYY-MM-DD vs DD-MM-YYYY vs MM-DD-YYYY
  if (dateParts[0] > 1000) {
    // YYYY-MM-DD
    year = dateParts[0];
    month = dateParts[1];
    day = dateParts[2];
  } else {
    // Two digit year? e.g. 21 -> 2021
    if (year < 100) year += 2000;
    // If first number > 12, it must be DD-MM-YYYY
    if (dateParts[0] > 12) {
      day = dateParts[0];
      month = dateParts[1];
    }
  }

  // Parse time (HH:MM or HH:MM:SS with optional AM/PM)
  const cleanTime = timeStr.trim();
  const isPM = /pm/i.test(cleanTime);
  const isAM = /am/i.test(cleanTime);
  const timeNumStr = cleanTime.replace(/[^\d:]/g, '');
  const timeParts = timeNumStr.split(':').map(Number);
  if (timeParts.length < 2 || timeParts.some(isNaN)) return null;

  let hours = timeParts[0];
  const minutes = timeParts[1];
  const seconds = timeParts[2] ?? 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  const date = new Date(year, month - 1, day, hours, minutes, seconds);
  return isNaN(date.getTime()) ? null : date;
}

export interface RawParsedLine {
  date: Date;
  sender: string;
  text: string;
}

// Regex patterns for line matching
// iOS: [12/31/20, 11:59:59 PM] Alice: Hello
const IOS_REGEX = /^\[(\d{1,4}[-/. ]\d{1,2}[-/. ]\d{1,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\]\s+([^:]+):\s+(.*)$/;

// Android: 31/12/2020, 23:59 - Alice: Hello
const ANDROID_REGEX = /^(\d{1,4}[-/. ]\d{1,2}[-/. ]\d{1,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\s+-\s+([^:]+):\s+(.*)$/;

export function parseLine(line: string): RawParsedLine | null {
  const trimmed = line.replace(/[\u200E\u200F\u202A-\u202E]/g, '').replace(/\u202F/g, ' ').trim();
  if (!trimmed) return null;

  const iosMatch = trimmed.match(IOS_REGEX);
  if (iosMatch) {
    const [, dateStr, timeStr, sender, msg] = iosMatch;
    if (isSystemMessage(sender, msg)) return null;
    const date = parseWhatsAppDate(dateStr, timeStr);
    if (!date) return null;
    return { date, sender: sender.trim(), text: msg.trim() };
  }

  const androidMatch = trimmed.match(ANDROID_REGEX);
  if (androidMatch) {
    const [, dateStr, timeStr, sender, msg] = androidMatch;
    if (isSystemMessage(sender, msg)) return null;
    const date = parseWhatsAppDate(dateStr, timeStr);
    if (!date) return null;
    return { date, sender: sender.trim(), text: msg.trim() };
  }

  return null;
}

export function parseChatText(rawText: string, chatTitle = 'WhatsApp Chat'): ParsedChat {
  const lines = rawText.split(/\r?\n/);
  const messages: ChatMessage[] = [];
  const senderSet = new Set<string>();

  let currentMsg: ChatMessage | null = null;
  let idCounter = 1;

  for (const line of lines) {
    const parsed = parseLine(line);
    if (parsed) {
      if (currentMsg) {
        messages.push(currentMsg);
      }
      const lowerText = parsed.text.toLowerCase();
      const isVoice =
        lowerText.includes('audio omitted') ||
        lowerText.includes('voice note omitted') ||
        lowerText.includes('ptt-') ||
        lowerText.includes('.opus');
      const isMedia =
        isVoice ||
        lowerText.includes('<media omitted>') ||
        lowerText.includes('image omitted') ||
        lowerText.includes('video omitted') ||
        lowerText.includes('sticker omitted') ||
        lowerText.includes('gif omitted') ||
        lowerText.includes('document omitted');

      currentMsg = {
        id: idCounter++,
        timestamp: parsed.date,
        sender: parsed.sender,
        text: parsed.text,
        isMedia,
        isVoiceNote: isVoice,
        charCount: parsed.text.length,
      };
      senderSet.add(parsed.sender);
    } else if (currentMsg) {
      // Continuation of multi-line message
      const cleaned = cleanText(line);
      if (cleaned) {
        currentMsg.text += `\n${cleaned}`;
        currentMsg.charCount = currentMsg.text.length;
      }
    }
  }

  if (currentMsg) {
    messages.push(currentMsg);
  }

  messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const startDate = messages.length > 0 ? messages[0].timestamp : new Date();
  const endDate = messages.length > 0 ? messages[messages.length - 1].timestamp : new Date();

  return {
    title: chatTitle,
    messages,
    senders: Array.from(senderSet).sort(),
    startDate,
    endDate,
    totalMessages: messages.length,
  };
}

// Unpack .zip or read .txt file
export async function parseChatFile(file: File): Promise<ParsedChat> {
  const fileName = file.name;
  if (fileName.toLowerCase().endsWith('.zip')) {
    const arrayBuffer = await file.arrayBuffer();
    const unzipped = unzipSync(new Uint8Array(arrayBuffer));
    // Search for _chat.txt or any .txt
    let chatTxtContent = '';
    for (const [entryName, data] of Object.entries(unzipped)) {
      if (entryName.toLowerCase().endsWith('.txt') && !entryName.startsWith('__MACOSX')) {
        chatTxtContent = new TextDecoder('utf-8').decode(data);
        break;
      }
    }
    if (!chatTxtContent) {
      throw new Error('No .txt chat export found inside the zip archive.');
    }
    const cleanTitle = fileName.replace(/\.zip$/i, '').replace(/^WhatsApp Chat - /i, '');
    return parseChatText(chatTxtContent, cleanTitle);
  }

  const text = await file.text();
  const cleanTitle = fileName.replace(/\.txt$/i, '').replace(/^WhatsApp Chat - /i, '');
  return parseChatText(text, cleanTitle);
}

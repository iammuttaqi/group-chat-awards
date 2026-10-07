import { describe, expect, it } from 'vitest';
import { isSystemMessage, parseChatText, parseLine, parseWhatsAppDate } from '../parser';

describe('WhatsApp Parser', () => {
  it('parses iOS 12-hour format with AM/PM and brackets', () => {
    const line = '[10/24/23, 2:30:15 PM] Alice: Hey everyone!';
    const res = parseLine(line);
    expect(res).not.toBeNull();
    expect(res?.sender).toBe('Alice');
    expect(res?.text).toBe('Hey everyone!');
    expect(res?.date.getHours()).toBe(14);
    expect(res?.date.getMinutes()).toBe(30);
  });

  it('parses iOS 24-hour format with brackets', () => {
    const line = '[24/10/2023, 23:15:00] Bob: Late night taco run?';
    const res = parseLine(line);
    expect(res).not.toBeNull();
    expect(res?.sender).toBe('Bob');
    expect(res?.text).toBe('Late night taco run?');
    expect(res?.date.getHours()).toBe(23);
  });

  it('parses Android 24-hour dash format', () => {
    const line = '24/10/2023, 08:30 - Charlie: Good morning team!';
    const res = parseLine(line);
    expect(res).not.toBeNull();
    expect(res?.sender).toBe('Charlie');
    expect(res?.text).toBe('Good morning team!');
    expect(res?.date.getHours()).toBe(8);
  });

  it('parses Android 12-hour AM/PM dash format', () => {
    const line = '10/24/23, 11:45 pm - Dave: Are we meeting today?';
    const res = parseLine(line);
    expect(res).not.toBeNull();
    expect(res?.sender).toBe('Dave');
    expect(res?.text).toBe('Are we meeting today?');
    expect(res?.date.getHours()).toBe(23);
    expect(res?.date.getMinutes()).toBe(45);
  });

  it('ignores system messages', () => {
    expect(isSystemMessage('Messages and calls are end-to-end encrypted.')).toBe(true);
    expect(isSystemMessage('Alice added Bob')).toBe(true);
    expect(isSystemMessage('Charlie changed the group description')).toBe(true);
    expect(isSystemMessage('Alice', 'This message was deleted')).toBe(true);

    const line = '24/10/2023, 10:00 - Alice changed the group name to "Winners"';
    expect(parseLine(line)).toBeNull();
  });

  it('handles multi-line messages and accumulates text', () => {
    const raw = `[10/24/23, 2:30:00 PM] Alice: Line 1
Line 2 of Alice message
Line 3 of Alice message
[10/24/23, 2:31:00 PM] Bob: Sweet!`;

    const parsed = parseChatText(raw, 'Test Group');
    expect(parsed.totalMessages).toBe(2);
    expect(parsed.messages[0].text).toBe('Line 1\nLine 2 of Alice message\nLine 3 of Alice message');
    expect(parsed.messages[1].text).toBe('Sweet!');
    expect(parsed.senders).toEqual(['Alice', 'Bob']);
  });

  it('detects media and voice notes correctly', () => {
    const raw = `[10/24/23, 2:30:00 PM] Alice: <Media omitted>
[10/24/23, 2:31:00 PM] Bob: audio omitted
[10/24/23, 2:32:00 PM] Charlie: Just normal text`;

    const parsed = parseChatText(raw);
    expect(parsed.messages[0].isMedia).toBe(true);
    expect(parsed.messages[1].isVoiceNote).toBe(true);
    expect(parsed.messages[1].isMedia).toBe(true);
    expect(parsed.messages[2].isMedia).toBe(false);
  });

  it('parses dates with dot separator', () => {
    const date = parseWhatsAppDate('24.10.2023', '15:20');
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2023);
    expect(date?.getDate()).toBe(24);
  });

  it('strips leading UTF-8 byte order mark (BOM)', () => {
    const withBom = '\uFEFF[10/24/23, 2:30:00 PM] Alice: Hello with BOM!';
    const parsed = parseChatText(withBom);
    expect(parsed.totalMessages).toBe(1);
    expect(parsed.messages[0].sender).toBe('Alice');
    expect(parsed.messages[0].text).toBe('Hello with BOM!');
  });
});

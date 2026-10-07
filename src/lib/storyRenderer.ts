import type { Award } from './types';

export interface RenderOptions {
  award: Award;
  winnerDisplayName: string;
  chatTitle: string;
}

export async function renderStoryCardToBlob(options: RenderOptions): Promise<Blob> {
  const { award, winnerDisplayName, chatTitle } = options;

  // 1080 x 1920 canvas
  const width = 1080;
  const height = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Background: Deep Plum Velvet
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#0d0411');
  bgGrad.addColorStop(0.3, '#190a1f');
  bgGrad.addColorStop(0.7, '#240d2d');
  bgGrad.addColorStop(1, '#0d0411');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Spotlight effect
  const spotGrad = ctx.createRadialGradient(width / 2, 0, 10, width / 2, height / 2, width * 0.9);
  spotGrad.addColorStop(0, 'rgba(212, 175, 55, 0.28)');
  spotGrad.addColorStop(0.3, 'rgba(212, 175, 55, 0.12)');
  spotGrad.addColorStop(0.7, 'rgba(212, 175, 55, 0.02)');
  spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = spotGrad;
  ctx.fillRect(0, 0, width, height);

  // Outer Gala Border (Double Gold Line)
  const pad = 64;
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 4;
  ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(pad + 16, pad + 16, width - (pad + 16) * 2, height - (pad + 16) * 2);

  // Corner ornaments
  const cornerSize = 40;
  const corners = [
    [pad + 16, pad + 16],
    [width - pad - 16, pad + 16],
    [pad + 16, height - pad - 16],
    [width - pad - 16, height - pad - 16],
  ];
  ctx.fillStyle = '#d4af37';
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Header Title
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(212, 175, 55, 0.85)';
  ctx.font = '600 32px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '6px';
  ctx.fillText('★ GROUP CHAT AWARDS NIGHT ★', width / 2, 220);

  // Chat Name Subtitle
  ctx.fillStyle = '#c8b8af';
  ctx.font = '400 36px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '1px';
  const cleanChatTitle = chatTitle.length > 28 ? `${chatTitle.slice(0, 26)}...` : chatTitle;
  ctx.fillText(cleanChatTitle, width / 2, 280);

  // Decorative divider
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 160, 330);
  ctx.lineTo(width / 2 + 160, 330);
  ctx.stroke();

  // Award Icon Seal
  const sealY = 510;
  const sealRadius = 110;
  ctx.beginPath();
  ctx.arc(width / 2, sealY, sealRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#32153e';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#d4af37';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(width / 2, sealY, sealRadius - 10, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Icon inside seal
  ctx.font = '100px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(award.icon, width / 2, sealY);
  ctx.textBaseline = 'alphabetic';

  // Category Tag
  ctx.fillStyle = '#f3d07a';
  ctx.font = '700 34px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText(award.subtitle.toUpperCase(), width / 2, 700);

  // Award Name (Cinzel / Serif)
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 76px "Cinzel", Georgia, serif';
  ctx.letterSpacing = '2px';
  ctx.fillText(award.title.toUpperCase(), width / 2, 790);

  // "PRESENTED TO" label
  ctx.fillStyle = 'rgba(212, 175, 55, 0.75)';
  ctx.font = '600 28px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('PRESENTED TO', width / 2, 910);

  // Winner Box / Envelope Card
  const boxW = 860;
  const boxH = 460;
  const boxX = (width - boxW) / 2;
  const boxY = 960;

  // Box background
  const boxGrad = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxH);
  boxGrad.addColorStop(0, '#2d1137');
  boxGrad.addColorStop(1, '#1b0821');
  ctx.fillStyle = boxGrad;
  roundRect(ctx, boxX, boxY, boxW, boxH, 20);
  ctx.fill();

  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Winner Name in Gold Foil
  ctx.fillStyle = '#fae9b3';
  ctx.font = '800 82px "Cinzel", Georgia, serif';
  const nameToRender = winnerDisplayName.length > 18 ? `${winnerDisplayName.slice(0, 16)}...` : winnerDisplayName;
  ctx.fillText(nameToRender, width / 2, boxY + 120);

  // Winning Metric Pill
  const pillW = 560;
  const pillH = 70;
  const pillX = (width - pillW) / 2;
  const pillY = boxY + 175;
  ctx.fillStyle = '#421a4f';
  roundRect(ctx, pillX, pillY, pillW, pillH, 35);
  ctx.fill();
  ctx.strokeStyle = '#f3d07a';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 36px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(award.winningMetric, width / 2, pillY + 48);

  // Winning detail
  ctx.fillStyle = '#c8b8af';
  ctx.font = '400 32px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(award.winningDetail, width / 2, boxY + 310);

  // Award description
  ctx.fillStyle = 'rgba(250, 245, 234, 0.85)';
  ctx.font = 'italic 34px "Plus Jakarta Sans", sans-serif';
  const descLines = wrapText(ctx, `"${award.description}"`, 760);
  let curY = boxY + 380;
  for (const line of descLines.slice(0, 2)) {
    ctx.fillText(line, width / 2, curY);
    curY += 44;
  }

  // Runner up if present
  if (award.runnerUp) {
    ctx.fillStyle = 'rgba(212, 175, 55, 0.8)';
    ctx.font = '500 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Runner Up: ${award.runnerUp.name} (${award.runnerUp.metric})`, width / 2, 1530);
  }

  // Footer Watermark
  ctx.fillStyle = 'rgba(200, 184, 175, 0.6)';
  ctx.font = '400 26px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('100% Private in Browser • Group Chat Awards', width / 2, 1780);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/png');
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = ctx.measureText(testLine).width;
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function shareOrDownload(options: RenderOptions): Promise<{ shared: boolean; message: string }> {
  try {
    const blob = await renderStoryCardToBlob(options);
    const filename = `${options.award.id}-award.png`;
    const file = new File([blob], filename, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `${options.award.title} Winner!`,
        text: `${options.winnerDisplayName} won ${options.award.title} in our WhatsApp group chat! 🏆`,
      });
      return { shared: true, message: 'Shared story card successfully!' };
    }

    // Fallback: download PNG
    downloadBlob(blob, filename);
    return { shared: false, message: 'Downloaded 1080×1920 story card PNG!' };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { shared: false, message: 'Share canceled.' };
    }
    // Fallback download if render succeeded
    return { shared: false, message: 'Could not share. Downloaded instead.' };
  }
}

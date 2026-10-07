import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe('Group Chat Awards Acceptance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Fail tests on console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/');
    expect(consoleErrors).toHaveLength(0);
  });

  test('@acceptance displays privacy notice and sample chat on entrance', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Group Chat');
    await expect(page.getByText('100% Private in Your Browser')).toBeVisible();
    await expect(page.getByRole('button', { name: /Try Sample Chat/i })).toBeVisible();
  });

  test('@acceptance loads sample chat and verifies all 10 awards in story ceremony', async ({ page }) => {
    // Click sample chat button
    await page.getByRole('button', { name: /Try Sample Chat/i }).click();

    // Verify story mode is loaded
    await expect(page.getByRole('tablist', { name: /Awards Story Progress/i })).toBeVisible();

    // Verify progress tabs count (10 awards)
    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(10);

    // Verify initial unrevealed envelope
    await expect(page.getByText(/Tear Open Envelope/i)).toBeVisible();

    // Reveal envelope
    await page.getByRole('button', { name: /Tear envelope to reveal winner/i }).click();

    // Verify winner appears
    await expect(page.getByText(/★ Winner ★/i)).toBeVisible();

    // Step through awards
    await page.getByRole('button', { name: /Next Award/i }).click();
    await expect(page.getByText(/Award 2 of 10/i)).toBeVisible();
  });

  test('@acceptance toggles between full names and initials for privacy', async ({ page }) => {
    await page.getByRole('button', { name: /Try Sample Chat/i }).click();

    // Reveal the first award winner
    await page.getByRole('button', { name: /Tear envelope to reveal winner/i }).click();

    const initialWinnerEl = page.locator('p:has-text("★ Winner ★") + p, div:has-text("★ Winner ★") p.text-gold-200');
    const fullName = await initialWinnerEl.innerText();
    expect(fullName.length).toBeGreaterThan(0);

    // Toggle Initials
    const initialsBtn = page.getByRole('button', { name: /Show Initials|Initials On/i });
    await initialsBtn.click();

    const initialsName = await initialWinnerEl.innerText();
    expect(initialsName).not.toEqual(fullName);
    expect(initialsName.length).toBeLessThanOrEqual(3);

    // Toggle back
    await initialsBtn.click();
    expect(await initialWinnerEl.innerText()).toEqual(fullName);
  });

  test('@acceptance navigates to stats dashboard and shows heatmap and top words', async ({ page }) => {
    await page.getByRole('button', { name: /Try Sample Chat/i }).click();

    // Click Stats view
    await page.getByRole('button', { name: 'Stats', exact: true }).click();

    // Verify metrics
    await expect(page.getByText('Total Messages')).toBeVisible();
    await expect(page.getByText('Participants')).toBeVisible();
    await expect(page.getByText('Busiest Day')).toBeVisible();

    // Verify Award Winners Roster
    await expect(page.getByText('Award Winners Roster')).toBeVisible();
    await expect(page.getByText('10 Awards Conferred')).toBeVisible();

    // Verify Heatmap
    await expect(page.getByText(/Hour-by-Weekday Activity Heatmap/i)).toBeVisible();

    // Verify Top Words
    await expect(page.getByText('Top Words', { exact: true })).toBeVisible();

    // Verify Leaderboard
    await expect(page.getByText('Chat Volume Leaderboard')).toBeVisible();

    // Return to story
    await page.getByRole('button', { name: /Watch Story Ceremony/i }).click();
    await expect(page.getByRole('tablist')).toBeVisible();
  });

  test('@acceptance supports keyboard navigation through awards story', async ({ page }) => {
    await page.getByRole('button', { name: /Try Sample Chat/i }).click();
    await expect(page.getByText(/Award 1 of 10/i)).toBeVisible();

    // Press right arrow to advance
    await page.keyboard.press('ArrowRight');
    await expect(page.getByText(/Award 2 of 10/i)).toBeVisible();

    // Press left arrow to return
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByText(/Award 1 of 10/i)).toBeVisible();

    // Press Enter to reveal
    await page.keyboard.press('Enter');
    await expect(page.getByText(/★ Winner ★/i)).toBeVisible();
  });

  test('@acceptance passes accessibility audits on entrance and ceremony', async ({ page }) => {
    // 1. Entrance screen audit
    const entranceAxe = await new AxeBuilder({ page })
      .disableRules(['color-contrast']) // brand decorative colors audited separately
      .analyze();
    expect(entranceAxe.violations).toEqual([]);

    // 2. Story Ceremony audit
    await page.getByRole('button', { name: /Try Sample Chat/i }).click();
    const ceremonyAxe = await new AxeBuilder({ page })
      .disableRules(['color-contrast'])
      .analyze();
    expect(ceremonyAxe.violations).toEqual([]);
  });
});

test('capture README screenshot at 1280x800', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await page.getByRole('button', { name: /Try Sample Chat/i }).click();
  await page.getByRole('button', { name: /Tear envelope to reveal winner/i }).click();
  await page.waitForTimeout(500);

  const docsDir = path.resolve('docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  await page.screenshot({ path: path.join(docsDir, 'screenshot.png') });
});

import { expect, test } from '@playwright/test';
import { adv, key, screen, typeKey } from './helpers';

const SHOTS = process.env.SHOT_DIR;

test('BTX: Leihset vom Club, Decoder startet beim Einschalten, Seiten per Ziffer', async ({ page }, info) => {
  await page.goto('/?dev=1');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await page.getByTestId('new-game').click();
  await page.getByTestId('dev-toggle').click();
  const panel = page.getByTestId('dev-panel');
  await panel.getByRole('tab', { name: 'Meilensteine' }).click();
  await page.getByTestId('milestone-end').click();
  await expect(page.getByTestId('toast')).toContainText('Meilenstein');
  const input = page.getByTestId('dev-input');
  for (const cmd of ['fakt club_evening', 'zeit 1986-11-20T18:40']) {
    await input.fill(cmd);
    await input.press('Enter');
  }
  await page.getByRole('button', { name: 'Entwicklerkonsole schließen' }).click();

  await adv(page, 'gehe zum club');
  await expect(page.getByTestId('club-scene')).toBeVisible();
  await expect(page.getByTestId('desk-caption')).toContainText('Computerclub');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/club-${info.project.name}.png` });
  await adv(page, 'verabschiede dich');
  await expect(page.getByTestId('club-scene')).toHaveCount(0);
  await adv(page, 'schalte computer aus');
  await adv(page, 'stecke btx in den c64');
  await adv(page, 'schalte computer ein');
  await expect(screen(page)).toContainText('BTX-DECODER');
  await key(page, 'RETURN');
  await expect(screen(page)).toContainText('WIEDENBRUECKER KURIER');
  await expect(page.getByTestId('line-state')).toContainText('online (BTX)');
  await typeKey(page, '2');
  await expect(screen(page)).toContainText('WETTER');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/btx-${info.project.name}.png` });
});

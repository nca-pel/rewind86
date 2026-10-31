import { expect, test } from '@playwright/test';
import { c64, log, screen } from './helpers';

const SHOTS = process.env.SHOT_DIR;

test('Unsichtbare REM-Zeile im LADER erscheint erst mit anderer Hintergrundfarbe', async ({ page }, info) => {
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
  await page.getByTestId('milestone-c64').click();
  await expect(page.getByTestId('toast')).toContainText('Meilenstein');
  await page.getByRole('button', { name: 'Entwicklerkonsole schließen' }).click();

  await c64(page, 'LOAD"LADER",8');
  await c64(page, 'LIST');
  await expect(screen(page)).toContainText('910 DATA');
  await expect(screen(page)).not.toContainText('TEIL 1/3');
  await expect(log(page)).toContainText('leere Bemerkung');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/key-${info.project.name}-hidden.png` });

  await c64(page, 'POKE 53281,0');
  await expect(screen(page)).toContainText('TEIL 1/3');
  await expect(log(page)).toContainText('Schlüsselteil 1/3');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/key-${info.project.name}-revealed.png` });
});

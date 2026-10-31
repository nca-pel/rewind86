import { expect, test } from '@playwright/test';
import { adv, c64, key, screen, typeKey } from './helpers';

const SHOTS = process.env.SHOT_DIR;

test('Reguläre Mailbox über TERMINAL: Gast, Anmeldung, Bretter', async ({ page }, info) => {
  await page.goto('/?dev=1');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByTestId('new-game').click();
  for (const cmd of [
    'nimm hörer',
    'lege auf',
    'warte',
    'öffne schublade',
    'nimm archivdiskette',
    'lege archivdiskette ins laufwerk',
    'schalte computer ein',
  ])
    await adv(page, cmd);

  await page.getByTestId('dev-toggle').click();
  await page.getByTestId('dev-input').fill('zeit 18:05');
  await page.getByTestId('dev-input').press('Enter');
  await page.getByRole('button', { name: 'Entwicklerkonsole schließen' }).click();

  await c64(page, 'LOAD"TERMINAL",8');
  await c64(page, 'RUN');
  await expect(screen(page)).toContainText('TERMINAL V1.2');
  await adv(page, 'wähle 23586');
  await adv(page, 'lege hörer in den koppler');
  await key(page, 'RETURN');
  await expect(screen(page)).toContainText('DEIN NAME (ODER GAST):');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/bbs-${info.project.name}-login.png` });

  await c64(page, 'jan');
  await typeKey(page, 'j');
  await expect(screen(page)).toContainText('STATUS: NEU');
  await typeKey(page, '1');
  await typeKey(page, '1');
  await expect(screen(page)).toContainText('REGELN - BITTE LESEN');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/bbs-${info.project.name}-board.png` });
  await expect(page.getByTestId('line-state')).toContainText('online (BIT-SCHUPPEN GT)');
});

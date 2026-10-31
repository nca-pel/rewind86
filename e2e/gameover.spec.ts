import { expect, test } from '@playwright/test';
import { adv, log } from './helpers';

const SHOTS = process.env.SHOT_DIR;

test('Spielende: Fenster, gesperrte Eingabe, letzten Schritt zurücknehmen', async ({ page }, info) => {
  await page.goto('/?dev=1');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByTestId('new-game').click();
  await adv(page, 'nimm hörer');
  await expect(log(page)).toContainText('Ralf');

  // Verdacht per Entwicklerkonsole auf das Maximum – im Spiel nur nach der letzten Warnung erreichbar
  await page.getByTestId('dev-toggle').click();
  const input = page.getByTestId('dev-input');
  await input.fill('bez seidelSuspicion 100');
  await input.press('Enter');
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText('Ende: Entdeckt');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/gameover-${info.project.name}.png` });

  await page.getByRole('button', { name: 'Entwicklerkonsole schließen' }).click();
  await adv(page, 'schau');
  await expect(log(page)).toContainText('Spiel ist zu Ende');

  await page.getByTestId('undo-game-over').click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId('toast')).toContainText('zurückgenommen');
  // Der Autosave stammt von vor dem Ende: Die abgelehnte Eingabe ist nicht mehr im Protokoll
  await expect(log(page)).not.toContainText('Spiel ist zu Ende');
  await adv(page, 'frage ralf nach dem spiel');
  await expect(log(page)).not.toContainText('Spiel ist zu Ende');
});

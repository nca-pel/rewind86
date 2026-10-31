import { expect, test } from '@playwright/test';
import { log } from './helpers';

const SHOTS = process.env.SHOT_DIR;

test('Entwicklerkonsole nur mit ?dev=1; Befehle, Meilensteine, Graph', async ({ page }, info) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await page.getByTestId('new-game').click();
  await expect(page.getByTestId('dev-toggle')).toHaveCount(0);

  await page.goto('/?dev=1');
  await page.getByTestId('continue').click();
  await page.getByTestId('dev-toggle').click();
  const panel = page.getByTestId('dev-panel');
  await expect(panel).toBeVisible();

  const input = page.getByTestId('dev-input');
  await input.fill('fakt chr_table');
  await input.press('Enter');
  await expect(log(page)).toContainText('Notiert');
  await input.fill('zeit +30');
  await input.press('Enter');
  await expect(panel).toContainText('Zeit jetzt');

  await panel.getByRole('tab', { name: 'Meilensteine' }).click();
  await page.getByTestId('milestone-secret').click();
  await expect(page.getByTestId('toast')).toContainText('Meilenstein');
  await expect(page.getByTestId('c64-screen')).toContainText('SCHLUESSELDISKETTE');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/dev-${info.project.name}-milestone.png` });

  await panel.getByRole('tab', { name: 'Graph' }).click();
  await expect(panel).toContainText('Keine toten Enden');
  await panel.getByRole('tab', { name: 'Ereignisse' }).click();
  await expect(panel).toContainText('ev_doorbell');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/dev-${info.project.name}-events.png` });

  // Bleibt in der Sitzung aktiv, ?dev=0 schaltet ab
  await page.goto('/?dev=0');
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('dev-toggle')).toHaveCount(0);
});

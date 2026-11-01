import { expect, test } from '@playwright/test';
import { adv, key, log } from './helpers';

test('Autosave übersteht Neuladen, manueller Slot lädt den Zustand wieder', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByTestId('new-game').click();
  await adv(page, 'nimm hörer');
  await adv(page, 'lege auf');
  await adv(page, 'warte');
  await adv(page, 'notiere Testnotiz 42');
  const clock = await page.getByTestId('clock').textContent();

  // Neuladen → Fortsetzen
  await page.reload();
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('clock')).toHaveText(clock!);
  await expect(page.locator('.inventory')).toContainText('Ralfs Spielediskette');
  await expect(log(page)).toContainText('Testnotiz 42');

  // Manuell speichern
  await page.getByRole('button', { name: 'Menü' }).click();
  await page.getByTestId('save-1').click();
  await page.keyboard.press('Escape');

  // Laden per Parser
  await page.keyboard.press('Escape');
  await adv(page, 'warte 30');
  await adv(page, 'laden 1');
  await expect(page.getByTestId('clock')).toHaveText(clock!);
});

test('Mobil/Desktop: eine Eingabezeile mit Umschalter Adventure/C64, kein horizontales Scrollen', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByTestId('new-game').click();
  await adv(page, 'schalte computer ein');
  // Einschalten legt die gemeinsame Eingabezeile auf den C64
  await expect(page.locator('.adventure-panel')).toHaveAttribute('data-target', 'c64');
  await expect(page.getByTestId('input-toggle')).toHaveText('C64>');
  // Eingabe im Adventure erscheint nicht auf dem C64
  await adv(page, 'LIST');
  await expect(page.getByTestId('c64-screen')).not.toContainText('LIST');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const fontSize = await page
    .getByTestId('c64-screen')
    .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(fontSize).toBeGreaterThanOrEqual(7);
});

test('Sondertaste SPACE tippt im Zeilenmodus mehrfach ein Leerzeichen', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('new-game').click();
  await adv(page, 'schalte computer ein');
  await key(page, 'SPACE');
  await key(page, 'SPACE');
  await page.getByTestId('adventure-input').pressSequentially('X');
  await expect(page.getByTestId('adventure-input')).toHaveValue('  X');
});

test('Alt+C wechselt die Eingabezeile zwischen Adventure und C64, Umschalter bleibt gleich breit', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByTestId('new-game').click();
  const panel = page.locator('.adventure-panel');
  const toggle = page.getByTestId('input-toggle');
  await adv(page, 'schalte computer ein');
  await expect(panel).toHaveAttribute('data-target', 'c64');
  const wC64 = (await toggle.boundingBox())!;
  await page.keyboard.press('Alt+KeyC');
  await expect(panel).toHaveAttribute('data-target', 'adventure');
  const wAdv = (await toggle.boundingBox())!;
  expect(wAdv.width).toBe(wC64.width);
  expect(wAdv.height).toBe(wC64.height);
  await page.keyboard.press('Alt+KeyC');
  await expect(panel).toHaveAttribute('data-target', 'c64');
});

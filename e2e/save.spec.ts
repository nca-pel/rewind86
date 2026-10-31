import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { adv, log } from './helpers';

test('Autosave übersteht Neuladen, Export/Import stellt den Zustand wieder her', async ({ page }) => {
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

  // Manuell speichern + Export
  await page.getByRole('button', { name: 'Menü' }).click();
  await page.getByTestId('save-1').click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export').click()]);
  const file = readFileSync((await download.path())!, 'utf8');
  expect(JSON.parse(file).format).toBe('rewind1986-save');

  // Zustand verändern, dann importieren
  await page.getByRole('button', { name: 'Zurück zum Titelbildschirm' }).click();
  await page.getByTestId('new-game').click();
  await expect(page.locator('.inventory')).toContainText('leer');
  await page.getByRole('button', { name: 'Menü' }).click();
  await page
    .getByTestId('import-file')
    .setInputFiles({ name: 'save.json', mimeType: 'application/json', buffer: Buffer.from(file) });
  await expect(page.getByTestId('clock')).toHaveText(clock!);
  await expect(page.locator('.inventory')).toContainText('Ralfs Spielediskette');

  // Ungültiger Import wird abgelehnt
  await page.getByRole('button', { name: 'Menü' }).click();
  await page
    .getByTestId('import-file')
    .setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"x":1}') });
  await expect(page.getByTestId('toast')).toContainText('Import fehlgeschlagen');
  await expect(page.getByTestId('clock')).toHaveText(clock!);

  // Laden per Parser
  await page.keyboard.press('Escape');
  await adv(page, 'warte 30');
  await adv(page, 'laden 1');
  await expect(page.getByTestId('clock')).toHaveText(clock!);
});

test('Mobil/Desktop: C64 und Adventure-Eingabe getrennt, kein horizontales Scrollen', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('new-game').click();
  await adv(page, 'schalte computer ein');
  const c64Input = page.getByTestId('c64-input');
  await expect(c64Input).toBeVisible();
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

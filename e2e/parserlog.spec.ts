import { expect, test } from '@playwright/test';
import { adv, log } from './helpers';

test('Nicht verstandene Eingaben landen lokal im Protokoll (Dev-Tab Parser) und lassen sich abschalten', async ({
  page,
}) => {
  await page.goto('/?dev=1');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await page.getByTestId('new-game').click();
  await adv(page, 'flibberdibbet');
  await adv(page, 'flibberdibbet');
  await adv(page, 'untersuche zauberstab');
  await expect(log(page)).toContainText('kenne ich hier nicht');
  // verstandene Eingaben tauchen nicht auf
  await adv(page, 'nimm hörer');

  await page.getByTestId('dev-toggle').click();
  await page.getByTestId('dev-panel').getByRole('tab', { name: 'Parser' }).click();
  const out = page.getByTestId('parser-log');
  await expect(out).toContainText('2×  flibberdibbet');
  await expect(out).toContainText('untersuche zauberstab');
  await expect(out).not.toContainText('nimm hörer');
  await page.getByRole('button', { name: 'Leeren' }).click();
  await expect(out).toContainText('(leer)');

  // Abschalten im Menü
  await page.getByRole('button', { name: 'Entwicklerkonsole schließen' }).click();
  await page.getByRole('button', { name: 'Menü' }).click();
  await page.getByLabel(/Nicht verstandene Eingaben lokal merken/).uncheck();
  await page.keyboard.press('Escape');
  await adv(page, 'flibberdibbet');
  await page.getByTestId('dev-toggle').click();
  await page.getByTestId('dev-panel').getByRole('tab', { name: 'Parser' }).click();
  await expect(page.getByTestId('parser-log')).toContainText('(leer)');
});

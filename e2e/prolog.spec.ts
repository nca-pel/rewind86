import { expect, test } from '@playwright/test';
import { adv, c64, key, log, screen, showC64, typeKey } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('kompletter Prolog bis zur Mailbox und „Fortsetzung folgt“', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.getByTestId('new-game').click();
  await expect(log(page)).toContainText('Das Telefon auf deinem Schreibtisch klingelt');

  // Anruf
  await adv(page, 'Nimm den Hörer');
  await expect(log(page)).toContainText('Spiel, das es noch gar nicht zu kaufen gibt');
  await adv(page, 'frage ralf nach dem spiel');
  await expect(log(page)).toContainText('Kopie gezogen');
  await adv(page, 'lege auf');

  // Übergabe an der Tür
  await adv(page, 'warte');
  await expect(log(page)).toContainText('drückt dir eine Diskette in die Hand');
  await expect(log(page)).toContainText('Training');
  await expect(page.locator('.inventory')).toContainText('Ralfs Spielediskette');

  // Hotspot per Klick (Detailansicht) – Schublade öffnen per Button
  await page.locator('[data-hotspot="drawer"]').first().click({ force: true });
  await expect(page.getByTestId('detail-panel')).toBeVisible();
  await page.getByTestId('detail-panel').getByRole('button', { name: 'Öffnen' }).click();
  await expect(log(page)).toContainText('Diskette »1001«');

  await adv(page, 'lege spielediskette ins laufwerk');
  await adv(page, 'schalte computer ein');
  await showC64(page);
  await expect(screen(page)).toContainText('**** COMMODORE 64 BASIC V2 ****');

  await c64(page, 'LOAD"$",8');
  await c64(page, 'LIST');
  await expect(screen(page)).toContainText('"SPIEL.07"');

  // Erstes Rätsel: DATA-Zeilen im LADER
  await c64(page, 'LOAD"LADER",8');
  await c64(page, 'LIST');
  await expect(screen(page)).toContainText('910 DATA 52,49,57,55,51');
  await adv(page, 'lies die zeichentabelle');
  await expect(log(page)).toContainText('48 = 0');

  // Spiel starten, Intro bis zu den Credits, geheime Taste
  await c64(page, 'RUN');
  await expect(screen(page)).toContainText('ENTWICKLERVERSION', { timeout: 5000 });
  for (let i = 0; i < 8 && !(await screen(page).textContent())?.includes('C R E D I T S'); i++)
    await typeKey(page, 'Enter');
  await expect(screen(page)).toContainText('C R E D I T S');
  await key(page, 'ARROW_LEFT');
  await expect(screen(page)).toContainText('SCHLUESSELDISKETTE (2)');
  await typeKey(page, 'Enter');
  await expect(screen(page)).toContainText('SCHLUESSEL NICHT GEFUNDEN');
  await typeKey(page, 'j');
  await typeKey(page, '1');
  await expect(screen(page)).toContainText('ERSATZWAHL: SIEHE LADER');

  // Wählen + Koppler, dann Verbindung
  await adv(page, 'wähle 41973');
  await expect(log(page)).toContainText('ein Modem');
  await adv(page, 'lege den hörer in den koppler');
  await typeKey(page, 'Enter');
  await expect(screen(page)).toContainText('VERBUNDEN - 300 BAUD');
  await expect(page.locator('.status-values')).toContainText('online');

  await typeKey(page, '1');
  await typeKey(page, '1');
  await expect(screen(page)).toContainText('SCHLUESSEL FEHLT');
  await typeKey(page, 'x');
  await typeKey(page, '2');
  await expect(screen(page)).toContainText('WT-07 AUSGELIEFERT');
  await typeKey(page, 'x');
  await typeKey(page, 'Enter');
  await typeKey(page, '4');
  await expect(screen(page)).toContainText('VERBINDUNG BEENDET');
  await adv(page, 'lege auf');
  await expect(page.getByRole('dialog', { name: 'Ende des Ausschnitts' })).toBeVisible();
  await expect(log(page)).toContainText('Fortsetzung folgt');
  await page.getByRole('button', { name: 'Weiterspielen' }).click();

  // Notizblock: Fakten, eigene Notiz, Denkhilfe
  await adv(page, 'notizen');
  const nb = page.getByRole('dialog', { name: 'Notizblock' });
  await expect(nb).toContainText('WT-07');
  await nb.getByTestId('note-input').fill('Ralf morgen nach Diskette 2 fragen');
  await nb.getByRole('button', { name: 'Notieren' }).click();
  await expect(nb).toContainText('Ralf morgen nach Diskette 2 fragen');
  await page.keyboard.press('Escape');
  await adv(page, 'denke nach');
  await adv(page, 'notizen');
  await expect(page.getByRole('dialog', { name: 'Notizblock' }).locator('.hint-text')).toContainText('(1/3)');
  expect(errors).toEqual([]);
});

test('optionale INTRUDER-Demo mit mehreren Screens', async ({ page }) => {
  await page.getByTestId('new-game').click();
  await adv(page, 'öffne schublade');
  await adv(page, 'nimm die diskette 1001');
  await adv(page, 'lege sie ins laufwerk');
  await adv(page, 'schalte computer ein');
  await c64(page, 'LOAD"*",8');
  await c64(page, 'RUN');
  await expect(page.locator('canvas.demo-canvas')).toBeVisible();
  await expect(log(page)).toContainText('Brotkasten');
  await expect(page.locator('canvas.demo-canvas')).toHaveAttribute('aria-label', /INTRUDER/);
  await key(page, 'SPACE');
  await expect(page.locator('canvas.demo-canvas')).toHaveAttribute('aria-label', /NO BORDER/);
  await key(page, 'RUNSTOP');
  await expect(page.locator('canvas.demo-canvas')).toHaveCount(0);
});

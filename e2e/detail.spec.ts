import { expect, test } from '@playwright/test';
import { adv } from './helpers';

test('Detailansicht: Schublade zeigt Inhalt erst geöffnet, alles ohne Scrollen sichtbar, ✕ zoomt zurück', async ({
  page,
}, info) => {
  await page.goto('/');
  await page.getByTestId('new-game').click();
  const panel = page.getByTestId('detail-panel');

  // Geschlossene Schublade: keine Gegenstände zur Auswahl
  await page.locator('[data-hotspot="drawer"]').first().click({ force: true });
  await expect(panel.getByRole('button', { name: 'Öffnen' })).toBeVisible();
  await expect(panel.getByRole('button', { name: /nehmen$/ })).toHaveCount(0);
  await panel.getByRole('button', { name: 'Öffnen' }).click();
  await expect(panel.getByRole('button', { name: /nehmen$/ }).first()).toBeVisible();

  // ✕ schließt (nach der Zoom-Animation)
  await page.getByLabel('Detailansicht schließen').click();
  await expect(panel).toHaveCount(0);

  // Telefon (klingelt, mit Wählfeld): Text, Aktionen und Wählen ohne Scrollen sichtbar
  await adv(page, 'warte');
  await page.locator('[data-hotspot="phone"]').first().click({ force: true });
  await expect(panel.getByRole('button', { name: 'Wählen' })).toBeVisible();
  const [scrollH, clientH] = await panel.evaluate((e) => [e.scrollHeight, e.clientHeight]);
  // Auf dem Handy darf die Detailansicht scrollen: Das Adventure-Fenster behält Vorrang vor ihrer Höhe
  if (info.project.name === 'desktop') expect(scrollH).toBeLessThanOrEqual(clientH + 2);
  else expect((await page.locator('.adventure-panel').boundingBox())!.height).toBeGreaterThan(150);
});

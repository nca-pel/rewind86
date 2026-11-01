import { expect, test, type Page } from '@playwright/test';

/** Prüft, dass jede Klickfläche im Bild liegt und ein Klick auf ihre Mitte genau diesen Gegenstand trifft */
async function checkHotspots(page: Page): Promise<string[]> {
  const svg = page.locator('svg.desk-svg');
  await expect(svg).toBeVisible();
  const box = await svg.evaluate((e) => e.getBoundingClientRect().toJSON() as DOMRect);
  const ids = await svg
    .locator('[data-hotspot]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('data-hotspot')!));
  for (const id of ids) {
    // Fläche ohne Kontur (Playwrights boundingBox() rechnet bei SVG die Strichbreite mit ein)
    const r = await svg
      .locator(`[data-hotspot="${id}"] .hs-area`)
      .first()
      .evaluate((e) => e.getBoundingClientRect().toJSON() as DOMRect);
    expect(r.width, id).toBeGreaterThan(8);
    expect(r.x, id).toBeGreaterThanOrEqual(box.x - 1);
    expect(r.y, id).toBeGreaterThanOrEqual(box.y - 1);
    expect(r.x + r.width, id).toBeLessThanOrEqual(box.x + box.width + 1);
    expect(r.y + r.height, id).toBeLessThanOrEqual(box.y + box.height + 1);
    const hit = await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.closest('[data-hotspot]')?.getAttribute('data-hotspot'),
      { x: r.x + r.width / 2, y: r.y + r.height / 2 },
    );
    expect(hit, `Mitte von ${id}`).toBe(id);
  }
  return ids;
}

test('Schreibtisch-Szene: Klickflächen liegen auf den Gegenständen, bei jeder Fenstergröße', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByTestId('new-game').click();
  const ids = await checkHotspots(page);
  expect(ids).toEqual(
    expect.arrayContaining([
      'monitor',
      'c64',
      'phone',
      'coupler',
      'drive1541',
      'tape',
      'radio',
      'drawer',
      'door',
    ]),
  );

  for (const size of [
    { width: 900, height: 1100 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(size);
    expect((await checkHotspots(page)).sort()).toEqual([...ids].sort());
  }

  // Name des Gegenstands unter dem Bild beim Darüberfahren
  await page.locator('[data-hotspot="phone"] .hs-area').hover({ force: true });
  await expect(page.getByTestId('desk-caption')).toHaveText('Telefon');

  // „Namen“ blendet alle Namen ein
  await page.getByTestId('desk-names').click();
  await expect(page.locator('svg.desk-svg text.desk-name')).toHaveCount(ids.length);

  // Klick öffnet die Detailansicht mit Bildausschnitt
  await page.locator('[data-hotspot="phone"] .hs-area').click({ force: true });
  await expect(page.getByTestId('detail-panel').locator('svg.device-crop')).toBeVisible();
});

test('Schreibtisch-Szene: nur die Zeitschrift ist klickbar (Päckchen ist Kulisse), mit eigenem Titelbild', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByTestId('new-game').click();
  const input = page.getByTestId('adventure-input');
  await input.fill('öffne schublade');
  await input.press('Enter');
  await expect(page.locator('svg.desk-svg [data-hotspot="magazine"]')).toHaveCount(1);
  await expect(page.locator('svg.desk-svg [data-hotspot="package"]')).toHaveCount(0);
  await page.locator('[data-hotspot="magazine"]').click({ force: true });
  await expect(
    page.getByTestId('detail-panel').getByRole('img', { name: /Heimcomputer-Journal/ }),
  ).toBeVisible();
});

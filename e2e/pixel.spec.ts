import { expect, test } from '@playwright/test';

test('Schalter Pixelgrafik/realistisch: beide Schreibtische haben dieselben Hotspots und bleiben bedienbar', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByTestId('new-game').click();
  // Standard: Pixelgrafik
  await expect(page.locator('svg.desk-svg.pixel')).toBeVisible();
  await page.locator('[data-hotspot="phone"]').click();
  await expect(page.getByTestId('detail-panel')).toBeVisible();
  const pixelSpots = await page
    .locator('svg.desk-svg [data-hotspot]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('data-hotspot')).sort());

  await page.getByRole('button', { name: 'Menü' }).click();
  await page.getByTestId('pixel-art').uncheck();
  await page.keyboard.press('Escape');
  await expect(page.locator('svg.desk-svg:not(.pixel)')).toBeVisible();
  const realSpots = await page
    .locator('svg.desk-svg [data-hotspot]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('data-hotspot')).sort());
  expect(realSpots).toEqual(pixelSpots);
  expect(realSpots).toContain('drive1541');

  // Die Wahl bleibt nach dem Neuladen erhalten
  await page.reload();
  await page.getByTestId('new-game').click();
  await expect(page.locator('svg.desk-svg:not(.pixel)')).toBeVisible();
});

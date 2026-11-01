import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { adv } from './helpers';

/** Automatisierte Barrierefreiheitsprüfung (WCAG 2 A/AA) für Titel, Schreibtisch in beiden Grafikstilen, Menü */
async function check(page: import('@playwright/test').Page, what: string) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const v = r.violations.map((x) => `${x.id}: ${x.nodes.length}× ${x.nodes[0]?.target?.join(' ')}`);
  expect(v, `${what}: ${v.join(' | ')}`).toEqual([]);
}

test('Barrierefreiheit: Titel, Spiel (Pixel und realistisch), Menü', async ({ page }) => {
  await page.goto('/');
  await check(page, 'Titel');
  await page.getByTestId('new-game').click();
  await check(page, 'Schreibtisch (Pixelgrafik)');
  await adv(page, 'nimm hörer');
  await page.getByRole('button', { name: 'Menü' }).click();
  await check(page, 'Menü');
  await page.getByTestId('pixel-art').uncheck();
  await page.keyboard.press('Escape');
  await check(page, 'Schreibtisch (realistisch)');
});

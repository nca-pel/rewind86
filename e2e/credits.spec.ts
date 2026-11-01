import { expect, test } from '@playwright/test';

const DISCLAIMER_START = 'REWIND 1986 ist ein fiktionales Computerspiel.';
const DISCLAIMER_END = 'soweit nicht ausdrücklich anders angegeben.';

test('Credits mit Disclaimer: vom Titelbildschirm und aus dem Spielmenü', async ({ page }) => {
  await page.goto('/');
  // Titelbildschirm
  await page.getByTestId('open-credits').click();
  const credits = page.getByTestId('credits');
  await expect(credits).toContainText('Game-Designer');
  await expect(credits).toContainText('Peter Elbracht');
  for (const role of ['Coder', 'FX-Artist', 'Gfx-Artist']) await expect(credits).toContainText(role);
  await expect(credits).toContainText('Claude Code');
  await expect(page.getByTestId('legal-disclaimer')).toContainText(DISCLAIMER_START);
  await expect(page.getByTestId('legal-disclaimer')).toContainText(DISCLAIMER_END);
  await page.keyboard.press('Escape');
  await expect(credits).toBeHidden();

  // Im Spiel über das Menü
  await page.getByTestId('new-game').click();
  await page.getByRole('button', { name: 'Menü' }).click();
  await page.getByTestId('open-credits').click();
  await expect(page.getByTestId('credits')).toContainText('Peter Elbracht');
  await expect(page.getByTestId('legal-disclaimer')).toContainText(DISCLAIMER_START);
});

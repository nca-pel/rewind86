import { expect, type Page } from '@playwright/test';

/** Die Eingabezeile im ADVENTURE-Fenster spricht entweder mit dem Adventure oder mit dem C64. */
async function setTarget(page: Page, target: 'adventure' | 'c64'): Promise<void> {
  const panel = page.locator('.adventure-panel');
  if ((await panel.getAttribute('data-target')) !== target) await page.getByTestId('input-toggle').click();
  await expect(panel).toHaveAttribute('data-target', target);
}

export async function adv(page: Page, text: string): Promise<void> {
  await setTarget(page, 'adventure');
  const input = page.getByTestId('adventure-input');
  await input.fill(text);
  await input.press('Enter');
  await expect(input).toHaveValue('');
}

/** Auf Mobilgeräten liegt der C64 in einem eigenen Tab. */
export async function showC64(page: Page): Promise<void> {
  const tab = page.getByTestId('tab-c64');
  if (await tab.isVisible()) await tab.click();
}

export async function c64(page: Page, text: string): Promise<void> {
  await showC64(page);
  await setTarget(page, 'c64');
  const input = page.getByTestId('adventure-input');
  await input.fill(text);
  await input.press('Enter');
}

export async function key(page: Page, k: string): Promise<void> {
  await showC64(page);
  await page.locator(`.keys button[data-key="${k}"]`).click();
}

export async function typeKey(page: Page, k: string): Promise<void> {
  await showC64(page);
  await setTarget(page, 'c64');
  await page.getByTestId('adventure-input').press(k);
}

export const screen = (page: Page) => page.getByTestId('c64-screen');
export const log = (page: Page) => page.getByTestId('adventure-log');

import { expect, type Page } from '@playwright/test';

export async function adv(page: Page, text: string): Promise<void> {
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
  const input = page.getByTestId('c64-input');
  await input.fill(text);
  await input.press('Enter');
}

export async function key(page: Page, k: string): Promise<void> {
  await showC64(page);
  await page.locator(`.special-keys button[data-key="${k}"]`).click();
}

export async function typeKey(page: Page, k: string): Promise<void> {
  await showC64(page);
  await page.getByTestId('c64-input').press(k);
}

export const screen = (page: Page) => page.getByTestId('c64-screen');
export const log = (page: Page) => page.getByTestId('adventure-log');

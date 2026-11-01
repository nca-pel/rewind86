import { expect, test } from '@playwright/test';
import { adv } from './helpers';

test('Spielstände liegen in IndexedDB; alter localStorage-Stand wird übernommen', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('new-game').click();
  await adv(page, 'nimm hörer');
  await adv(page, 'lege auf');
  await page.getByRole('button', { name: 'Menü' }).click();
  await expect(page.getByTestId('storage-kind')).toContainText('IndexedDB');
  await page.getByTestId('save-2').click();

  // Stand liegt wirklich in IndexedDB, nicht mehr in localStorage
  const keys = await page.evaluate(
    () =>
      new Promise<string[]>((resolve, reject) => {
        const req = indexedDB.open('rewind1986');
        req.onsuccess = () => {
          const r = req.result.transaction('saves').objectStore('saves').getAllKeys();
          r.onsuccess = () => resolve(r.result as string[]);
          r.onerror = () => reject(r.error);
        };
        req.onerror = () => reject(req.error);
      }),
  );
  expect(keys).toContain('2');
  expect(keys).toContain('auto');
  expect(
    await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('rewind1986.save.'))),
  ).toEqual([]);

  // Alten Stand wie früher in localStorage ablegen (aus Slot 2 kopiert), IndexedDB-Slot 3 fehlt noch
  const raw = await page.evaluate(
    () =>
      new Promise<string>((resolve, reject) => {
        const req = indexedDB.open('rewind1986');
        req.onsuccess = () => {
          const r = req.result.transaction('saves').objectStore('saves').get('2');
          r.onsuccess = () => resolve(r.result as string);
          r.onerror = () => reject(r.error);
        };
      }),
  );
  await page.evaluate((v) => localStorage.setItem('rewind1986.save.3', v), raw);
  await page.reload();
  await expect(page.getByTestId('continue')).toBeVisible();
  const idbKeys = await page.evaluate(
    () =>
      new Promise<string[]>((resolve, reject) => {
        const req = indexedDB.open('rewind1986');
        req.onsuccess = () => {
          const r = req.result.transaction('saves').objectStore('saves').getAllKeys();
          r.onsuccess = () => resolve(r.result as string[]);
          r.onerror = () => reject(r.error);
        };
        req.onerror = () => reject(req.error);
      }),
  );
  expect(idbKeys).toContain('3');
  expect(
    await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('rewind1986.save.'))),
  ).toEqual([]);
});

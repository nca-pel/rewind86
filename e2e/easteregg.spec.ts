import { expect, test } from '@playwright/test';
import { adv, c64, key, screen } from './helpers';

test('Easter-Egg: LOAD"ABANDON",8,1 zeigt das Video im Monitor, RUN/STOP beendet es', async ({ page }) => {
  // YouTube nicht wirklich laden (Tests laufen offline und deterministisch)
  await page.route(/youtube(-nocookie)?\.com/, (r) =>
    r.fulfill({ status: 200, contentType: 'text/html', body: '<body style="background:#123">VIDEO</body>' }),
  );
  await page.goto('/');
  await page.getByTestId('new-game').click();
  await adv(page, 'schalte computer ein');
  await c64(page, 'LOAD"ABANDON",8,1');
  const video = page.getByTestId('monitor-video');
  await expect(video).toBeVisible();
  await expect(video.locator('iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/rAyT1LDpyaE/);
  // Das Video sitzt innerhalb der Bildröhre
  const tube = await page.locator('.c64-display').boundingBox();
  const box = await video.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(tube!.x - 1);
  expect(box!.y).toBeGreaterThanOrEqual(tube!.y - 1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(tube!.x + tube!.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(tube!.y + tube!.height + 1);
  await key(page, 'RUNSTOP');
  await expect(video).toBeHidden();
  await expect(screen(page)).toContainText('READY.');
});

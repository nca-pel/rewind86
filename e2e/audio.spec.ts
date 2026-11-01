import { expect, test } from '@playwright/test';
import { adv } from './helpers';

/** Sprachausgabe abfangen: gesprochene Texte mit Sprache mitschreiben, Ende sofort melden */
test('Radio: Infowelle spricht deutsch, BFBS englisch, Ausschalten verstummt; Klingeln ohne Fehler', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.addInitScript(() => {
    const log: Array<{ text: string; lang: string }> = [];
    const w = window as unknown as { __spoken: typeof log; __cancels: number };
    w.__spoken = log;
    w.__cancels = 0;
    const fake = {
      speak(u: SpeechSynthesisUtterance) {
        log.push({ text: u.text, lang: u.lang });
      },
      cancel() {
        w.__cancels++;
      },
      getVoices: () => [],
    };
    Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
  });
  await page.goto('/');
  await page.getByTestId('new-game').click();

  const spoken = () =>
    page.evaluate(() => (window as unknown as { __spoken: Array<{ text: string; lang: string }> }).__spoken);

  await adv(page, 'schalte radio ein');
  await adv(page, 'stelle radio auf info');
  await expect.poll(async () => (await spoken()).at(-1)?.lang).toBe('de-DE');
  expect((await spoken()).at(-1)?.text).toContain('Die Nachrichten');

  await adv(page, 'stelle radio auf bfbs');
  await expect.poll(async () => (await spoken()).at(-1)?.lang).toBe('en-GB');
  expect((await spoken()).at(-1)?.text).toContain('B F B S');

  const before = await page.evaluate(() => (window as unknown as { __cancels: number }).__cancels);
  await adv(page, 'schalte radio aus');
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __cancels: number }).__cancels))
    .toBeGreaterThan(before);

  // Telefon klingelt (Zeit verstreichen lassen) – Klingel läuft ohne Fehler
  await adv(page, 'warte');
  await page.waitForTimeout(600);
  await adv(page, 'nimm hörer');
  expect(errors).toEqual([]);
});

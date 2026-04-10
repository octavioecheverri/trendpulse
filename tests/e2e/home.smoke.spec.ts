import { test, expect } from '@playwright/test';

test.describe('home @smoke', () => {
  test('renders trending pieces and outfits sections in English', async ({ page }) => {
    await page.goto('/en');
    await expect(page.getByRole('heading', { name: 'Trending pieces' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Trending outfits' })).toBeVisible();
  });

  test('language switcher updates the URL locale', async ({ page }) => {
    await page.goto('/en');
    await page.getByLabel('Language').selectOption('es');
    await expect(page).toHaveURL(/\/es/);
  });

  test('legal pages respond with 200', async ({ page }) => {
    const privacy = await page.goto('/en/privacy');
    expect(privacy?.status()).toBe(200);
    const terms = await page.goto('/en/terms');
    expect(terms?.status()).toBe(200);
  });

  test('newsletter subscribe button is visible', async ({ page }) => {
    await page.goto('/en');
    await expect(page.getByRole('link', { name: 'Subscribe' })).toBeVisible();
  });
});

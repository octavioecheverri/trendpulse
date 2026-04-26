import { test, expect } from '@playwright/test';

test.describe('home @smoke', () => {
  test('renders trending pieces and outfits sections in English', async ({ page }) => {
    await page.goto('/en');
    await expect(page.getByRole('heading', { name: 'Trending pieces' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Trending outfits' })).toBeVisible();
  });

  test('shows empty state copy when DB has no items', async ({ page }) => {
    await page.goto('/en');
    await expect(page.getByText(/No trending pieces in/i)).toBeVisible();
    await expect(page.getByText(/No trending outfits in/i)).toBeVisible();
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

  test('header shows Sign in link when anonymous', async ({ page }) => {
    await page.goto('/en');
    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
  });
});

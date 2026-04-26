import { test, expect } from '@playwright/test';

test('anonymous user visiting /account is redirected to /login', async ({ page }) => {
  await page.goto('/en/account');
  await expect(page).toHaveURL(/\/login/);
});

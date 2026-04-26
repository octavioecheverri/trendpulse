import { test, expect } from '@playwright/test';

test('login page shows magic-link form', async ({ page }) => {
  await page.goto('/en/login');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send magic link' })).toBeVisible();
});

test('signup page redirects to login', async ({ page }) => {
  await page.goto('/en/signup');
  await expect(page).toHaveURL(/\/login/);
});

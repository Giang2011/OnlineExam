import { expect, test } from '@playwright/test';
import { ADMIN, login } from './helpers';

test.describe('Đăng nhập', () => {
  test('sai mật khẩu hiện thông báo lỗi', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Tên đăng nhập').fill(ADMIN.username);
    await page.getByLabel('Mật khẩu').fill('sai-mat-khau');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('đúng mật khẩu vào shell theo vai trò ADMIN', async ({ page }) => {
    await login(page, ADMIN.username, ADMIN.password);
    await expect(page.getByRole('heading', { name: /Chào admin/i })).toBeVisible();
  });

  test('không đăng nhập thì truy cập route bảo vệ bị đưa về /login', async ({ page }) => {
    await page.goto('/exams');
    await expect(page).toHaveURL(/\/login\?next=/);
  });
});

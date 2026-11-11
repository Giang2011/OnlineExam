import { expect, type Page } from '@playwright/test';

export const ADMIN = { username: 'admin', password: '12345678' };

/** Đăng nhập rồi chờ tới khi shell ứng dụng render xong. */
export async function login(page: Page, username: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Tên đăng nhập').fill(username);
  await page.getByLabel('Mật khẩu').fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page.getByRole('navigation', { name: 'Điều hướng chính' })).toBeVisible();
}

/** Đăng nhập và xác nhận đã vào đúng trang theo vai trò. */
export async function loginAsAdmin(page: Page): Promise<void> {
  await login(page, ADMIN.username, ADMIN.password);
  await expect(page).toHaveURL(/\/(exams|questions|paper-exams|results|users|subjects)?$/);
}

import { expect, test } from '@playwright/test';

test.describe('Phân quyền', () => {
  test('STUDENT mở /paper-exams thấy thông báo từ chối, không bị đưa về /login', async ({ page, request }) => {
    // Đăng nhập admin qua API để tạo học sinh.
    const login = await request.post('http://localhost:8080/api/v1/auth/login', {
      data: { username: 'admin', password: '12345678' },
    });
    expect(login.ok(), await login.text()).toBeTruthy();

    const csrf = login
      .headers()['set-cookie']
      ?.split(',')
      .map((c) => c.trim())
      .find((c) => c.startsWith('XSRF-TOKEN='))
      ?.split(';')[0]
      .split('=')[1];

    const suffix = Date.now().toString().slice(-6);
    const created = await request.post('http://localhost:8080/api/v1/users/students', {
      headers: { 'X-XSRF-TOKEN': csrf ?? '' },
      data: { studentId: `E2E${suffix}`, name: 'E2E Student' },
    });
    expect(created.ok(), await created.text()).toBeTruthy();

    const student = await created.json();
    expect(student.username).toBeTruthy();
    expect(student.password).toBeTruthy();

    await page.goto('/login');
    await page.getByLabel('Tên đăng nhập').fill(student.username);
    await page.getByLabel('Mật khẩu').fill(student.password);
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page.getByRole('heading', { name: /Chào/i })).toBeVisible();

    await page.goto('/paper-exams');

    // Vẫn ở trong app (không bị đẩy về /login) và có thông báo từ chối quyền.
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByText(/không có quyền/i).first()).toBeVisible();
  });
});

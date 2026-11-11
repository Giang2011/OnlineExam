import { expect, test } from '@playwright/test';
import { login } from './helpers';

test.describe('Giáo viên tạo kỳ thi', () => {
  test('tạo kỳ thi thành công và thấy trong danh sách', async ({ page }) => {
    await login(page, 'admin', '12345678');

    await page.goto('/exams/new');

    const title = `E2E Kỳ thi ${Date.now()}`;
    await page.getByLabel('Tên kỳ thi').fill(title);

    // Chọn môn học đầu tiên trong danh sách.
    const subjectSelect = page.getByLabel('Môn học');
    const firstSubjectValue = await subjectSelect.locator('option').nth(1).getAttribute('value');
    expect(firstSubjectValue).toBeTruthy();
    await subjectSelect.selectOption(firstSubjectValue!);

    // Thêm chương đầu tiên của môn vừa chọn.
    await page.getByRole('button', { name: 'Thêm chương' }).click();
    const chapterSelect = page.getByLabel('Chương').first();
    const firstChapterValue = await chapterSelect.locator('option').nth(0).getAttribute('value');
    expect(firstChapterValue).toBeTruthy();
    await chapterSelect.selectOption(firstChapterValue!);

    // Lấy số câu có sẵn để cấu hình khớp tổng.
    const availableText = await page.getByText(/Có sẵn \d+ câu/).first().innerText();
    const available = Number(availableText.match(/(\d+)/)?.[1] ?? '0');
    expect(available).toBeGreaterThan(0);

    const questionCount = Math.min(2, available);
    await page.getByLabel('Số câu', { exact: true }).first().fill(String(questionCount));
    await page.getByLabel('Tổng số câu', { exact: true }).fill(String(questionCount));

    // Mốc thời gian: bắt đầu 1 giờ trước, kết thúc 1 giờ sau.
    const now = new Date();
    const start = new Date(now.getTime() - 60 * 60 * 1000);
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const toLocal = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    await page.getByLabel('Bắt đầu').fill(toLocal(start));
    await page.getByLabel('Kết thúc').fill(toLocal(end));

    await page.getByRole('button', { name: 'Tạo kỳ thi' }).click();

    // Chuyển tới trang chi tiết kỳ thi vừa tạo.
    await expect(page).toHaveURL(/\/exams\/\d+$/);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();

    // Kỳ thi xuất hiện trong danh sách.
    await page.goto('/exams');
    await expect(page.getByText(title).first()).toBeVisible();
  });
});

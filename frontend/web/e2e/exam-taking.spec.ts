import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const BASE = 'http://localhost:8080/api/v1';

interface Session {
  csrf: string;
}

async function adminSession(request: APIRequestContext): Promise<Session> {
  const login = await request.post(`${BASE}/auth/login`, {
    data: { username: 'admin', password: '12345678' },
  });
  expect(login.ok(), await login.text()).toBeTruthy();

  const raw = login.headers()['set-cookie'] ?? '';
  const match = raw
    .split(/,(?=[A-Za-z0-9_-]+=)/)
    .map((c) => c.trim())
    .find((c) => c.startsWith('XSRF-TOKEN='));
  const csrf = match?.split(';')[0].split('=')[1] ?? '';

  return { csrf };
}

/**
 * Chuẩn bị một học sinh + một kỳ thi đang diễn ra có gán học sinh đó.
 * Trả về thông tin đăng nhập của học sinh và id kỳ thi.
 */
async function setupExamForStudent(request: APIRequestContext) {
  const { csrf } = await adminSession(request);

  const suffix = Date.now().toString().slice(-7);

  // Tạo học sinh.
  const studentRes = await request.post(`${BASE}/users/students`, {
    headers: { 'X-XSRF-TOKEN': csrf },
    data: { studentId: `E2E${suffix}`, name: `E2E Học sinh ${suffix}` },
  });
  expect(studentRes.ok(), await studentRes.text()).toBeTruthy();
  const student = await studentRes.json();

  // Tìm môn + chương có sẵn câu hỏi.
  const subjectsRes = await request.get(`${BASE}/subjects`);
  expect(subjectsRes.ok()).toBeTruthy();
  const subjects = await subjectsRes.json();

  let subjectId = 0;
  let chapterId = 0;
  let questionCount = 0;

  for (const subject of subjects) {
    const chaptersRes = await request.get(`${BASE}/subjects/${subject.id}/chapters`);
    if (!chaptersRes.ok()) continue;
    const chapters = await chaptersRes.json();
    for (const chapter of chapters) {
      if ((chapter.questionCount ?? 0) > 0) {
        subjectId = subject.id;
        chapterId = chapter.id;
        questionCount = Math.min(2, chapter.questionCount);
        break;
      }
    }
    if (subjectId) break;
  }

  expect(subjectId, 'cần có ít nhất một môn và chương có câu hỏi').toBeTruthy();

  const now = new Date();
  const start = new Date(now.getTime() - 60 * 60 * 1000);
  const end = new Date(now.getTime() + 60 * 60 * 1000);
  // Backend lưu LocalDateTime theo giờ server — phải gửi giờ local, không phải UTC.
  const pad = (n: number) => String(n).padStart(2, '0');
  const iso = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

  const examRes = await request.post(`${BASE}/exams`, {
    headers: { 'X-XSRF-TOKEN': csrf },
    data: {
      title: `E2E Thi ${suffix}`,
      subjectId,
      duration: 30,
      totalQuestions: questionCount,
      totalVariants: 1,
      maxAttempts: 1,
      chapterConfigs: [{ chapterId, questionCount }],
      startTime: iso(start),
      endTime: iso(end),
    },
  });
  expect(examRes.ok(), await examRes.text()).toBeTruthy();
  const exam = await examRes.json();

  // Gán học sinh vào kỳ thi.
  const assignRes = await request.post(`${BASE}/exams/${exam.id}/participants`, {
    headers: { 'X-XSRF-TOKEN': csrf },
    data: { userId: student.id },
  });
  expect(assignRes.ok(), await assignRes.text()).toBeTruthy();

  return {
    username: student.username as string,
    password: student.password as string,
    examId: exam.id as number,
    examTitle: exam.title as string,
    questionCount,
  };
}

async function loginStudent(page: Page, username: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Tên đăng nhập').fill(username);
  await page.getByLabel('Mật khẩu').fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page.getByRole('heading', { name: /Chào/i })).toBeVisible();
}

test.describe('Học sinh làm bài', () => {
  test('làm bài, đáp án được giữ lại sau khi tải lại, nộp bài và thấy điểm', async ({ page, request }) => {
    const setup = await setupExamForStudent(request);

    await loginStudent(page, setup.username, setup.password);

    // Mở kỳ thi từ danh sách.
    await page.goto('/my-exams');
    await expect(page.getByText(setup.examTitle).first()).toBeVisible();
    await page.getByRole('button', { name: 'Bắt đầu thi' }).first().click();

    await expect(page).toHaveURL(/\/exam-taking\/\d+$/);
    await expect(page.getByRole('timer')).toBeVisible();

    // Trả lời câu đầu tiên.
    const firstAnswer = page.locator('main ul li button').first();
    await expect(firstAnswer).toBeVisible();
    await firstAnswer.click();
    await expect(firstAnswer).toHaveAttribute('aria-pressed', 'true');

    // Chờ autosave 20 giây rồi tải lại trang — đáp án phải còn.
    await expect(page.getByText(/Đã trả lời 1 \//)).toBeVisible();

    await page.waitForTimeout(22_000);
    await page.reload();

    await expect(page).toHaveURL(/\/exam-taking\/\d+$/);
    await expect(page.getByText(/Đã trả lời 1 \//)).toBeVisible();
    await expect(page.locator('main ul li button[aria-pressed="true"]')).toHaveCount(1);

    // Nộp bài.
    await page.getByRole('button', { name: 'Nộp bài' }).first().click();
    await page.getByRole('button', { name: 'Nộp bài' }).last().click();

    // Điểm hiển thị ngay.
    await expect(page.getByText(/Đã nộp bài\. Điểm:/)).toBeVisible();
  });

  test('giáo viên xem được bảng điểm và biểu đồ phân bố', async ({ page, request, browser }) => {
    const setup = await setupExamForStudent(request);

    await loginStudent(page, setup.username, setup.password);
    await page.goto('/my-exams');
    await page.getByRole('button', { name: 'Bắt đầu thi' }).first().click();
    await expect(page).toHaveURL(/\/exam-taking\/\d+$/);

    await page.locator('main ul li button').first().click();
    await page.getByRole('button', { name: 'Nộp bài' }).first().click();
    await page.getByRole('button', { name: 'Nộp bài' }).last().click();
    await expect(page.getByText(/Đã nộp bài\. Điểm:/)).toBeVisible();

    // Chuyển sang tài khoản giáo viên để xem bảng điểm.
    // Dùng context mới để không dính session của học sinh.
    const teacherContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();
    await teacherPage.goto('/login');
    await teacherPage.getByLabel('Tên đăng nhập').fill('admin');
    await teacherPage.getByLabel('Mật khẩu').fill('12345678');
    await teacherPage.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(teacherPage.getByRole('heading', { name: /Chào admin/i })).toBeVisible();

    await teacherPage.goto(`/results/exam/${setup.examId}`);
    await expect(teacherPage.getByRole('heading', { name: 'Phân bố điểm' })).toBeVisible();
    await expect(teacherPage.getByRole('heading', { name: 'Bảng điểm' })).toBeVisible();
    // Biểu đồ Recharts đã render.
    await expect(teacherPage.locator('.recharts-wrapper')).toHaveCount(1);

    await teacherContext.close();
  });
});

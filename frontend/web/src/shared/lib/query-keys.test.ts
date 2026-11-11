import { describe, expect, it } from 'vitest';
import { queryKeys } from '@/shared/lib/query-keys';

describe('queryKeys', () => {
  it('trả về key giống nhau cho cùng tham số', () => {
    expect(queryKeys.exams.detail(3)).toEqual(queryKeys.exams.detail(3));
    expect(queryKeys.questions.list({ page: 1, size: 10 })).toEqual(
      queryKeys.questions.list({ page: 1, size: 10 }),
    );
  });

  it('phân biệt các tham số khác nhau', () => {
    expect(queryKeys.exams.detail(3)).not.toEqual(queryKeys.exams.detail(4));
    expect(queryKeys.questions.list({ page: 1, size: 10 })).not.toEqual(
      queryKeys.questions.list({ page: 2, size: 10 }),
    );
  });

  it('có tiền tố phân cấp để invalidate theo nhóm', () => {
    expect(queryKeys.exams.all[0]).toBe('exams');
    expect(queryKeys.exams.detail(1)[0]).toBe('exams');
    expect(queryKeys.paperExams.all[0]).toBe('paper-exams');
    expect(queryKeys.results.exam(1)[0]).toBe('results');
  });

  it('dùng object rỗng khi không truyền params', () => {
    expect(queryKeys.users.list()).toEqual(['users', 'list', {}]);
  });

  it('serialize ổn định nên TanStack Query so sánh được', () => {
    expect(JSON.stringify(queryKeys.users.list())).toBe(JSON.stringify(queryKeys.users.list()));
  });
});

import { z } from 'zod';

export const createStudentSchema = z.object({
  studentId: z.string().trim().min(1, 'Nhập mã số sinh viên.'),
  name: z.string().trim().min(1, 'Nhập tên hiển thị.'),
});

export const createTeacherSchema = z.object({
  username: z.string().trim().min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự.'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự.'),
  name: z.string().trim().min(1, 'Nhập tên hiển thị.'),
});

// Partial update — để trống field nghĩa là giữ nguyên giá trị cũ (backend bỏ qua
// field rỗng), nên schema phải cho phép chuỗi rỗng.
export const updateUserSchema = z.object({
  name: z.string().trim().min(1, 'Nhập tên hiển thị.').or(z.literal('')),
  username: z.string().trim().min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự.').or(z.literal('')),
  password: z
    .string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự.')
    .or(z.literal('')),
});

export type CreateStudentFormValues = z.infer<typeof createStudentSchema>;
export type CreateTeacherFormValues = z.infer<typeof createTeacherSchema>;
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

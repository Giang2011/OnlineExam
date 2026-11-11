import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Nhập tên đăng nhập.'),
  password: z.string().min(1, 'Nhập mật khẩu.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const profileSchema = z.object({
  name: z.string().trim().min(1, 'Nhập tên hiển thị.'),
  username: z.string().trim().min(1, 'Nhập tên đăng nhập.'),
  password: z
    .string()
    .min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự.')
    .or(z.literal('')),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

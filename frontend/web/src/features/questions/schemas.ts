import { z } from 'zod';

export const questionSchema = z.object({
  content: z.string().trim().min(1, 'Nhập nội dung câu hỏi.'),
  subjectId: z.coerce.number().int().positive('Chọn môn học.'),
  chapterId: z.coerce.number().int().positive('Chọn chương.'),
  answers: z
    .array(
      z.object({
        content: z.string().trim().min(1, 'Nhập nội dung đáp án.'),
        isCorrect: z.boolean(),
        imageRemoved: z.boolean().optional(),
      }),
    )
    .min(2, 'Cần ít nhất 2 đáp án.')
    .refine(
      (answers) => answers.some((answer) => answer.isCorrect),
      'Phải có ít nhất một đáp án đúng.',
    ),
});

export type QuestionFormValues = z.infer<typeof questionSchema>;

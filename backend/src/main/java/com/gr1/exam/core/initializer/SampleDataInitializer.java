// package com.gr1.exam.core.initializer;

// import com.gr1.exam.module.exam.entity.Exam;
// import com.gr1.exam.module.exam.entity.ExamChapterConfig;
// import com.gr1.exam.module.exam.repository.ExamChapterConfigRepository;
// import com.gr1.exam.module.exam.repository.ExamParticipantRepository;
// import com.gr1.exam.module.exam.repository.ExamRepository;
// import com.gr1.exam.module.question.entity.Answer;
// import com.gr1.exam.module.question.entity.Chapter;
// import com.gr1.exam.module.question.entity.Question;
// import com.gr1.exam.module.question.entity.Subject;
// import com.gr1.exam.module.question.repository.ChapterRepository;
// import com.gr1.exam.module.question.repository.QuestionRepository;
// import com.gr1.exam.module.question.repository.SubjectRepository;
// import com.gr1.exam.module.user.entity.User;
// import com.gr1.exam.module.user.repository.UserRepository;
// import lombok.RequiredArgsConstructor;
// import lombok.extern.slf4j.Slf4j;
// import org.springframework.boot.CommandLineRunner;
// import org.springframework.core.annotation.Order;
// import org.springframework.security.crypto.password.PasswordEncoder;
// import org.springframework.stereotype.Component;
// import org.springframework.transaction.annotation.Transactional;

// import java.time.LocalDateTime;
// import java.util.ArrayList;
// import java.util.Arrays;
// import java.util.List;
// import java.util.Random;

// /**
//  * Tạo dữ liệu mẫu lớn (Subjects, Chapters, Questions, Students, Teachers)
//  * để demo hệ thống một cách chân thực nhất.
//  */
// @Component
// @Order(2)
// @RequiredArgsConstructor
// @Slf4j
// public class SampleDataInitializer implements CommandLineRunner {

//     private final UserRepository userRepository;
//     private final SubjectRepository subjectRepository;
//     private final ChapterRepository chapterRepository;
//     private final QuestionRepository questionRepository;
//     private final ExamRepository examRepository;
//     private final ExamChapterConfigRepository examChapterConfigRepository;
//     private final ExamParticipantRepository participantRepository;
//     private final PasswordEncoder passwordEncoder;
//     private final Random random = new Random();

//     @Override
//     @Transactional
//     public void run(String... args) {
//         log.info("🚀 Starting sample data initialization check...");

//         // 1. Tạo giáo viên và thí sinh mẫu
//         List<User> students = createUsers(50);

//         if (subjectRepository.count() > 0) {
//             log.info("ℹ️ Subjects already exist. Checking participants...");
//             if (participantRepository.count() == 0) {
//                 log.info("⚠️ No participants found. Assigning students to existing exams...");
//                 List<Exam> exams = examRepository.findAll();
//                 for (Exam exam : exams) {
//                     for (User student : students) {
//                         participantRepository.save(com.gr1.exam.module.exam.entity.ExamParticipant.builder()
//                                 .exam(exam)
//                                 .user(student)
//                                 .build());
//                     }
//                 }
//             }
//             return;
//         }

//         log.info("🚀 Creating new LARGE sample data set...");
//         List<Subject> subjects = new ArrayList<>();
//         subjects.add(createSubject("Toán học cao cấp", Arrays.asList("Ma trận & Định thức",
//                 "Hệ phương trình tuyến tính", "Không gian Vector", "Ánh xạ tuyến tính", "Trị riêng & Vector riêng")));
//         subjects.add(createSubject("Tiếng Anh chuyên ngành", Arrays.asList("Technical Vocabulary",
//                 "Reading Comprehension", "Grammar in Context", "Listening Skills", "Writing Reports")));
//         subjects.add(createSubject("Vật lý nguyên tử", Arrays.asList("Mẫu nguyên tử Bohr", "Cơ học lượng tử",
//                 "Hệ thống tuần hoàn", "Tia X", "Hạt nhân nguyên tử")));
//         subjects.add(createSubject("Lập trình Java", Arrays.asList("Cú pháp cơ bản", "OOP Concepts",
//                 "Collections Framework", "Exception Handling", "Multithreading")));
//         subjects.add(createSubject("Cơ sở dữ liệu",
//                 Arrays.asList("Mô hình ER", "Ngôn ngữ SQL", "Chuẩn hóa dữ liệu", "Transactions", "NoSQL Basics")));
//         subjects.add(createSubject("Mạng máy tính", Arrays.asList("Mô hình OSI", "Giao thức TCP/IP", "Địa chỉ IP",
//                 "Routing & Switching", "Network Security")));
//         subjects.add(createSubject("Kinh tế vĩ mô", Arrays.asList("Tổng cung & Tổng cầu", "Lạm phát", "Thất nghiệp",
//                 "Chính sách tài khóa", "Thị trường tiền tệ")));
//         subjects.add(createSubject("Triết học Mác-Lênin", Arrays.asList("Chủ nghĩa duy vật", "Phép biện chứng",
//                 "Lý luận nhận thức", "Hình thái kinh tế xã hội", "Ý thức xã hội")));

//         // 3. Tạo hàng trăm câu hỏi (10-15 câu mỗi chương)
//         for (Subject s : subjects) {
//             List<Chapter> chapters = chapterRepository.findBySubjectIdOrderByChapterOrder(s.getId());
//             for (Chapter c : chapters) {
//                 createRandomQuestions(s, c, 12);
//             }
//         }

//         // 4. Tạo nhiều kỳ thi mẫu với các trạng thái khác nhau
//         createVariousExams(subjects, students);

//         log.info("✅ Large sample data initialization completed!");
//     }

//     private List<User> createUsers(int studentCount) {
//         String encodedPass = passwordEncoder.encode("123456");
//         List<User> students = new ArrayList<>();

//         // Thêm một số Giáo viên
//         for (int i = 1; i <= 3; i++) {
//             String username = "teacher" + i;
//             if (!userRepository.existsByUsername(username)) {
//                 userRepository.save(User.builder()
//                         .username(username)
//                         .name("Giảng viên " + (i == 1 ? "Nguyễn Văn A" : i == 2 ? "Trần Thị B" : "Lê Văn C"))
//                         .password(encodedPass)
//                         .role(User.Role.TEACHER)
//                         .build());
//             }
//         }

//         // Thêm nhiều Thí sinh
//         for (int i = 1; i <= studentCount; i++) {
//             String username = "student" + i;
//             User student = userRepository.findByUsername(username).orElse(null);
//             if (student == null) {
//                 student = userRepository.save(User.builder()
//                         .username(username)
//                         .name("Thí sinh số " + i)
//                         .studentId("2021" + String.format("%04d", i))
//                         .password(encodedPass)
//                         .role(User.Role.STUDENT)
//                         .build());
//             }
//             students.add(student);
//         }
//         return students;
//     }

//     private Subject createSubject(String name, List<String> chapterNames) {
//         Subject subject = subjectRepository.save(Subject.builder().name(name).build());
//         for (String chapterName : chapterNames) {
//             chapterRepository.save(Chapter.builder()
//                     .subject(subject)
//                     .name(chapterName)
//                     .build());
//         }
//         return subject;
//     }

//     private void createRandomQuestions(Subject s, Chapter c, int count) {
//         for (int i = 1; i <= count; i++) {
//             Question q = Question.builder()
//                     .content(String.format("Câu hỏi số %d về nội dung: %s (Thuộc môn %s)", i, c.getName(), s.getName()))
//                     .subject(s)
//                     .chapter(c)
//                     .build();

//             List<Answer> answers = new ArrayList<>();
//             int correctIdx = random.nextInt(4);
//             for (int j = 0; j < 4; j++) {
//                 answers.add(Answer.builder()
//                         .content(j == correctIdx ? "Đáp án đúng (Phương án " + (j + 1) + ")"
//                                 : "Phương án nhiễu " + (j + 1))
//                         .isCorrect(j == correctIdx)
//                         .question(q)
//                         .build());
//             }
//             q.setAnswers(answers);
//             questionRepository.save(q);
//         }
//     }

//     private void createVariousExams(List<Subject> subjects, List<User> students) {
//         // 1. Kỳ thi sắp tới (UPCOMING)
//         createExam(subjects.get(0), "Kiểm tra định kỳ môn " + subjects.get(0).getName(), 60, 20, 4, 1, 2, students);

//         // 2. Kỳ thi đang diễn ra (ONGOING)
//         createExam(subjects.get(3), "Thi cuối kỳ " + subjects.get(3).getName(), 90, 40, 8, -1, 1, students);

//         // 3. Kỳ thi đã kết thúc (COMPLETED)
//         createExam(subjects.get(4), "Test năng lực " + subjects.get(4).getName(), 30, 15, 2, -10, -9, students);

//         // 4. Một số kỳ thi khác cho phong phú
//         for (int i = 5; i < subjects.size(); i++) {
//             createExam(subjects.get(i), "Khảo sát kiến thức: " + subjects.get(i).getName(), 45, 10, 1, i, i + 1,
//                     students);
//         }
//     }

//     private void createExam(Subject subject, String title, int duration, int totalQuestions, int variants,
//             int startOffsetHours, int endOffsetHours, List<User> students) {
//         Exam exam = Exam.builder()
//                 .title(title)
//                 .subject(subject)
//                 .duration(duration)
//                 .totalQuestions(totalQuestions)
//                 .totalVariants(variants)
//                 .startTime(LocalDateTime.now().plusHours(startOffsetHours))
//                 .endTime(LocalDateTime.now().plusHours(endOffsetHours))
//                 .build();

//         exam = examRepository.save(exam);

//         List<Chapter> chapters = chapterRepository.findBySubjectIdOrderByIdAsc(subject.getId());
//         if (!chapters.isEmpty()) {
//             int qPerChapter = totalQuestions / chapters.size();
//             int remaining = totalQuestions % chapters.size();

//             for (int i = 0; i < chapters.size(); i++) {
//                 int count = qPerChapter + (i == 0 ? remaining : 0);
//                 if (count > 0) {
//                     examChapterConfigRepository.save(ExamChapterConfig.builder()
//                             .exam(exam)
//                             .chapter(chapters.get(i))
//                             .questionCount(count)
//                             .build());
//                 }
//             }
//         }

//         // QUAN TRỌNG: Gán thí sinh vào kỳ thi thì Student mới thấy được
//         for (User student : students) {
//             participantRepository.save(com.gr1.exam.module.exam.entity.ExamParticipant.builder()
//                     .exam(exam)
//                     .user(student)
//                     .build());
//         }
//     }
// }

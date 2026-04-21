I. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

Hệ thống sử dụng hệ quản trị CSDL quan hệ PostgreSQL (thông qua Supabase).

1. Phân hệ Tài khoản & Phân quyền (Auth & Users)

Bảng users (Tài khoản người dùng)

id (PK, Serial/INT): Mã định danh tài khoản hệ thống.

username (String, Unique): Tên đăng nhập (Thường là Mã SV / Mã GV).

email (String, Unique): Email liên hệ (Ràng buộc BR-13).

password_hash (String): Mật khẩu đã mã hóa (Ràng buộc BR-14: ít nhất 8 ký tự, 1 chữ, 1 số).

role (Enum): Vai trò (STUDENT, LECTURER, ADMIN).

created_at (Timestamp): Ngày tạo tài khoản.

updated_at (Timestamp): Ngày cập nhật.

2. Phân hệ Hồ sơ Nhân sự (Profiles)

Bảng students (Hồ sơ Sinh viên)

id (PK, String 10 chars): Mã sinh viên (Student ID).

user_id (FK -> users.id): Liên kết tài khoản đăng nhập.

full_name (String): Họ và tên sinh viên.

dob (Date): Ngày sinh.

gender (Enum): Giới tính (MALE, FEMALE, OTHER).

phone (String, Nullable): Số điện thoại liên hệ.

learning_status (Enum): Trạng thái học tập (STUDYING, ON_LEAVE, GRADUATED).

gpa (Decimal 3,2, Default 0.00): Điểm trung bình tích lũy.

Bảng lecturers (Hồ sơ Giảng viên)

id (PK, String 10 chars): Mã giảng viên (Staff ID).

user_id (FK -> users.id): Liên kết tài khoản đăng nhập.

full_name (String): Họ và tên giảng viên.

department (String): Khoa trực thuộc.

3. Phân hệ Đào tạo & Môn học (Academics)

Bảng courses (Danh mục Học phần)

id (PK, String 10 chars): Mã môn học (Ví dụ: IT001).

name (String): Tên môn học.

credits (Int): Số tín chỉ (Ràng buộc: 1 - 5).

department (String): Khoa quản lý môn học.

Bảng course_sections (Lớp học phần)

id (PK, Serial/INT): Mã lớp học phần (Section ID).

course_id (FK -> courses.id): Thuộc môn học nào.

semester (String): Học kỳ (Ví dụ: Fall2026).

lecturer_id (FK -> lecturers.id): Giảng viên phụ trách.

room (String): Phòng học (Ví dụ: C.A101).

schedule (String): Lịch học (Ví dụ: Mon, 08:00-11:30).

capacity (Int): Số lượng sinh viên tối đa.

status (Enum): Trạng thái lớp (DRAFT, PUBLISHED, CLOSED).

created_at (Timestamp).

4. Phân hệ Đăng ký & Điểm số (Enrollment & Grading)

Bảng enrollments (Chi tiết Đăng ký & Kết quả)

id (PK, Serial/INT): Mã bản ghi đăng ký.

student_id (FK -> students.id): Sinh viên đăng ký.

section_id (FK -> course_sections.id): Lớp học phần đăng ký.

status (Enum): Trạng thái đăng ký (ENROLLED, WAITLISTED, DROPPED).

enrollment_date (Timestamp): Ngày thực hiện đăng ký.

process_grade (Decimal 4,1, Nullable): Điểm quá trình (10%).

midterm_grade (Decimal 4,1, Nullable): Điểm giữa kỳ (30%).

final_exam_grade (Decimal 4,1, Nullable): Điểm thi cuối kỳ (60%).

course_grade (Decimal 4,1, Nullable): Điểm tổng kết môn.

grading_status (Enum): Trạng thái điểm (PENDING, DRAFT, PUBLISHED).

II. THIẾT KẾ CÁC API CORE (APIs SPECIFICATION)

1. APIs Xác thực & Tài khoản (Authentication)

POST /api/auth/login: Đăng nhập hệ thống (Trả về JWT Token).

POST /api/admin/users: (Admin) Tạo tài khoản mới cho Sinh viên/Giảng viên (Ràng buộc BR-12).

GET /api/users/me: Lấy thông tin User profile đang đăng nhập.

2. APIs Quản lý Lớp học phần (Course Sections - UC-10)

GET /api/sections: Lấy danh sách lớp học phần (Có filter theo học kỳ, khoa, môn học).

GET /api/sections/:id: Xem chi tiết một lớp học phần.

POST /api/admin/sections: (Admin) Mở lớp học phần mới. Trạng thái mặc định là DRAFT.

PUT /api/admin/sections/:id: (Admin) Cập nhật thông tin lớp (Giảng viên, phòng, lịch học).

Logic Check: Hệ thống kiểm tra trùng lịch phòng học và trùng lịch giảng viên trước khi lưu.

PUT /api/admin/sections/:id/status: (Admin) Publish hoặc Close lớp học phần.

3. APIs Đăng ký môn học (Course Registration - UC-1)

GET /api/enrollments/available: (Student) Lấy danh sách các lớp đang mở cho phép đăng ký.

POST /api/enrollments/register: (Student) Đăng ký vào một lớp học phần.

Logic Check 1 (Học phí): Gọi sang Accounting System kiểm tra nợ học phí (BR-6). Nếu nợ -> Chặn.

Logic Check 2 (Tín chỉ): Kiểm tra tổng tín chỉ kỳ hiện tại <= 24 (BR-2).

Logic Check 3 (Tiên quyết & Thời khóa biểu): Kiểm tra đã qua môn tiên quyết (BR-1) và không trùng lịch (BR-5).

Concurrency Handle (Redis Lock): Hệ thống Request Redis Lock khóa [section_id]. Nếu lấy được lock, kiểm tra capacity, nếu còn chỗ thì insert DB, trừ seat và nhả lock (BR-3).

DELETE /api/enrollments/:id/drop: (Student) Hủy đăng ký môn học (Chỉ cho phép trong thời gian Add/Drop - BR-4).

4. APIs Nhập điểm & Học vụ (Grading - UC-7)

GET /api/sections/:id/roster: (Lecturer) Lấy danh sách sinh viên trong lớp mình phụ trách để chấm điểm.

PUT /api/sections/:id/grades: (Lecturer) Lưu nháp (Save Draft) bảng điểm.

Logic Check: Validate điểm số phải từ 0.0 đến 10.0 (BR-7).

POST /api/sections/:id/publish-grades: (Lecturer) Chốt và công bố điểm.

Side Effect: Hệ thống tự động tính course_grade = (Process * 10%) + (Midterm * 30%) + (Final * 60%) (BR-8). Đổi grading_status thành PUBLISHED. Khóa quyền sửa đổi của Giảng viên (BR-9).

GET /api/students/me/grades: (Student) Xem điểm tổng kết các kỳ. Chỉ xem được các môn có trạng thái PUBLISHED (BR-10).

5. APIs Thời khóa biểu (Timetable - UC-2)

GET /api/timetables/me: Lấy thời khóa biểu cá nhân của user đang đăng nhập (Sinh viên xem lịch học, Giảng viên xem lịch dạy - BR-11). Có tham số ?semester=Fall2026.

GET /api/timetables/me/export: Xuất thời khóa biểu ra định dạng PDF hoặc ICS.

III. SƠ ĐỒ THỰC THỂ LIÊN KẾT (ERD)

(Sơ đồ dưới đây sẽ tự động hiển thị thành hình ảnh khi đẩy lên GitHub)

erDiagram
    users ||--o| students : "1-1 (has profile)"
    users ||--o| lecturers : "1-1 (has profile)"
    
    students ||--o{ enrollments : "registers in"
    course_sections ||--o{ enrollments : "contains"
    
    courses ||--o{ course_sections : "has"
    lecturers ||--o{ course_sections : "teaches"
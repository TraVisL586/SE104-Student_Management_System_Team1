# Hệ Thống Quản Lý Sinh Viên (Student Management System) - SE104 Team 1

Đây là dự án Hệ Thống Quản Lý Sinh Viên được phát triển cho môn học SE104. Ứng dụng cung cấp các tính năng quản lý học vụ toàn diện bao gồm: quản lý thông tin sinh viên, giảng viên, môn học, đăng ký lớp học, quản lý điểm số, thanh toán học phí và xử lý các yêu cầu học vụ.

## 🏛️ Kiến Trúc Hệ Thống (Architecture)

Dự án được thiết kế theo mô hình **Client-Server** với sự phân tách độc lập giữa Frontend và Backend:

1. **Frontend (Client - ReactJS):** 
   - Là một Single Page Application (SPA).
   - Đảm nhiệm phần giao diện người dùng (UI/UX), xử lý các tương tác của người dùng.
   - Giao tiếp với Backend thông qua các RESTful API.
2. **Backend (Server - Spring Boot):** 
   - Xử lý các logic nghiệp vụ (Business Logic).
   - Quản lý xác thực và phân quyền (Authentication & Authorization) sử dụng JWT.
   - Cung cấp các RESTful API cho Frontend.
3. **Database (PostgreSQL):** 
   - Hệ quản trị cơ sở dữ liệu quan hệ lưu trữ toàn bộ dữ liệu của hệ thống.
   - Cấu trúc database (schema) và dữ liệu khởi tạo được quản lý tự động thông qua Flyway Migration.
4. **Caching (Redis):** 
   - Hỗ trợ lưu trữ tạm thời (cache) các dữ liệu thường xuyên truy vấn để tối ưu hóa hiệu suất API.

Môi trường cơ sở dữ liệu và caching được container hóa bằng **Docker Compose** để dễ dàng khởi tạo và đồng nhất giữa các môi trường phát triển.

## 🛠️ Công Nghệ Sử Dụng

### Frontend
- **Framework:** React 18, Vite
- **Styling:** Tailwind CSS, Emotion
- **Components:** Material UI (MUI), Radix UI
- **Routing:** React Router DOM
- **Khác:** Axios, React Hook Form, Recharts...

### Backend
- **Framework:** Spring Boot 3.5.0, Java 21
- **Database:** PostgreSQL
- **Caching:** Redis
- **Security:** Spring Security (JWT Authentication)
- **Migration:** Flyway
- **Tooling:** Maven, Docker & Docker Compose

---

## 📋 Yêu Cầu Cài Đặt (Prerequisites)

Trước khi chạy dự án, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:
- **[Node.js](https://nodejs.org/en/)** (Phiên bản >= 18)
- **[Java Development Kit (JDK) 21](https://jdk.java.net/21/)**
- **[Docker](https://www.docker.com/)** và **Docker Compose** (Dành cho việc chạy Database và Redis)
- **Git**

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### 1. Clone Repository

```bash
git clone <repository_url>
cd SE104-Student_Management_System_Team1
```

### 2. Chạy Backend (Spring Boot + PostgreSQL + Redis)

Di chuyển vào thư mục `backend`:
```bash
cd backend
```

**Bước 1: Cấu hình biến môi trường**
Tạo file `.env` từ file `.env.example`:
```bash
cp .env.example .env
```
*(Bạn có thể giữ nguyên cấu hình mặc định trong `.env` cho môi trường development)*

**Bước 2: Khởi chạy Database và Caching bằng Docker**
Dự án sử dụng Docker Compose để khởi tạo PostgreSQL (port 5434) và Redis (port 6379):
```bash
docker-compose up -d
```

**Bước 3: Khởi chạy Backend Application**
Sử dụng Maven Wrapper (`mvnw`) được tích hợp sẵn để chạy app:
- Trên **Windows**:
  ```cmd
  mvnw.cmd spring-boot:run
  ```
- Trên **Linux/macOS**:
  ```bash
  ./mvnw spring-boot:run
  ```

*Backend server sẽ khởi chạy tại `http://localhost:8080`.*

### 3. Kết Nối Database Với DBeaver & Nạp Dữ Liệu Mẫu

Để xem và quản lý cơ sở dữ liệu, bạn có thể sử dụng phần mềm DBeaver (hoặc pgAdmin) và kết nối với các thông số sau:
- **Host:** `localhost`
- **Port:** `5434` (Lưu ý: cổng expose ra ngoài là 5434 chứ không phải 5432)
- **Database Name:** `QLSV_db`
- **Username:** `QLSV_user`
- **Password:** `QLSV_password`

**Nạp dữ liệu mẫu (Sample Data):**
Sau khi kết nối thành công và backend đã chạy để tự động tạo các bảng, bạn có thể mở file script `backend/docs/realistic-test-data.sql` bằng DBeaver và chạy toàn bộ lệnh (Execute SQL Script) để nạp dữ liệu mẫu (sinh viên, lớp học, giảng viên...) vào cơ sở dữ liệu.

*(Mật khẩu chung cho tất cả các tài khoản sinh viên/giảng viên được tạo từ script này là `admin123456`)*

### 4. Chạy Frontend (React + Vite)

Mở một terminal mới và di chuyển vào thư mục `frontend`:
```bash
cd frontend
```

**Bước 1: Cấu hình biến môi trường**
Tạo file `.env` từ file `.env.example`:
```bash
cp .env.example .env
```

**Bước 2: Cài đặt thư viện**
Chạy lệnh sau để tải các dependencies cần thiết:
```bash
npm install
```

**Bước 3: Khởi chạy Frontend**
```bash
npm run dev
```

*Frontend sẽ chạy trên một cổng cục bộ (thường là `http://localhost:5173`). Bạn hãy mở đường dẫn hiển thị trên terminal bằng trình duyệt.*

---

## 👤 Danh Sách Tài Khoản Mẫu (Test Accounts)

Sau khi nạp dữ liệu mẫu từ file SQL (hoặc hệ thống tự khởi tạo admin mặc định), bạn có thể sử dụng các tài khoản dưới đây để đăng nhập vào hệ thống. 

Mật khẩu chung cho tất cả tài khoản mẫu là: **`admin123456`**

- **Admin:** `admin` (hoặc `admin001`)
- **Sinh viên (Student):** `student001`, `student002`, ...
- **Giảng viên (Lecturer):** `lecturer001`, `lecturer002`, ...
- **Cố vấn học tập (Advisor):** `advisor001`, `advisor002`, ...

*(Tài khoản `admin` mặc định cũng được cấu hình trong file `backend/.env` nếu bạn chạy hệ thống mà không nạp file dữ liệu mẫu).*

Chúc bạn trải nghiệm và phát triển dự án tốt! 🚀

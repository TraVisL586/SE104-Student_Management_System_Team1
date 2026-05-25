# Backend API Documentation

Last updated: 2026-05-15

Base URL for local development:

```text
http://localhost:8080
```

All protected endpoints require:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

## Roles

| Role | Scope |
| --- | --- |
| `ADMIN` | `/api/admin/**` |
| `STUDENT` | `/api/student/**` |
| `LECTURER` | `/api/lecturer/**` |
| `ACADEMIC_ADVISOR` | `/api/advisor/**` |

## Common Error Shape

```json
{
  "timestamp": "2026-05-15T08:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/admin/students",
  "fieldErrors": {
    "email": "Email is invalid"
  }
}
```

Notes:

- `400`: validation error or business rule error.
- `401`: missing or invalid token.
- `403`: token is valid but role is not allowed, or account is inactive.
- `404`: endpoint not found.
- Many business errors are currently returned as `400` with `message`.

## Important ID Notes

- `AccountResponse.id` is the `users.id`.
- `AccountResponse.profileId` is the profile id, for example `students.id`, `lecturers.id`, or `academic_advisors.id`.
- `CourseSectionRequest.lecturerId` expects the lecturer profile id, not the user id.
- Advisor assignment uses advisor profile id and student profile id.

## Enums

```text
RoleName: ADMIN, STUDENT, LECTURER, ACADEMIC_ADVISOR
StudentAcademicStatus: STUDYING, ON_LEAVE, GRADUATED, SUSPENDED
SemesterStatus: UPCOMING, ACTIVE, COMPLETED
CourseSectionStatus: DRAFT, OPEN, CLOSED, CANCELLED
EnrollmentStatus: ENROLLED, DROPPED, WAITLISTED, PASSED, FAILED
GradeStatus: DRAFT, PUBLISHED
GradeUnlockRequestStatus: PENDING, APPROVED, REJECTED
AcademicRequestType: LEAVE_OF_ABSENCE, GRADE_REVIEW, CREDIT_OVERLOAD, OTHER
AcademicRequestStatus: PENDING, APPROVED, REJECTED
TuitionStatus: PAID, OWED, PARTIAL, WAIVED
AttendanceStatus: PRESENT, ABSENT, LATE, EXCUSED
PaymentProvider: MOCK
PaymentStatus: PENDING, SUCCESS, FAILED, CANCELLED
```

## Auth

### Login

`POST /api/auth/login`

Public endpoint.

Request:

```json
{
  "username": "admin",
  "password": "admin123456"
}
```

Response:

```json
{
  "token": "<jwt>",
  "username": "admin",
  "email": "admin@example.com",
  "fullName": "Admin",
  "type": "Bearer",
  "roles": ["ADMIN"]
}
```

## Admin - Student Management

Base role: `ADMIN`

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/admin/students` | Create student account and profile |
| `GET` | `/api/admin/students` | List students |
| `GET` | `/api/admin/students/{id}` | Get student by student profile id |
| `PUT` | `/api/admin/students/{id}` | Update student |
| `PATCH` | `/api/admin/students/{id}/academic-status` | Update academic status |
| `DELETE` | `/api/admin/students/{id}` | Delete student |

Create or update student body:

```json
{
  "username": "student01",
  "password": "student123",
  "email": "student01@example.com",
  "fullName": "Student One",
  "studentCode": "SV001",
  "phone": "0900000001",
  "dateOfBirth": "2004-01-01",
  "isActive": true
}
```

Update academic status body:

```json
{
  "academicStatus": "STUDYING"
}
```

Student response:

```json
{
  "id": 1,
  "studentCode": "SV001",
  "fullName": "Student One",
  "email": "student01@example.com",
  "phone": "0900000001",
  "dateOfBirth": "2004-01-01",
  "academicStatus": "STUDYING",
  "createdAt": "2026-05-15T08:00:00",
  "username": "student01",
  "isActive": true
}
```

## Admin - Account Management

Base role: `ADMIN`

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/admin/accounts` | Create account for `STUDENT`, `LECTURER`, `ACADEMIC_ADVISOR`, or `ADMIN` |
| `GET` | `/api/admin/accounts` | List accounts |
| `GET` | `/api/admin/accounts/{id}` | Get account by user id |
| `PATCH` | `/api/admin/accounts/{id}/status` | Activate or deactivate account |
| `PATCH` | `/api/admin/accounts/{id}/password` | Reset password |

Create account body:

```json
{
  "username": "lecturer01",
  "email": "lecturer01@example.com",
  "fullName": "Lecturer One",
  "password": "lecturer123",
  "role": "LECTURER",
  "profileCode": "GV001",
  "phone": "0900000002",
  "department": "Software Engineering",
  "dateOfBirth": "1990-01-01"
}
```

Status body:

```json
{
  "isActive": false
}
```

Reset password body:

```json
{
  "newPassword": "newPassword123"
}
```

Account response:

```json
{
  "id": 2,
  "username": "lecturer01",
  "email": "lecturer01@example.com",
  "fullName": "Lecturer One",
  "isActive": true,
  "roles": ["LECTURER"],
  "profileId": 1,
  "profileType": "LECTURER",
  "profileCode": "GV001",
  "phone": "0900000002",
  "department": "Software Engineering",
  "createdAt": "2026-05-15T08:00:00"
}
```

## Student - Profile

Base role: `STUDENT`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/student/me` | Get current student profile |
| `PUT` | `/api/student/change-password` | Change current student password |

Change password body:

```json
{
  "oldPassword": "student123",
  "newPassword": "student456"
}
```

Change password response is a plain string message.

## Admin - Academic Catalog

Base role: `ADMIN`

### Departments

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/admin/catalog/departments` | Create department |
| `GET` | `/api/admin/catalog/departments` | List departments |
| `GET` | `/api/admin/catalog/departments/{id}` | Get department |
| `PUT` | `/api/admin/catalog/departments/{id}` | Update department |
| `DELETE` | `/api/admin/catalog/departments/{id}` | Delete department |

Body:

```json
{
  "code": "SE",
  "name": "Software Engineering",
  "description": "Software Engineering department"
}
```

### Programs

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/admin/catalog/programs` | Create program |
| `GET` | `/api/admin/catalog/programs` | List programs |
| `GET` | `/api/admin/catalog/programs/{id}` | Get program |
| `PUT` | `/api/admin/catalog/programs/{id}` | Update program |
| `DELETE` | `/api/admin/catalog/programs/{id}` | Delete program |

Body:

```json
{
  "departmentId": 1,
  "code": "SE-BS",
  "name": "Bachelor of Software Engineering",
  "degreeLevel": "Bachelor",
  "durationYears": 4,
  "description": "Undergraduate program"
}
```

### Courses

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/admin/catalog/courses` | Create course |
| `GET` | `/api/admin/catalog/courses` | List courses |
| `GET` | `/api/admin/catalog/courses/{id}` | Get course |
| `PUT` | `/api/admin/catalog/courses/{id}` | Update course |
| `DELETE` | `/api/admin/catalog/courses/{id}` | Delete course |

Body:

```json
{
  "departmentId": 1,
  "code": "SE101",
  "name": "Introduction to Software Engineering",
  "credits": 3,
  "periodsPerSession": 4,
  "description": "Intro course. Do not store class meeting time here.",
  "isActive": true
}
```

### Course Prerequisites

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/admin/catalog/courses/{courseId}/prerequisites` | Add prerequisite |
| `GET` | `/api/admin/catalog/courses/{courseId}/prerequisites` | List prerequisites |
| `DELETE` | `/api/admin/catalog/courses/{courseId}/prerequisites/{prerequisiteId}` | Remove prerequisite |

Body:

```json
{
  "prerequisiteCourseId": 1
}
```

## Admin - Course Section Scheduling

Base role: `ADMIN`

### Semesters

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/admin/scheduling/semesters` | Create semester |
| `GET` | `/api/admin/scheduling/semesters` | List semesters |
| `GET` | `/api/admin/scheduling/semesters/{id}` | Get semester |
| `PUT` | `/api/admin/scheduling/semesters/{id}` | Update semester |
| `DELETE` | `/api/admin/scheduling/semesters/{id}` | Delete semester |

Body:

```json
{
  "code": "2026-HK1",
  "name": "Semester 1 2026",
  "startDate": "2026-09-01",
  "endDate": "2026-12-31",
  "examStartDate": "2027-01-02",
  "examEndDate": "2027-01-15",
  "status": "UPCOMING"
}
```

### Rooms

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/admin/scheduling/rooms` | Create room |
| `GET` | `/api/admin/scheduling/rooms` | List rooms |
| `GET` | `/api/admin/scheduling/rooms/{id}` | Get room |
| `PUT` | `/api/admin/scheduling/rooms/{id}` | Update room |
| `DELETE` | `/api/admin/scheduling/rooms/{id}` | Delete room |

Body:

```json
{
  "code": "A101",
  "name": "Room A101",
  "building": "A",
  "capacity": 60,
  "isActive": true
}
```

### Course Sections

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/admin/scheduling/course-sections` | Create course section |
| `GET` | `/api/admin/scheduling/course-sections` | List course sections |
| `GET` | `/api/admin/scheduling/course-sections/{id}` | Get course section |
| `PUT` | `/api/admin/scheduling/course-sections/{id}` | Update course section |
| `DELETE` | `/api/admin/scheduling/course-sections/{id}` | Delete course section |

Body:

```json
{
  "code": "SE101-01",
  "courseId": 1,
  "lecturerId": 1,
  "semesterId": 1,
  "capacity": 60,
  "status": "OPEN"
}
```

Course section response:

```json
{
  "id": 1,
  "code": "SE101-01",
  "courseId": 1,
  "courseCode": "SE101",
  "courseName": "Introduction to Software Engineering",
  "credits": 3,
  "periodsPerSession": 4,
  "lecturerId": 1,
  "lecturerCode": "GV001",
  "lecturerName": "Lecturer One",
  "semesterId": 1,
  "semesterCode": "2026-HK1",
  "semesterName": "Semester 1 2026",
  "capacity": 60,
  "enrolledCount": 10,
  "availableSeats": 50,
  "status": "OPEN",
  "schedules": [],
  "createdAt": "2026-05-15T08:00:00"
}
```

### Course Section Schedules

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/admin/scheduling/course-sections/{sectionId}/schedules` | Add schedule to section |
| `GET` | `/api/admin/scheduling/course-sections/{sectionId}/schedules` | List schedules of section |
| `DELETE` | `/api/admin/scheduling/course-sections/{sectionId}/schedules/{scheduleId}` | Remove schedule |

Body:

```json
{
  "roomId": 1,
  "dayOfWeek": 2,
  "startPeriod": 1
}
```

`dayOfWeek` uses `1` to `7`. `startPeriod` uses `1` to `10`; backend calculates `endPeriod`, `startTime`, and `endTime` from the course's `periodsPerSession`.

## Student - Course Registration

Base role: `STUDENT`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/student/course-sections/open` | List open course sections for registration |
| `POST` | `/api/student/registrations` | Register current student into section |
| `GET` | `/api/student/registrations` | List current student's registrations |
| `DELETE` | `/api/student/registrations/{enrollmentId}` | Cancel registration |

Open course section query params:

| Param | Required | Example | Description |
| --- | --- | --- | --- |
| `semesterId` | No | `1` | Filter by semester |
| `keyword` | No | `SE101` | Search by course code, course name, or section code |

Example:

```http
GET /api/student/course-sections/open?semesterId=1&keyword=SE101
```

Frontend registration page should use this student endpoint for open sections, not the admin scheduling endpoint.

Register body:

```json
{
  "courseSectionId": 1
}
```

Enrollment response:

```json
{
  "id": 1,
  "studentId": 1,
  "studentCode": "SV001",
  "studentName": "Student One",
  "courseSectionId": 1,
  "courseSectionCode": "SE101-01",
  "courseId": 1,
  "courseCode": "SE101",
  "courseName": "Introduction to Software Engineering",
  "credits": 3,
  "semesterId": 1,
  "semesterCode": "2026-HK1",
  "semesterName": "Semester 1 2026",
  "status": "ENROLLED",
  "enrolledAt": "2026-05-15T08:00:00",
  "updatedAt": "2026-05-15T08:00:00"
}
```

## Admin - Registration Lookup

Base role: `ADMIN`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/admin/registrations` | List all enrollments |
| `GET` | `/api/admin/registrations/sections/{sectionId}` | List enrollments by section |
| `GET` | `/api/admin/registrations/students/{studentId}` | List enrollments by student |

## Tuition Status

### Admin

Base role: `ADMIN`

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/admin/tuition-records` | Create tuition record |
| `GET` | `/api/admin/tuition-records` | List tuition records |
| `GET` | `/api/admin/tuition-records/{id}` | Get tuition record |
| `GET` | `/api/admin/tuition-records/students/{studentId}` | List tuition records by student |
| `GET` | `/api/admin/tuition-records/semesters/{semesterId}` | List tuition records by semester |
| `PUT` | `/api/admin/tuition-records/{id}` | Update tuition record |
| `PATCH` | `/api/admin/tuition-records/{id}/payments` | Add payment amount |
| `DELETE` | `/api/admin/tuition-records/{id}` | Delete tuition record |

Create or update body:

```json
{
  "studentId": 1,
  "semesterId": 1,
  "totalAmount": 12000000,
  "paidAmount": 0,
  "status": "OWED",
  "dueDate": "2026-09-30",
  "note": "Semester tuition"
}
```

Notes:

- `status` is auto-calculated from `totalAmount` and `paidAmount`, except `WAIVED`.
- `OWED` and `PARTIAL` block course registration for the same semester.
- `PAID`, `WAIVED`, or missing tuition record allow course registration.
- Course registration uses Redis lock per course section. Redis must be running for `POST /api/student/registrations`.

Add payment body:

```json
{
  "amount": 12000000,
  "note": "Paid by bank transfer"
}
```

Tuition response:

```json
{
  "id": 1,
  "studentId": 1,
  "studentCode": "SV001",
  "studentName": "Student One",
  "studentEmail": "student01@example.com",
  "semesterId": 1,
  "semesterCode": "2026-HK1",
  "semesterName": "Semester 1 2026",
  "totalAmount": 12000000,
  "paidAmount": 0,
  "outstandingAmount": 12000000,
  "status": "OWED",
  "dueDate": "2026-09-30",
  "note": "Semester tuition",
  "createdAt": "2026-05-15T08:00:00",
  "updatedAt": "2026-05-15T08:00:00"
}
```

### Student

Base role: `STUDENT`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/student/tuition-records` | Current student's tuition records |
| `GET` | `/api/student/tuition-records/semesters/{semesterId}` | Current student's tuition record by semester |

## Payment Integration

Payment integration is currently a mock gateway flow for local/demo use.

Flow:

1. Student creates a pending payment transaction.
2. Frontend receives `paymentUrl` and `transactionCode`.
3. Demo gateway calls `/api/payments/mock-webhook`, or student calls the authenticated mock-confirm endpoint.
4. If payment succeeds, backend marks the transaction `SUCCESS` and updates `tuition_records.paid_amount/status`.

### Student Payments

Base role: `STUDENT`

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/student/payments` | Create pending payment |
| `GET` | `/api/student/payments` | List current student's payments |
| `GET` | `/api/student/payments/{paymentId}` | Get current student's payment |
| `POST` | `/api/student/payments/{paymentId}/mock-confirm` | Simulate payment result as current student |
| `PATCH` | `/api/student/payments/{paymentId}/cancel` | Cancel pending payment |

Create payment body:

```json
{
  "tuitionRecordId": 1,
  "amount": 5000000,
  "provider": "MOCK"
}
```

Rules:

- Student can only pay their own tuition record.
- `amount` must be greater than `0`.
- `amount` cannot exceed outstanding tuition.
- A tuition record can only have one `PENDING` payment at a time.
- `PAID` and `WAIVED` tuition records cannot create new payments.

Student mock-confirm body:

```json
{
  "success": true,
  "providerReference": "MOCK-REF-001",
  "failureReason": null
}
```

Payment response:

```json
{
  "id": 1,
  "transactionCode": "PAY-0f9e4e7a-9e56-4d2a-8f56-1a2b3c4d5e6f",
  "tuitionRecordId": 1,
  "studentId": 1,
  "studentCode": "SV001",
  "studentName": "Student One",
  "semesterId": 1,
  "semesterCode": "2026-HK1",
  "semesterName": "Semester 1 2026",
  "amount": 5000000,
  "provider": "MOCK",
  "status": "PENDING",
  "paymentUrl": "/api/payments/mock-webhook",
  "providerReference": null,
  "failureReason": null,
  "tuitionTotalAmount": 12000000,
  "tuitionPaidAmount": 0,
  "tuitionOutstandingAmount": 12000000,
  "tuitionStatus": "OWED",
  "createdAt": "2026-05-15T08:00:00",
  "completedAt": null,
  "updatedAt": "2026-05-15T08:00:00"
}
```

### Mock Webhook

Public demo endpoint.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/payments/mock-webhook` | Simulate payment provider callback |

Webhook body:

```json
{
  "transactionCode": "PAY-0f9e4e7a-9e56-4d2a-8f56-1a2b3c4d5e6f",
  "success": true,
  "providerReference": "MOCK-GATEWAY-001",
  "failureReason": null
}
```

### Admin Payments

Base role: `ADMIN`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/admin/payments` | List all payment transactions |
| `GET` | `/api/admin/payments/{paymentId}` | Get payment by id |
| `GET` | `/api/admin/payments/students/{studentId}` | List payments by student |
| `GET` | `/api/admin/payments/tuition-records/{tuitionRecordId}` | List payments by tuition record |

## Attendance And Notifications

### Lecturer - Attendance

Base role: `LECTURER`

| Method | Endpoint | Description |
| --- | --- | --- |
| `PUT` | `/api/lecturer/course-sections/{sectionId}/attendance` | Record or update attendance for a class date |
| `GET` | `/api/lecturer/course-sections/{sectionId}/attendance?date=2026-09-01` | View attendance for a class date |

Attendance body:

```json
{
  "attendanceDate": "2026-09-01",
  "records": [
    {
      "studentId": 1,
      "status": "PRESENT",
      "note": "On time"
    },
    {
      "studentId": 2,
      "status": "ABSENT",
      "note": "No notice"
    }
  ]
}
```

Notes:

- Lecturer can only record attendance for course sections they teach.
- `studentId` must belong to an `ENROLLED` student in that course section.
- Calling `PUT` again for the same `sectionId`, `studentId`, and `attendanceDate` updates the existing record.

Attendance session response:

```json
{
  "courseSectionId": 1,
  "courseSectionCode": "SE101-01",
  "courseId": 1,
  "courseCode": "SE101",
  "courseName": "Introduction to Software Engineering",
  "lecturerId": 1,
  "lecturerCode": "GV001",
  "lecturerName": "Lecturer One",
  "semesterId": 1,
  "semesterCode": "2026-HK1",
  "semesterName": "Semester 1 2026",
  "attendanceDate": "2026-09-01",
  "totalStudents": 2,
  "presentCount": 1,
  "absentCount": 1,
  "lateCount": 0,
  "excusedCount": 0,
  "records": []
}
```

### Student - Attendance

Base role: `STUDENT`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/student/attendance` | Current student's attendance records |
| `GET` | `/api/student/attendance?courseSectionId=1` | Current student's attendance records by section |

### Admin - Attendance

Base role: `ADMIN`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/admin/course-sections/{sectionId}/attendance?date=2026-09-01` | View section attendance by date |

### Lecturer - Announcements

Base role: `LECTURER`

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/lecturer/course-sections/{sectionId}/announcements` | Send class announcement to enrolled students |
| `GET` | `/api/lecturer/course-sections/{sectionId}/announcements` | List announcements for taught section |

Announcement body:

```json
{
  "title": "Midterm reminder",
  "content": "Midterm exam starts at 07:30 in room A101."
}
```

Announcement response:

```json
{
  "id": 1,
  "courseSectionId": 1,
  "courseSectionCode": "SE101-01",
  "courseId": 1,
  "courseCode": "SE101",
  "courseName": "Introduction to Software Engineering",
  "lecturerId": 1,
  "lecturerCode": "GV001",
  "lecturerName": "Lecturer One",
  "title": "Midterm reminder",
  "content": "Midterm exam starts at 07:30 in room A101.",
  "recipientCount": 2,
  "createdAt": "2026-05-15T08:00:00"
}
```

### Student - Notifications

Base role: `STUDENT`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/student/notifications` | Current student's notifications |
| `GET` | `/api/student/notifications?isRead=false` | Filter unread/read notifications |
| `PATCH` | `/api/student/notifications/{notificationId}/read` | Mark one notification as read |
| `PATCH` | `/api/student/notifications/read-all` | Mark all notifications as read |

Notification response:

```json
{
  "id": 1,
  "announcementId": 1,
  "courseSectionId": 1,
  "courseSectionCode": "SE101-01",
  "courseId": 1,
  "courseCode": "SE101",
  "courseName": "Introduction to Software Engineering",
  "lecturerId": 1,
  "lecturerCode": "GV001",
  "lecturerName": "Lecturer One",
  "title": "Midterm reminder",
  "content": "Midterm exam starts at 07:30 in room A101.",
  "isRead": false,
  "readAt": null,
  "createdAt": "2026-05-15T08:00:00"
}
```

### Admin - Announcements

Base role: `ADMIN`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/admin/course-sections/{sectionId}/announcements` | List announcements by section |

## Reports And Export

Base role: `ADMIN`

Reports return JSON for dashboards. Export endpoints return `text/csv` with `Content-Disposition: attachment`.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/admin/reports/class-fill-rates` | Course section fill-rate report |
| `GET` | `/api/admin/reports/class-fill-rates/export` | Export fill-rate report as CSV |
| `GET` | `/api/admin/reports/grade-progress` | Grade entry/publish progress by course section |
| `GET` | `/api/admin/reports/grade-progress/export` | Export grade progress report as CSV |
| `GET` | `/api/admin/reports/student-status-summary` | Count students by academic status |
| `GET` | `/api/admin/reports/student-status-summary/export` | Export student status summary as CSV |
| `GET` | `/api/admin/reports/tuition-summary` | Tuition summary grouped by tuition status |
| `GET` | `/api/admin/reports/tuition-summary/export` | Export tuition summary as CSV |
| `GET` | `/api/admin/reports/grade-status-summary` | Count grade records by grade status |

Optional query params:

| Endpoint group | Param | Example |
| --- | --- | --- |
| class fill rates | `semesterId` | `/api/admin/reports/class-fill-rates?semesterId=1` |
| grade progress | `semesterId` | `/api/admin/reports/grade-progress?semesterId=1` |
| tuition summary | `semesterId` | `/api/admin/reports/tuition-summary?semesterId=1` |

Class fill-rate response:

```json
{
  "courseSectionId": 1,
  "courseSectionCode": "SE101-01",
  "courseId": 1,
  "courseCode": "SE101",
  "courseName": "Introduction to Software Engineering",
  "lecturerId": 1,
  "lecturerCode": "GV001",
  "lecturerName": "Lecturer One",
  "semesterId": 1,
  "semesterCode": "2026-HK1",
  "semesterName": "Semester 1 2026",
  "capacity": 60,
  "enrolledCount": 30,
  "availableSeats": 30,
  "fillRatePercent": 50.00
}
```

Grade progress response:

```json
{
  "courseSectionId": 1,
  "courseSectionCode": "SE101-01",
  "courseId": 1,
  "courseCode": "SE101",
  "courseName": "Introduction to Software Engineering",
  "lecturerId": 1,
  "lecturerCode": "GV001",
  "lecturerName": "Lecturer One",
  "semesterId": 1,
  "semesterCode": "2026-HK1",
  "semesterName": "Semester 1 2026",
  "totalStudents": 30,
  "draftGrades": 10,
  "publishedGrades": 15,
  "missingGrades": 5,
  "publishRatePercent": 50.00
}
```

Tuition summary response:

```json
{
  "status": "OWED",
  "recordCount": 10,
  "totalAmount": 120000000,
  "paidAmount": 20000000,
  "outstandingAmount": 100000000
}
```

## Timetable And Roster

### Student

Base role: `STUDENT`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/student/timetable` | Current student's timetable |
| `GET` | `/api/student/course-sections/{sectionId}/roster` | Class roster if current student is enrolled |

### Lecturer

Base role: `LECTURER`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/lecturer/timetable` | Current lecturer's timetable |
| `GET` | `/api/lecturer/course-sections/{sectionId}/roster` | Class roster if lecturer teaches the section |

### Admin

Base role: `ADMIN`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/admin/timetable/students/{studentId}` | Student timetable by student profile id |
| `GET` | `/api/admin/timetable/lecturers/{lecturerId}` | Lecturer timetable by lecturer profile id |
| `GET` | `/api/admin/course-sections/{sectionId}/roster` | Class roster by section id |

Timetable entry response:

```json
{
  "courseSectionId": 1,
  "courseSectionCode": "SE101-01",
  "courseId": 1,
  "courseCode": "SE101",
  "courseName": "Introduction to Software Engineering",
  "credits": 3,
  "semesterId": 1,
  "semesterCode": "2026-HK1",
  "semesterName": "Semester 1 2026",
  "lecturerId": 1,
  "lecturerCode": "GV001",
  "lecturerName": "Lecturer One",
  "roomId": 1,
  "roomCode": "A101",
  "roomName": "Room A101",
  "building": "A",
  "dayOfWeek": 2,
  "startPeriod": 1,
  "endPeriod": 4,
  "periodsPerSession": 4,
  "startTime": "07:00",
  "endTime": "10:40"
}
```

Roster response:

```json
{
  "courseSectionId": 1,
  "courseSectionCode": "SE101-01",
  "courseId": 1,
  "courseCode": "SE101",
  "courseName": "Introduction to Software Engineering",
  "lecturerId": 1,
  "lecturerCode": "GV001",
  "lecturerName": "Lecturer One",
  "semesterId": 1,
  "semesterCode": "2026-HK1",
  "semesterName": "Semester 1 2026",
  "capacity": 60,
  "enrolledCount": 1,
  "status": "OPEN",
  "students": [
    {
      "studentId": 1,
      "studentCode": "SV001",
      "fullName": "Student One",
      "email": "student01@example.com",
      "phone": "0900000001",
      "enrollmentStatus": "ENROLLED"
    }
  ]
}
```

## Grades

### Lecturer

Base role: `LECTURER`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/lecturer/course-sections/{sectionId}/grades` | List grades for taught section |
| `PUT` | `/api/lecturer/enrollments/{enrollmentId}/grade` | Create or update draft grade |
| `PATCH` | `/api/lecturer/enrollments/{enrollmentId}/grade/publish` | Publish grade |
| `POST` | `/api/lecturer/enrollments/{enrollmentId}/grade/unlock-requests` | Request grade unlock after publish |

Grade body:

```json
{
  "processScore": 8.0,
  "midtermScore": 7.5,
  "finalScore": 9.0
}
```

Unlock request body:

```json
{
  "reason": "Need to correct final score"
}
```

### Student

Base role: `STUDENT`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/student/grades` | Current student's published grades |
| `GET` | `/api/student/grades/{enrollmentId}` | Current student's published grade by enrollment |

### Admin

Base role: `ADMIN`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/admin/grade-unlock-requests` | List grade unlock requests |
| `PATCH` | `/api/admin/grade-unlock-requests/{requestId}/decision` | Approve or reject unlock request |
| `GET` | `/api/admin/audit-logs` | List audit logs |

Grade unlock request query params:

| Param | Required | Example |
| --- | --- | --- |
| `status` | No | `PENDING` |

Decision body:

```json
{
  "approved": true,
  "reviewerNote": "Approved for correction"
}
```

Grade response:

```json
{
  "id": 1,
  "enrollmentId": 1,
  "studentId": 1,
  "studentCode": "SV001",
  "studentName": "Student One",
  "courseSectionId": 1,
  "courseSectionCode": "SE101-01",
  "courseId": 1,
  "courseCode": "SE101",
  "courseName": "Introduction to Software Engineering",
  "processScore": 8.0,
  "midtermScore": 7.5,
  "finalScore": 9.0,
  "totalScore": 8.4,
  "status": "PUBLISHED",
  "publishedAt": "2026-05-15T08:00:00",
  "updatedAt": "2026-05-15T08:00:00"
}
```

## Academic Advising And Requests

### Admin - Advisor Assignment

Base role: `ADMIN`

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/admin/advisor-students` | Assign advisor to student |
| `DELETE` | `/api/admin/advisors/{advisorId}/students/{studentId}` | Remove advisor assignment |

Assignment body:

```json
{
  "advisorId": 1,
  "studentId": 1
}
```

### Advisor

Base role: `ACADEMIC_ADVISOR`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/advisor/students` | List assigned students |
| `GET` | `/api/advisor/students/{studentId}/profile` | View advising profile |
| `GET` | `/api/advisor/academic-requests` | List assigned students' academic requests |
| `PATCH` | `/api/advisor/academic-requests/{requestId}/decision` | Approve or reject request |

Academic requests query params:

| Param | Required | Example |
| --- | --- | --- |
| `status` | No | `PENDING` |

Decision body:

```json
{
  "approved": true,
  "advisorNote": "Approved"
}
```

Student advising profile response:

```json
{
  "studentId": 1,
  "studentCode": "SV001",
  "fullName": "Student One",
  "email": "student01@example.com",
  "phone": "0900000001",
  "academicStatus": "STUDYING",
  "passedCredits": 30,
  "gpa": 8.2,
  "failedCourses": 0
}
```

### Student - Academic Requests

Base role: `STUDENT`

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/student/academic-requests` | Create academic request |
| `GET` | `/api/student/academic-requests` | List current student's requests |

Create body:

```json
{
  "type": "LEAVE_OF_ABSENCE",
  "title": "Leave request",
  "content": "I want to request a leave of absence for this semester.",
  "attachmentUrl": "https://example.com/file.pdf"
}
```

Academic request response:

```json
{
  "id": 1,
  "studentId": 1,
  "studentCode": "SV001",
  "studentName": "Student One",
  "advisorId": 1,
  "advisorCode": "CVHT001",
  "advisorName": "Advisor One",
  "type": "LEAVE_OF_ABSENCE",
  "title": "Leave request",
  "content": "I want to request a leave of absence for this semester.",
  "attachmentUrl": "https://example.com/file.pdf",
  "status": "PENDING",
  "advisorNote": null,
  "createdAt": "2026-05-15T08:00:00",
  "reviewedAt": null
}
```

## Frontend Testing Checklist

1. Login with each role and save its token.
2. Use `roles` from login response to route the user to the correct screen.
3. Use `/api/student/course-sections/open` for the student registration catalog.
4. Use `availableSeats` and `schedules` from `CourseSectionResponse` on registration screens.
5. Use profile ids from account responses when creating course sections or advisor assignments.
6. Expect `403` when using the wrong role token.
7. Expect `400` with `fieldErrors` for invalid request bodies.

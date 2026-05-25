-- LOCAL TEST DATA RESET SCRIPT
-- Run after Flyway has created the schema.
-- This script deletes existing application data and recreates a realistic data set.
-- Total user accounts: 200
-- Password for every account in this file: admin123456
--
-- Account samples:
-- admin / admin123456
-- student001 / admin123456
-- lecturer001 / admin123456
-- advisor001 / admin123456

BEGIN;

TRUNCATE TABLE
    public.notifications,
    public.class_announcements,
    public.attendances,
    public.payment_transactions,
    public.tuition_records,
    public.academic_requests,
    public.advisor_students,
    public.grade_unlock_requests,
    public.enrollment_grades,
    public.enrollments,
    public.course_section_schedules,
    public.course_sections,
    public.course_prerequisites,
    public.courses,
    public.programs,
    public.rooms,
    public.semesters,
    public.academic_advisors,
    public.lecturers,
    public.students,
    public.user_roles,
    public.role_permissions,
    public.permissions,
    public.users,
    public.roles,
    public.departments,
    public.audit_logs
RESTART IDENTITY CASCADE;

INSERT INTO public.roles (name, description, created_at)
VALUES
    ('ADMIN', 'System admin', now()),
    ('STUDENT', 'Student role', now()),
    ('LECTURER', 'Lecturer role', now()),
    ('ACADEMIC_ADVISOR', 'Academic advisor role', now());

INSERT INTO public.permissions (name, description)
VALUES
    ('VIEW_STUDENT', 'View student information'),
    ('CREATE_STUDENT', 'Create student profile'),
    ('UPDATE_STUDENT', 'Update student profile'),
    ('DELETE_STUDENT', 'Deactivate student profile'),
    ('CHANGE_PASSWORD', 'Change account password');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'ADMIN';

-- BCrypt hash for password: admin123456
INSERT INTO public.users (username, email, password_hash, full_name, is_active, created_at, updated_at)
VALUES (
    'admin',
    'admin@example.com',
    '$2a$12$BXHGyvXpkRgKH5iZ9ES9sOUmLnFmI.byKSD9b2QORp4SdlTdbfbQq',
    'Quan tri he thong',
    true,
    now(),
    now()
);

INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM public.users u
JOIN public.roles r ON r.name = 'ADMIN'
WHERE u.username = 'admin';

INSERT INTO public.departments (code, name, description, created_at)
VALUES
    ('SE', 'Khoa Cong nghe phan mem', 'Dao tao ky su phan mem va quan ly du an phan mem', now()),
    ('IS', 'Khoa He thong thong tin', 'Dao tao he thong thong tin va phan tich du lieu', now()),
    ('CS', 'Khoa Khoa hoc may tinh', 'Dao tao nen tang khoa hoc may tinh va tri tue nhan tao', now()),
    ('NT', 'Khoa Mang may tinh va Truyen thong', 'Dao tao mang may tinh, dien toan dam may va he thong phan tan', now()),
    ('AT', 'Khoa An toan thong tin', 'Dao tao bao mat he thong va an toan ung dung', now());

INSERT INTO public.users (username, email, password_hash, full_name, is_active, created_at, updated_at)
SELECT
    concat('student', lpad(gs::text, 3, '0')),
    concat('student', lpad(gs::text, 3, '0'), '@student.uit.edu.vn'),
    '$2a$12$BXHGyvXpkRgKH5iZ9ES9sOUmLnFmI.byKSD9b2QORp4SdlTdbfbQq',
    concat(
        (ARRAY['Nguyen','Tran','Le','Pham','Hoang','Huynh','Phan','Vu','Vo','Dang','Bui','Do','Ho','Ngo','Duong','Ly'])[((gs - 1) % 16) + 1],
        ' ',
        (ARRAY['Van','Thi','Minh','Gia','Thanh','Quoc','Duc','Ngoc','Anh','Bao','Nhat','Hoai'])[((gs - 1) % 12) + 1],
        ' ',
        (ARRAY['An','Binh','Chau','Dung','Giang','Hieu','Khang','Linh','Long','Mai','Nam','Phuc','Quan','Son','Thao','Trang','Tuan','Vy','Yen','Khoa'])[((gs - 1) % 20) + 1]
    ),
    true,
    now(),
    now()
FROM generate_series(1, 160) gs;

INSERT INTO public.users (username, email, password_hash, full_name, is_active, created_at, updated_at)
SELECT
    concat('lecturer', lpad(gs::text, 3, '0')),
    concat('lecturer', lpad(gs::text, 3, '0'), '@uit.edu.vn'),
    '$2a$12$BXHGyvXpkRgKH5iZ9ES9sOUmLnFmI.byKSD9b2QORp4SdlTdbfbQq',
    concat(
        CASE WHEN gs % 3 = 0 THEN 'PGS. TS. ' WHEN gs % 2 = 0 THEN 'TS. ' ELSE 'ThS. ' END,
        (ARRAY['Nguyen','Tran','Le','Pham','Hoang','Huynh','Phan','Vu','Vo','Dang','Bui','Do'])[((gs - 1) % 12) + 1],
        ' ',
        (ARRAY['Thanh','Minh','Quang','Duc','Anh','Ngoc','Bao','Hoai'])[((gs - 1) % 8) + 1],
        ' ',
        (ARRAY['Hung','Hai','Huy','Kien','Lam','Nhan','Phong','Son','Thinh','Tuan','Viet','Khoa'])[((gs - 1) % 12) + 1]
    ),
    true,
    now(),
    now()
FROM generate_series(1, 24) gs;

INSERT INTO public.users (username, email, password_hash, full_name, is_active, created_at, updated_at)
SELECT
    concat('advisor', lpad(gs::text, 3, '0')),
    concat('advisor', lpad(gs::text, 3, '0'), '@uit.edu.vn'),
    '$2a$12$BXHGyvXpkRgKH5iZ9ES9sOUmLnFmI.byKSD9b2QORp4SdlTdbfbQq',
    concat(
        (ARRAY['Nguyen','Tran','Le','Pham','Hoang','Huynh','Phan','Vu','Vo','Dang','Bui','Do','Ho','Ngo','Duong'])[((gs - 1) % 15) + 1],
        ' ',
        (ARRAY['Thi','Ngoc','Thanh','Minh','Hoai','Bao','Anh'])[((gs - 1) % 7) + 1],
        ' ',
        (ARRAY['Lan','Huong','Mai','Trang','Thao','Vy','Yen','Ha','Linh','Nhi'])[((gs - 1) % 10) + 1]
    ),
    true,
    now(),
    now()
FROM generate_series(1, 15) gs;

INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM public.users u
JOIN public.roles r ON r.name = 'STUDENT'
WHERE u.username LIKE 'student%';

INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM public.users u
JOIN public.roles r ON r.name = 'LECTURER'
WHERE u.username LIKE 'lecturer%';

INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM public.users u
JOIN public.roles r ON r.name = 'ACADEMIC_ADVISOR'
WHERE u.username LIKE 'advisor%';

INSERT INTO public.students (user_id, student_code, full_name, email, phone, date_of_birth, academic_status, created_at)
SELECT
    u.id,
    concat('SV2026', lpad(gs::text, 3, '0')),
    u.full_name,
    u.email,
    concat('09', lpad((10000000 + gs)::text, 8, '0')),
    DATE '2004-01-01' + (gs % 900),
    CASE
        WHEN gs % 67 = 0 THEN 'GRADUATED'
        WHEN gs % 53 = 0 THEN 'SUSPENDED'
        WHEN gs % 41 = 0 THEN 'ON_LEAVE'
        ELSE 'STUDYING'
    END,
    now()
FROM generate_series(1, 160) gs
JOIN public.users u ON u.username = concat('student', lpad(gs::text, 3, '0'));

INSERT INTO public.lecturers (user_id, lecturer_code, full_name, email, phone, department, created_at)
SELECT
    u.id,
    concat('GV', lpad(gs::text, 3, '0')),
    u.full_name,
    u.email,
    concat('08', lpad((20000000 + gs)::text, 8, '0')),
    (ARRAY[
        'Khoa Cong nghe phan mem',
        'Khoa He thong thong tin',
        'Khoa Khoa hoc may tinh',
        'Khoa Mang may tinh va Truyen thong',
        'Khoa An toan thong tin'
    ])[((gs - 1) % 5) + 1],
    now()
FROM generate_series(1, 24) gs
JOIN public.users u ON u.username = concat('lecturer', lpad(gs::text, 3, '0'));

INSERT INTO public.academic_advisors (user_id, advisor_code, full_name, email, phone, department, created_at)
SELECT
    u.id,
    concat('CVHT', lpad(gs::text, 3, '0')),
    u.full_name,
    u.email,
    concat('08', lpad((30000000 + gs)::text, 8, '0')),
    (ARRAY[
        'Khoa Cong nghe phan mem',
        'Khoa He thong thong tin',
        'Khoa Khoa hoc may tinh',
        'Khoa Mang may tinh va Truyen thong',
        'Khoa An toan thong tin'
    ])[((gs - 1) % 5) + 1],
    now()
FROM generate_series(1, 15) gs
JOIN public.users u ON u.username = concat('advisor', lpad(gs::text, 3, '0'));

INSERT INTO public.programs (department_id, code, name, degree_level, duration_years, description, created_at)
SELECT d.id, v.code, v.name, 'Dai hoc', 4, v.description, now()
FROM (
    VALUES
        ('SE', 'KTPM', 'Ky thuat phan mem', 'Chuong trinh dao tao ky su phan mem'),
        ('IS', 'HTTT', 'He thong thong tin', 'Chuong trinh dao tao cu nhan he thong thong tin'),
        ('CS', 'KHMT', 'Khoa hoc may tinh', 'Chuong trinh dao tao khoa hoc may tinh'),
        ('NT', 'MMT', 'Mang may tinh va truyen thong du lieu', 'Chuong trinh dao tao mang va he thong phan tan'),
        ('AT', 'ATTT', 'An toan thong tin', 'Chuong trinh dao tao an toan thong tin')
) AS v(department_code, code, name, description)
JOIN public.departments d ON d.code = v.department_code;

INSERT INTO public.courses (department_id, code, name, credits, description, is_active, created_at)
SELECT d.id, v.course_code, v.course_name, v.credits, v.description, true, now()
FROM (
    VALUES
        ('SE','SE101','Nhap mon Cong nghe phan mem',3,'Tong quan quy trinh phat trien phan mem'),
        ('SE','SE102','Lap trinh huong doi tuong',4,'Lap trinh Java va thiet ke lop'),
        ('SE','SE201','Cau truc du lieu va giai thuat',4,'Danh sach, cay, do thi va giai thuat co ban'),
        ('SE','SE202','Phan tich thiet ke he thong',3,'Mo hinh hoa yeu cau va thiet ke he thong'),
        ('SE','SE301','Thiet ke phan mem',3,'Mau thiet ke va kien truc ung dung'),
        ('SE','SE302','Kiem thu phan mem',3,'Kiem thu don vi, tich hop va he thong'),
        ('SE','SE303','Quan ly du an phan mem',3,'Lap ke hoach, tien do va quan tri rui ro'),
        ('SE','SE401','Kien truc phan mem',3,'Kien truc he thong quy mo lon'),
        ('IS','IS101','Co so du lieu',4,'Mo hinh quan he va SQL'),
        ('IS','IS102','He quan tri co so du lieu',3,'Quan tri PostgreSQL va toi uu truy van'),
        ('IS','IS201','Phan tich du lieu',3,'Tien xu ly va phan tich du lieu'),
        ('IS','IS202','Kho du lieu',3,'Data warehouse va ETL'),
        ('IS','IS301','He thong thong tin quan ly',3,'Ung dung CNTT trong quan tri doanh nghiep'),
        ('IS','IS302','Khai pha du lieu',3,'Phat hien tri thuc tu du lieu'),
        ('IS','IS401','He thong ERP',3,'Hoach dinh nguon luc doanh nghiep'),
        ('IS','IS402','Tri tue kinh doanh',3,'Bao cao va dashboard phan tich'),
        ('CS','CS101','Nhap mon lap trinh',4,'Tu duy lap trinh va ngon ngu C'),
        ('CS','CS102','Toan roi rac',3,'Logic, tap hop, quan he va do thi'),
        ('CS','CS201','Kien truc may tinh',3,'Bo xu ly, bo nho va I/O'),
        ('CS','CS202','He dieu hanh',4,'Tien trinh, bo nho va he thong tap tin'),
        ('CS','CS301','Tri tue nhan tao',3,'Tim kiem, suy dien va hoc may co ban'),
        ('CS','CS302','May hoc',3,'Mo hinh hoc co giam sat va khong giam sat'),
        ('CS','CS401','Xu ly ngon ngu tu nhien',3,'Bieu dien van ban va mo hinh ngon ngu'),
        ('CS','CS402','Thi giac may tinh',3,'Xu ly anh va nhan dang doi tuong'),
        ('NT','NT101','Mang may tinh',4,'TCP/IP, dinh tuyen va chuyen mach'),
        ('NT','NT102','Truyen du lieu',3,'Tin hieu, kenh truyen va ma hoa du lieu'),
        ('NT','NT201','Quan tri mang',3,'Cau hinh va van hanh ha tang mang'),
        ('NT','NT202','Dien toan dam may',3,'Dich vu cloud va trien khai ung dung'),
        ('NT','NT301','Internet van vat',3,'Cam bien, gateway va nen tang IoT'),
        ('NT','NT302','He thong phan tan',3,'Dong bo, nhat quan va kha dung'),
        ('NT','NT401','DevOps',3,'CI/CD, container va quan ly ha tang'),
        ('NT','NT402','Ao hoa he thong',3,'May ao, container va orchestration'),
        ('AT','AT101','Nhap mon An toan thong tin',3,'Tong quan bao mat he thong thong tin'),
        ('AT','AT102','Mat ma hoc',3,'Ma hoa doi xung, bat doi xung va chu ky so'),
        ('AT','AT201','Bao mat ung dung web',3,'OWASP va phong chong tan cong web'),
        ('AT','AT202','Phap chung so',3,'Thu thap va phan tich chung cu so'),
        ('AT','AT301','Kiem thu xam nhap',3,'Danh gia lo hong va khai thac co kiem soat'),
        ('AT','AT302','Quan tri an toan he thong',3,'Chinh sach, giam sat va ung cuu su co'),
        ('AT','AT401','An toan mang',3,'Tuong lua, IDS/IPS va giam sat mang'),
        ('AT','AT402','Quan ly rui ro an toan thong tin',3,'Danh gia rui ro va tuan thu an toan')
) AS v(department_code, course_code, course_name, credits, description)
JOIN public.departments d ON d.code = v.department_code;

INSERT INTO public.course_prerequisites (course_id, prerequisite_course_id)
SELECT c.id, p.id
FROM (
    VALUES
        ('SE201','SE102'), ('SE202','SE101'), ('SE301','SE202'), ('SE302','SE201'),
        ('SE303','SE202'), ('SE401','SE301'), ('IS102','IS101'), ('IS201','IS101'),
        ('IS202','IS102'), ('IS302','IS201'), ('IS401','IS301'), ('IS402','IS202'),
        ('CS202','CS201'), ('CS301','CS102'), ('CS302','CS301'), ('CS401','CS302'),
        ('CS402','CS302'), ('NT201','NT101'), ('NT202','NT101'), ('NT302','NT202'),
        ('NT401','NT202'), ('AT102','AT101'), ('AT201','AT101'), ('AT301','AT201'),
        ('AT401','AT101'), ('AT402','AT302')
) AS v(course_code, prerequisite_code)
JOIN public.courses c ON c.code = v.course_code
JOIN public.courses p ON p.code = v.prerequisite_code
ON CONFLICT DO NOTHING;

INSERT INTO public.semesters (code, name, start_date, end_date, exam_start_date, exam_end_date, status, created_at)
VALUES
    ('2024-HK1', 'Hoc ky 1 nam hoc 2024', DATE '2024-02-01', DATE '2024-06-15', DATE '2024-06-20', DATE '2024-07-05', 'COMPLETED', now()),
    ('2024-HK2', 'Hoc ky 2 nam hoc 2024', DATE '2024-09-01', DATE '2024-12-31', DATE '2025-01-05', DATE '2025-01-20', 'COMPLETED', now()),
    ('2025-HK1', 'Hoc ky 1 nam hoc 2025', DATE '2025-02-01', DATE '2025-06-15', DATE '2025-06-20', DATE '2025-07-05', 'COMPLETED', now()),
    ('2025-HK2', 'Hoc ky 2 nam hoc 2025', DATE '2025-09-01', DATE '2025-12-31', DATE '2026-01-05', DATE '2026-01-20', 'COMPLETED', now()),
    ('2026-HK1', 'Hoc ky 1 nam hoc 2026', DATE '2026-02-01', DATE '2026-06-15', DATE '2026-06-20', DATE '2026-07-05', 'ACTIVE', now()),
    ('2026-HK2', 'Hoc ky 2 nam hoc 2026', DATE '2026-09-01', DATE '2026-12-31', DATE '2027-01-05', DATE '2027-01-20', 'UPCOMING', now());

INSERT INTO public.rooms (code, name, building, capacity, is_active, created_at)
SELECT
    concat(chr(65 + (((gs - 1) / 6)::int)), lpad((((gs - 1) % 6) + 1)::text, 3, '0')),
    concat('Phong ', chr(65 + (((gs - 1) / 6)::int)), lpad((((gs - 1) % 6) + 1)::text, 3, '0')),
    concat('Toa ', chr(65 + (((gs - 1) / 6)::int))),
    50 + ((gs % 4) * 10),
    true,
    now()
FROM generate_series(1, 30) gs;

WITH numbered_courses AS (
    SELECT
        c.id,
        c.code,
        row_number() OVER (ORDER BY c.code) AS course_no
    FROM public.courses c
)
INSERT INTO public.course_sections (code, course_id, lecturer_id, semester_id, capacity, enrolled_count, status, created_at)
SELECT
    concat(nc.code, '.', section_group, '-2026HK1'),
    nc.id,
    l.id,
    s.id,
    CASE WHEN section_group = 1 THEN 60 ELSE 55 END,
    0,
    CASE WHEN nc.course_no % 13 = 0 THEN 'CLOSED' ELSE 'OPEN' END,
    now()
FROM numbered_courses nc
CROSS JOIN generate_series(1, 2) section_group
JOIN public.lecturers l ON l.lecturer_code = concat('GV', lpad(((nc.course_no + section_group - 2) % 24 + 1)::text, 3, '0'))
JOIN public.semesters s ON s.code = '2026-HK1';

WITH numbered_courses AS (
    SELECT
        c.id,
        c.code,
        row_number() OVER (ORDER BY c.code) AS course_no
    FROM public.courses c
),
completed_semesters AS (
    SELECT
        s.id,
        s.code,
        row_number() OVER (ORDER BY s.code) AS semester_no
    FROM public.semesters s
    WHERE s.code IN ('2024-HK2', '2025-HK1', '2025-HK2')
)
INSERT INTO public.course_sections (code, course_id, lecturer_id, semester_id, capacity, enrolled_count, status, created_at)
SELECT
    concat(nc.code, '.1-', replace(cs.code, '-', '')),
    nc.id,
    l.id,
    cs.id,
    70,
    0,
    'CLOSED',
    now()
FROM numbered_courses nc
JOIN completed_semesters cs ON true
JOIN public.lecturers l ON l.lecturer_code = concat('GV', lpad(((nc.course_no + cs.semester_no + 8) % 24 + 1)::text, 3, '0'));

WITH numbered_courses AS (
    SELECT
        c.id,
        c.code,
        row_number() OVER (ORDER BY c.code) AS course_no
    FROM public.courses c
)
INSERT INTO public.course_sections (code, course_id, lecturer_id, semester_id, capacity, enrolled_count, status, created_at)
SELECT
    concat(nc.code, '.1-2026HK2'),
    nc.id,
    l.id,
    s.id,
    60,
    0,
    'DRAFT',
    now()
FROM numbered_courses nc
JOIN public.lecturers l ON l.lecturer_code = concat('GV', lpad(((nc.course_no + 11) % 24 + 1)::text, 3, '0'))
JOIN public.semesters s ON s.code = '2026-HK2';

WITH numbered_sections AS (
    SELECT
        cs.id,
        cs.code,
        cs.lecturer_id,
        row_number() OVER (ORDER BY sem.code, cs.code) AS rn,
        row_number() OVER (PARTITION BY cs.lecturer_id ORDER BY sem.code, cs.code) AS lecturer_rn
    FROM public.course_sections cs
    JOIN public.semesters sem ON sem.id = cs.semester_id
)
INSERT INTO public.course_section_schedules (course_section_id, room_id, day_of_week, start_time, end_time)
SELECT
    ns.id,
    r.id,
    ((ns.rn - 1) % 6) + 2,
    (TIME '07:30' + ((((ns.rn - 1) / 6) % 4) * INTERVAL '150 minutes'))::time,
    (TIME '09:30' + ((((ns.rn - 1) / 6) % 4) * INTERVAL '150 minutes'))::time
FROM numbered_sections ns
JOIN public.rooms r ON r.code = concat(
    chr(65 + ((((ns.rn - 1) % 30) / 6)::int)),
    lpad(((((ns.rn - 1) % 30) % 6) + 1)::text, 3, '0')
);

WITH four_credit_sections AS (
    SELECT
        cs.id,
        cs.code,
        cs.lecturer_id,
        row_number() OVER (ORDER BY sem.code, cs.code) AS rn,
        row_number() OVER (PARTITION BY cs.lecturer_id ORDER BY sem.code, cs.code) AS lecturer_rn
    FROM public.course_sections cs
    JOIN public.courses c ON c.id = cs.course_id
    JOIN public.semesters sem ON sem.id = cs.semester_id
    WHERE c.credits = 4
)
INSERT INTO public.course_section_schedules (course_section_id, room_id, day_of_week, start_time, end_time)
SELECT
    fs.id,
    r.id,
    ((fs.rn + 2) % 6) + 2,
    (TIME '13:00' + (((fs.rn % 2) * 150) * INTERVAL '1 minute'))::time,
    (TIME '15:00' + (((fs.rn % 2) * 150) * INTERVAL '1 minute'))::time
FROM four_credit_sections fs
JOIN public.rooms r ON r.code = concat(
    chr(65 + ((((fs.rn + 7) % 30) / 6)::int)),
    lpad(((((fs.rn + 7) % 30) % 6) + 1)::text, 3, '0')
);

WITH student_seed AS (
    SELECT
        st.id,
        st.academic_status,
        substring(st.student_code from 7)::int AS student_no
    FROM public.students st
    WHERE st.student_code LIKE 'SV2026%'
),
numbered_courses AS (
    SELECT
        c.id,
        c.code,
        c.credits,
        row_number() OVER (ORDER BY c.code) AS course_no
    FROM public.courses c
),
active_sections AS (
    SELECT
        cs.id,
        nc.course_no,
        split_part(split_part(cs.code, '-', 1), '.', 2)::int AS section_group
    FROM public.course_sections cs
    JOIN public.courses c ON c.id = cs.course_id
    JOIN numbered_courses nc ON nc.id = c.id
    JOIN public.semesters s ON s.id = cs.semester_id
    WHERE s.code = '2026-HK1'
      AND cs.status = 'OPEN'
),
planned_active_enrollments AS (
    SELECT
        ss.id AS student_id,
        ac.id AS course_section_id
    FROM student_seed ss
    CROSS JOIN generate_series(0, 5) slot_no
    JOIN active_sections ac
        ON ac.course_no = (((ss.student_no + (slot_no * 7) - 1) % 40) + 1)
       AND ac.section_group = ((slot_no % 2) + 1)
    WHERE ss.academic_status = 'STUDYING'
)
INSERT INTO public.enrollments (student_id, course_section_id, status, enrolled_at, updated_at)
SELECT student_id, course_section_id, 'ENROLLED', now(), now()
FROM planned_active_enrollments;

WITH student_seed AS (
    SELECT
        st.id,
        substring(st.student_code from 7)::int AS student_no
    FROM public.students st
    WHERE st.student_code LIKE 'SV2026%'
),
completed_semesters AS (
    SELECT
        s.id,
        s.code,
        row_number() OVER (ORDER BY s.code) AS semester_no
    FROM public.semesters s
    WHERE s.code IN ('2024-HK2', '2025-HK1', '2025-HK2')
),
numbered_courses AS (
    SELECT
        c.id,
        row_number() OVER (ORDER BY c.code) AS course_no
    FROM public.courses c
),
past_sections AS (
    SELECT
        cs.id,
        cs.semester_id,
        nc.course_no
    FROM public.course_sections cs
    JOIN public.courses c ON c.id = cs.course_id
    JOIN numbered_courses nc ON nc.id = c.id
    JOIN completed_semesters sem ON sem.id = cs.semester_id
),
planned_past_enrollments AS (
    SELECT
        ss.id AS student_id,
        ps.id AS course_section_id,
        CASE WHEN ((ss.student_no + ps.course_no + sem.semester_no) % 7) = 0 THEN 'FAILED' ELSE 'PASSED' END AS status
    FROM student_seed ss
    CROSS JOIN completed_semesters sem
    CROSS JOIN generate_series(0, 3) slot_no
    JOIN past_sections ps
        ON ps.semester_id = sem.id
       AND ps.course_no = (((ss.student_no + (slot_no * 9) + (sem.semester_no * 5) - 1) % 40) + 1)
)
INSERT INTO public.enrollments (student_id, course_section_id, status, enrolled_at, updated_at)
SELECT student_id, course_section_id, status, now() - INTERVAL '180 days', now()
FROM planned_past_enrollments;

UPDATE public.course_sections cs
SET enrolled_count = COALESCE((
    SELECT COUNT(*)
    FROM public.enrollments e
    WHERE e.course_section_id = cs.id
      AND e.status IN ('ENROLLED', 'PASSED', 'FAILED')
), 0);

WITH grade_seed AS (
    SELECT
        e.id AS enrollment_id,
        e.status AS enrollment_status,
        CASE WHEN e.status = 'FAILED' THEN 4.0 ELSE 7.0 + ((e.id % 4) * 0.5) END AS process_score,
        CASE WHEN e.status = 'FAILED' THEN 4.5 ELSE 7.0 + ((e.id % 3) * 0.6) END AS midterm_score,
        CASE WHEN e.status = 'FAILED' THEN 4.0 ELSE 7.0 + ((e.id % 5) * 0.4) END AS final_score
    FROM public.enrollments e
    WHERE e.status IN ('PASSED', 'FAILED')
)
INSERT INTO public.enrollment_grades (
    enrollment_id,
    process_score,
    midterm_score,
    final_score,
    total_score,
    status,
    published_at,
    created_at,
    updated_at
)
SELECT
    enrollment_id,
    process_score,
    midterm_score,
    final_score,
    round((process_score::numeric * 0.1) + (midterm_score::numeric * 0.3) + (final_score::numeric * 0.6), 1),
    'PUBLISHED',
    now() - INTERVAL '120 days',
    now(),
    now()
FROM grade_seed;

INSERT INTO public.enrollment_grades (
    enrollment_id,
    process_score,
    midterm_score,
    final_score,
    total_score,
    status,
    published_at,
    created_at,
    updated_at
)
SELECT
    e.id,
    round((6.0 + ((e.id % 4) * 0.7))::numeric, 1),
    round((6.0 + ((e.id % 3) * 0.8))::numeric, 1),
    NULL,
    NULL,
    'DRAFT',
    NULL,
    now(),
    now()
FROM public.enrollments e
WHERE e.status = 'ENROLLED'
  AND e.id % 5 = 0;

INSERT INTO public.grade_unlock_requests (grade_id, lecturer_id, reason, status, reviewer_note, created_at, reviewed_at)
SELECT
    g.id,
    cs.lecturer_id,
    'Can dieu chinh diem sau khi doi chieu bai thi',
    CASE WHEN g.id % 3 = 0 THEN 'APPROVED' WHEN g.id % 3 = 1 THEN 'REJECTED' ELSE 'PENDING' END,
    CASE WHEN g.id % 3 = 2 THEN NULL ELSE 'Da xem xet theo minh chung diem' END,
    now() - INTERVAL '7 days',
    CASE WHEN g.id % 3 = 2 THEN NULL ELSE now() - INTERVAL '3 days' END
FROM public.enrollment_grades g
JOIN public.enrollments e ON e.id = g.enrollment_id
JOIN public.course_sections cs ON cs.id = e.course_section_id
WHERE g.status = 'PUBLISHED'
  AND g.id % 19 = 0;

INSERT INTO public.advisor_students (advisor_id, student_id, assigned_at)
SELECT
    a.id,
    st.id,
    now()
FROM public.students st
JOIN public.academic_advisors a
    ON a.advisor_code = concat('CVHT', lpad(((substring(st.student_code from 7)::int - 1) % 15 + 1)::text, 3, '0'));

INSERT INTO public.academic_requests (
    student_id,
    advisor_id,
    type,
    title,
    content,
    attachment_url,
    status,
    advisor_note,
    created_at,
    reviewed_at
)
SELECT
    st.id,
    a.id,
    CASE
        WHEN substring(st.student_code from 7)::int % 3 = 0 THEN 'LEAVE_OF_ABSENCE'
        WHEN substring(st.student_code from 7)::int % 3 = 1 THEN 'CREDIT_OVERLOAD'
        ELSE 'GRADE_REVIEW'
    END,
    CASE
        WHEN substring(st.student_code from 7)::int % 3 = 0 THEN 'Xin nghi hoc tam thoi'
        WHEN substring(st.student_code from 7)::int % 3 = 1 THEN 'De nghi dang ky vuot so tin chi'
        ELSE 'De nghi phuc khao diem'
    END,
    CASE
        WHEN substring(st.student_code from 7)::int % 3 = 0 THEN 'Sinh vien xin nghi hoc tam thoi vi ly do ca nhan va se bo sung minh chung khi can.'
        WHEN substring(st.student_code from 7)::int % 3 = 1 THEN 'Sinh vien co nhu cau dang ky vuot so tin chi trong hoc ky hien tai.'
        ELSE 'Sinh vien de nghi co van ho tro quy trinh phuc khao diem mon hoc.'
    END,
    NULL,
    CASE
        WHEN substring(st.student_code from 7)::int % 4 = 0 THEN 'APPROVED'
        WHEN substring(st.student_code from 7)::int % 4 = 1 THEN 'REJECTED'
        ELSE 'PENDING'
    END,
    CASE
        WHEN substring(st.student_code from 7)::int % 4 = 0 THEN 'Dong y theo quy dinh cua khoa.'
        WHEN substring(st.student_code from 7)::int % 4 = 1 THEN 'Chua du dieu kien de xu ly.'
        ELSE NULL
    END,
    now() - ((substring(st.student_code from 7)::int % 30) || ' days')::interval,
    CASE
        WHEN substring(st.student_code from 7)::int % 4 IN (0, 1)
            THEN now() - ((substring(st.student_code from 7)::int % 10) || ' days')::interval
        ELSE NULL
    END
FROM public.students st
JOIN public.advisor_students ast ON ast.student_id = st.id
JOIN public.academic_advisors a ON a.id = ast.advisor_id
WHERE substring(st.student_code from 7)::int % 2 = 0;

INSERT INTO public.tuition_records (
    student_id,
    semester_id,
    total_amount,
    paid_amount,
    status,
    due_date,
    note,
    created_at,
    updated_at
)
SELECT
    st.id,
    se.id,
    CASE WHEN se.code = '2026-HK2' THEN 0 ELSE 6500000 END,
    CASE
        WHEN se.code = '2026-HK2' THEN 0
        WHEN substring(st.student_code from 7)::int % 4 = 1 THEN 6500000
        WHEN substring(st.student_code from 7)::int % 4 = 2 THEN 3000000
        ELSE 0
    END,
    CASE
        WHEN se.code = '2026-HK2' THEN 'WAIVED'
        WHEN substring(st.student_code from 7)::int % 4 = 1 THEN 'PAID'
        WHEN substring(st.student_code from 7)::int % 4 = 2 THEN 'PARTIAL'
        WHEN substring(st.student_code from 7)::int % 4 = 3 THEN 'OWED'
        ELSE 'WAIVED'
    END,
    CASE WHEN se.code = '2026-HK2' THEN DATE '2026-10-30' ELSE DATE '2026-05-30' END,
    concat('Hoc phi ', se.name),
    now(),
    now()
FROM public.students st
JOIN public.semesters se ON se.code IN ('2025-HK2', '2026-HK1', '2026-HK2');

INSERT INTO public.payment_transactions (
    transaction_code,
    tuition_record_id,
    student_id,
    amount,
    provider,
    status,
    payment_url,
    provider_reference,
    failure_reason,
    created_at,
    completed_at,
    updated_at
)
SELECT
    concat('PAY-', st.student_code, '-', se.code, '-SUCCESS'),
    tr.id,
    st.id,
    tr.paid_amount,
    'MOCK',
    'SUCCESS',
    '/api/payments/mock-webhook',
    concat('BANK-', st.student_code, '-', se.code, '-SUCCESS'),
    NULL,
    now() - INTERVAL '12 days',
    now() - INTERVAL '12 days',
    now()
FROM public.tuition_records tr
JOIN public.students st ON st.id = tr.student_id
JOIN public.semesters se ON se.id = tr.semester_id
WHERE tr.paid_amount > 0;

INSERT INTO public.payment_transactions (
    transaction_code,
    tuition_record_id,
    student_id,
    amount,
    provider,
    status,
    payment_url,
    provider_reference,
    failure_reason,
    created_at,
    completed_at,
    updated_at
)
SELECT
    concat('PAY-', st.student_code, '-', se.code, '-FAILED'),
    tr.id,
    st.id,
    1000000,
    'MOCK',
    'FAILED',
    '/api/payments/mock-webhook',
    concat('BANK-', st.student_code, '-', se.code, '-FAILED'),
    'Giao dich bi tu choi boi ngan hang',
    now() - INTERVAL '5 days',
    now() - INTERVAL '5 days',
    now()
FROM public.tuition_records tr
JOIN public.students st ON st.id = tr.student_id
JOIN public.semesters se ON se.id = tr.semester_id
WHERE substring(st.student_code from 7)::int % 10 = 0
  AND se.code = '2026-HK1';

INSERT INTO public.payment_transactions (
    transaction_code,
    tuition_record_id,
    student_id,
    amount,
    provider,
    status,
    payment_url,
    provider_reference,
    failure_reason,
    created_at,
    completed_at,
    updated_at
)
SELECT
    concat('PAY-', st.student_code, '-', se.code, '-PENDING'),
    tr.id,
    st.id,
    1500000,
    'MOCK',
    'PENDING',
    '/api/payments/mock-webhook',
    NULL,
    NULL,
    now() - INTERVAL '1 day',
    NULL,
    now()
FROM public.tuition_records tr
JOIN public.students st ON st.id = tr.student_id
JOIN public.semesters se ON se.id = tr.semester_id
WHERE tr.status IN ('OWED', 'PARTIAL')
  AND se.code = '2026-HK1'
  AND substring(st.student_code from 7)::int % 13 = 0;

INSERT INTO public.attendances (
    course_section_id,
    student_id,
    attendance_date,
    status,
    note,
    recorded_by_user_id,
    created_at,
    updated_at
)
SELECT
    cs.id,
    st.id,
    d.attendance_date,
    CASE
        WHEN (substring(st.student_code from 7)::int + extract(day from d.attendance_date)::int) % 8 = 0 THEN 'ABSENT'
        WHEN (substring(st.student_code from 7)::int + extract(day from d.attendance_date)::int) % 8 = 1 THEN 'LATE'
        WHEN (substring(st.student_code from 7)::int + extract(day from d.attendance_date)::int) % 8 = 2 THEN 'EXCUSED'
        ELSE 'PRESENT'
    END,
    'Ghi nhan diem danh tren lop',
    l.user_id,
    now(),
    now()
FROM public.enrollments e
JOIN public.students st ON st.id = e.student_id
JOIN public.course_sections cs ON cs.id = e.course_section_id
JOIN public.lecturers l ON l.id = cs.lecturer_id
CROSS JOIN (
    VALUES
        (DATE '2026-02-12'),
        (DATE '2026-02-19'),
        (DATE '2026-02-26'),
        (DATE '2026-03-05'),
        (DATE '2026-03-12'),
        (DATE '2026-03-19'),
        (DATE '2026-03-26'),
        (DATE '2026-04-02')
) d(attendance_date)
WHERE e.status = 'ENROLLED';

INSERT INTO public.class_announcements (course_section_id, lecturer_id, title, content, created_at)
SELECT
    cs.id,
    cs.lecturer_id,
    concat('Thong bao lich hoc ', cs.code),
    concat('Lop ', cs.code, ' hoc theo thoi khoa bieu da cong bo. Sinh vien theo doi tai lieu tren he thong.'),
    now() - INTERVAL '7 days'
FROM public.course_sections cs
JOIN public.semesters s ON s.id = cs.semester_id
WHERE s.code = '2026-HK1';

INSERT INTO public.class_announcements (course_section_id, lecturer_id, title, content, created_at)
SELECT
    cs.id,
    cs.lecturer_id,
    concat('Nhac lich kiem tra ', cs.code),
    concat('Lop ', cs.code, ' se co bai kiem tra qua trinh trong buoi hoc tiep theo.'),
    now() - INTERVAL '2 days'
FROM public.course_sections cs
JOIN public.semesters s ON s.id = cs.semester_id
WHERE s.code = '2026-HK1'
  AND cs.status = 'OPEN';

INSERT INTO public.notifications (
    recipient_user_id,
    announcement_id,
    title,
    content,
    is_read,
    read_at,
    created_at
)
SELECT
    st.user_id,
    ca.id,
    ca.title,
    ca.content,
    false,
    NULL,
    ca.created_at
FROM public.class_announcements ca
JOIN public.course_sections cs ON cs.id = ca.course_section_id
JOIN public.enrollments e ON e.course_section_id = cs.id AND e.status = 'ENROLLED'
JOIN public.students st ON st.id = e.student_id;

UPDATE public.notifications
SET is_read = true,
    read_at = now() - INTERVAL '1 day'
WHERE id % 3 = 0;

INSERT INTO public.audit_logs (actor_username, action, target_type, target_id, details, created_at)
VALUES
    ('admin', 'SEED_REALISTIC_TEST_DATA', 'DATABASE', NULL, 'Tao du lieu kiem thu day du cho web', now()),
    ('admin', 'CREATE_ACCOUNTS', 'USER', NULL, 'Tao 200 tai khoan kiem thu', now()),
    ('admin', 'CREATE_COURSE_SECTIONS', 'COURSE_SECTION', NULL, 'Tao lop hoc phan va lich hoc kiem thu', now());

COMMIT;

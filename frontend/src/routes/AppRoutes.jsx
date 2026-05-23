import { useRole } from '../context/RoleContext';

/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layout
import Layout from '../layouts/Layout';

// Auth / Public
import Login from "../pages/public/Login";
import ForgotPassword from '../pages/public/ForgotPassword';

// Error
import NotFound from '../pages/error/NotFound';
import Unauthorized from '../pages/error/Unauthorized';

// Guards
import ProtectedRoute from '../components/ProtectedRoute';

// ── Admin ──────────────────────────────────────────────────────────────────
import AdminDashboard from '../pages/admin/AdminDashboard';
import CourseSections from '../pages/admin/CourseSections';
import CurriculumMgmt from '../pages/admin/CurriculumMgmt';
import DepartmentManagement from '../pages/admin/DepartmentManagement';
import ProgramManagement from '../pages/admin/ProgramManagement';
import CourseManagement from '../pages/admin/CourseManagement';
import TimetableManager from '../pages/admin/TimetableManager';
import StudentManagement from '../pages/admin/StudentManagement';
import AccountManagement from '../pages/admin/AccountManagement';
import { SystemLogs } from '../pages/admin/SystemLogs';
import AdminReports from '../pages/admin/AdminReports';
import TuitionManagement from '../pages/admin/TuitionManagement';
import GradeUnlockRequests from '../pages/admin/GradeUnlockRequests';

// ── Advisor ──────────────────────────────────────────────────────────────────
import AdvisorDashboard from '../pages/advisor/AdvisorDashboard'
import StudentProfiles from '../pages/advisor/StudentProfiles';
import RequestProcessing from '../pages/advisor/RequestProcessing';

// ── Lecturer ───────────────────────────────────────────────────────────────
import LecturerDashboard from '../pages/lecturer/LecturerDashboard';
import GradeEntry from '../pages/lecturer/GradeEntry';
import Attendance from '../pages/lecturer/Attendance';
import Communications from '../pages/lecturer/Communications';
import ClassRoster from '../pages/lecturer/ClassRoster';
import LecturerTimetable from '../pages/lecturer/LecturerTimetable';

// ── Student ────────────────────────────────────────────────────────────────
import StudentDashboard from '../pages/student/StudentDashboard';
import Registrations from '../pages/student/Registrations';
import StudentTimetable from '../pages/student/StudentTimetable';
import Grades from '../pages/student/Grades';
import TuitionFees from '../pages/student/TuitionFees';
import PaymentHistory from '../pages/student/PaymentHistory';
import AcademicRequests from '../pages/student/AcademicRequests';
import Notifications from '../pages/student/Notifications';

// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_ROLES = ['ADMIN', 'ACADEMIC_ADMIN'];
const ADVISOR_ROLES = ['ADMIN', 'ACADEMIC_ADVISOR'];

const RootRedirect = () => {
  const { isAuthenticated, role } = useRole();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const rolePaths = {
      STUDENT: "/student/dashboard",
      LECTURER: "/lecturer/dashboard",
      ADMIN: "/admin/dashboard",
      ACADEMIC_ADVISOR: "/advisor/dashboard"
    };
  return <Navigate to={rolePaths[role] || "/login"} replace />;
};

const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  // ── Public (no layout) ────────────────────────────────────────────────────
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/unauthorized',
    element: <Unauthorized />,
  },

  // ── Protected (with MainLayout) ───────────────────────────────────────────
  {
    element: <Layout />,
    children: [

         // ── DASHBOARD (public landing, visible to all logged-in users) ────────
                  {
                    path: '/dashboard',
                    element: <AdminDashboard />,
                  },

      // ── STUDENT ─────────────────────────────────────────────────────────
      {
        path: '/student',
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/student/dashboard',
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/student/registrations',
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <Registrations />
          </ProtectedRoute>
        ),
      },
      {
        path: '/student/timetable',
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentTimetable />
          </ProtectedRoute>
        ),
      },
      {
        path: '/student/grades',
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <Grades />
          </ProtectedRoute>
        ),
      },
      {
        path: '/student/fees',
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <TuitionFees />
          </ProtectedRoute>
        ),
      },
      {
        path: '/student/payments',
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <PaymentHistory />
          </ProtectedRoute>
        ),
      },
      {
        path: '/student/requests',
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <AcademicRequests />
          </ProtectedRoute>
        ),
      },
      {
        path: '/student/notifications',
        element: (
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <Notifications />
          </ProtectedRoute>
        ),
      },

      // ── LECTURER ────────────────────────────────────────────────────────
      {
        path: '/lecturer',
        element: (
          <ProtectedRoute allowedRoles={['LECTURER']}>
            <LecturerDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/lecturer/dashboard',
        element: (
          <ProtectedRoute allowedRoles={['LECTURER']}>
            <LecturerDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/lecturer/grades',
        element: (
          <ProtectedRoute allowedRoles={['LECTURER']}>
            <GradeEntry />
          </ProtectedRoute>
        ),
      },
      {
        path: '/lecturer/attendance',
        element: (
          <ProtectedRoute allowedRoles={['LECTURER']}>
            <Attendance />
          </ProtectedRoute>
        ),
      },
      {
        path: '/lecturer/communications',
        element: (
          <ProtectedRoute allowedRoles={['LECTURER']}>
            <Communications />
          </ProtectedRoute>
        ),
      },
      {
        path: '/lecturer/roster',
        element: (
          <ProtectedRoute allowedRoles={['LECTURER']}>
            <ClassRoster />
          </ProtectedRoute>
        ),
      },
      {
        path: '/lecturer/timetable',
        element: (
          <ProtectedRoute allowedRoles={['LECTURER']}>
            <LecturerTimetable />
          </ProtectedRoute>
        ),
      },

      // ── ACADEMIC ADMIN / IT ADMIN ────────────────────────────────────────
      {
        path: '/admin',
        element: (
          <ProtectedRoute allowedRoles={ADMIN_ROLES}>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/dashboard',
        element: (
          <ProtectedRoute allowedRoles={ADMIN_ROLES}>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/courses',
        element: (
          <ProtectedRoute allowedRoles={ADMIN_ROLES}>
            <CourseSections />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/timetable-manager',
        element: (
          <ProtectedRoute allowedRoles={ADMIN_ROLES}>
            <TimetableManager />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/curriculum',
        element: (
          <ProtectedRoute allowedRoles={ADMIN_ROLES}>
            <CurriculumMgmt />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/departments',
        element: (
          <ProtectedRoute allowedRoles={ADMIN_ROLES}>
            <DepartmentManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/programs',
        element: (
          <ProtectedRoute allowedRoles={ADMIN_ROLES}>
            <ProgramManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/catalog-courses',
        element: (
          <ProtectedRoute allowedRoles={ADMIN_ROLES}>
            <CourseManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/student-status',
        element: (
          <ProtectedRoute allowedRoles={ADMIN_ROLES}>
            <StudentManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/logs',
        element: (
          <ProtectedRoute allowedRoles={ADMIN_ROLES}>
            <SystemLogs />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/reports',
        element: (
          <ProtectedRoute allowedRoles={ADMIN_ROLES}>
            <AdminReports />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/tuition',
        element: (
          <ProtectedRoute allowedRoles={ADMIN_ROLES}>
            <TuitionManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/grade-unlocks',
        element: (
          <ProtectedRoute allowedRoles={ADMIN_ROLES}>
            <GradeUnlockRequests />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/accounts',
        element: (
          <ProtectedRoute allowedRoles={ADMIN_ROLES}>
            <AccountManagement />
          </ProtectedRoute>
        ),
      },

      // ── ACADEMIC ADVISOR (+ Admin có thể truy cập) ───────────────────────
      {
        path: '/advisor',
        element: (
          <ProtectedRoute allowedRoles={ADVISOR_ROLES}>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/advisor/dashboard', // <--- THÊM DÒNG NÀY
        element: (
          <ProtectedRoute allowedRoles={ADVISOR_ROLES}>
            <AdvisorDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/advisor/profiles',
        element: (
          <ProtectedRoute allowedRoles={ADVISOR_ROLES}>
            <StudentProfiles />
          </ProtectedRoute>
        ),
      },
      {
        path: '/advisor/requests',
        element: (
          <ProtectedRoute allowedRoles={ADVISOR_ROLES}>
            <RequestProcessing />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // ── 404 ───────────────────────────────────────────────────────────────────
  {
    path: '*',
    element: <NotFound />,
  },
]);

export default appRouter;

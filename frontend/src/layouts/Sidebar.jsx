import { NavLink, useLocation, useNavigate } from "react-router-dom";

import {
  LayoutDashboard, BookOpen, Calendar, Award, CreditCard, FileText,
  Users, ClipboardList, GraduationCap, X, ChevronRight,
  Shield, UserCheck, CheckSquare, MessageSquare, BookMarked,
  CalendarRange, UserCog, LogOut,Building2,
  BarChart3, UnlockKeyhole,
} from "lucide-react";
import { useRole } from "../context/RoleContext";

const NAV_BY_ROLE = {
  STUDENT: [
    { path: "/student/dashboard",                    label: "Bảng điều khiển",  icon: LayoutDashboard },
    { path: "/student/registrations",label: "Đăng ký môn học",  icon: BookOpen },
    { path: "/student/timetable",   label: "Thời khóa biểu",   icon: Calendar },
    { path: "/student/grades",      label: "Bảng điểm",         icon: Award },
    { path: "/student/fees",        label: "Học phí",            icon: CreditCard },
    { path: "/student/requests",    label: "Yêu cầu học vụ",    icon: FileText },
  ],
  LECTURER: [
    { path: "/lecturer/dashboard",                       label: "Bảng điều khiển",  icon: LayoutDashboard },
    { path: "/lecturer/roster",        label: "Danh sách lớp",    icon: Users },
    { path: "/lecturer/grades",        label: "Nhập điểm",         icon: Award },
    { path: "/lecturer/attendance",    label: "Điểm danh",         icon: CheckSquare },
    { path: "/lecturer/communications", label: "Thông báo & Liên lạc", icon: MessageSquare },
    { path: "/lecturer/timetable",     label: "Lịch giảng dạy",   icon: CalendarRange },
  ],
  ADMIN: [
    { path: "/admin/dashboard",              label: "Bảng điều khiển",              icon: LayoutDashboard },
    { path: "/admin/student-status",     label: "Quản lý Sinh viên",           icon: Users },
    { path: "/admin/accounts",               label: "Quản lý Tài khoản",           icon: UserCog },
    { path: "/admin/departments",            label: "Quản lý Khoa",           icon: Building2 },
    { path: "/admin/programs",               label: "Quản lý Chương trình",        icon: GraduationCap },
    { path: "/admin/catalog-courses",        label: "Quản lý Môn học",             icon: BookOpen },
    { path: "/admin/curriculum",             label: "Quản lý Tiên quyết",          icon: BookMarked },
    { path: "/admin/courses",                label: "Quản lý Lớp học phần",        icon: ClipboardList },
    { path: "/admin/timetable-manager",      label: "Quản lý Lịch học",            icon: Calendar },
    { path: "/admin/tuition",                label: "Quản lý Công nợ",             icon: CreditCard },
    { path: "/admin/grade-unlocks",          label: "Mở khóa điểm",                icon: UnlockKeyhole },
    { path: "/admin/reports",                label: "Báo cáo thống kê",            icon: BarChart3 },
    { path: "/admin/logs",                   label: "Nhật ký điểm & học vụ",       icon: FileText },
  ],
  ACADEMIC_ADVISOR: [
    { path: "/advisor/dashboard",                     label: "Bảng điều khiển",   icon: LayoutDashboard },
    { path: "/advisor/profiles",     label: "Hồ sơ Sinh viên",   icon: UserCheck },
    { path: "/advisor/requests",     label: "Xử lý Yêu cầu",    icon: ClipboardList },
  ],
  PUBLIC: [
    { path: "/login", label: "Đăng nhập", icon: GraduationCap },
  ],
};

const ROLE_LABELS = {
  STUDENT:  "Sinh viên",
  LECTURER: "Giảng viên",
  ADMIN:    "Quản trị Đào tạo",
  ACADEMIC_ADVISOR:  "Cố vấn Học tập",
  PUBLIC:   "Công khai",
};

const ROLE_COLORS = {
  STUDENT:  { bg: "#1a3461", color: "#2563eb", light: "#dbeafe" },
  LECTURER: { bg: "#5b21b6", color: "#8b5cf6", light: "#ede9fe" },
  ADMIN:    { bg: "#065f46", color: "#10b981", light: "#d1fae5" },
  ACADEMIC_ADVISOR:  { bg: "#92400e", color: "#f59e0b", light: "#fef3c7" },
  PUBLIC:   { bg: "#334155", color: "#64748b", light: "#f1f5f9" },
};

const SECTION_LABEL = {
  STUDENT  :  "Menu Sinh viên",
  LECTURER: "Menu Giảng viên",
  ADMIN:    "Menu Quản trị",
  ACADEMIC_ADVISOR:  "Menu Cố vấn",
  PUBLIC:   "Công khai",
};

export function Sidebar({ open, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useRole();

  const role = user?.role ?? "PUBLIC";
  const navItems = NAV_BY_ROLE[role] ?? [];
  const roleColor = ROLE_COLORS[role];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full z-30 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ width: 260, backgroundColor: "#1a3461", flexShrink: 0 }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-between px-5 py-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-xl"
              style={{ width: 40, height: 40, backgroundColor: "#2563eb" }}
            >
              <GraduationCap size={22} color="white" />
            </div>
            <div>
              <p style={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}>EduPortal</p>
              <p style={{ color: "#94a3b8", fontSize: "0.68rem" }}>Hệ thống QLSV</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden"
            style={{ color: "rgba(255,255,255,0.5)", background: "none", border: "none", cursor: "pointer" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div
            className="flex items-center gap-2.5 rounded-xl px-3 py-2"
            style={{ backgroundColor: `${roleColor.color}20` }}
          >
            <Shield size={14} color={roleColor.color} />
            <div>
              <p style={{ fontSize: "0.62rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Vai trò hiện tại
              </p>
              <p style={{ fontSize: "0.78rem", color: roleColor.color, fontWeight: 700 }}>
                {ROLE_LABELS[role]}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <p
            className="px-5 mb-2 uppercase tracking-widest"
            style={{ color: "#475569", fontSize: "0.58rem" }}
          >
            {SECTION_LABEL[role]}
          </p>
          <ul className="space-y-0.5 px-3">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive =
                path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
              return (
                <li key={path}>
                  <NavLink
                    to={path}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                    style={
                      isActive
                        ? {
                            backgroundColor: roleColor.color,
                            color: "white",
                            boxShadow: `0 4px 14px ${roleColor.color}40`,
                          }
                        : { color: "#94a3b8" }
                    }
                  >
                    <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                    <span style={{ fontSize: "0.84rem", fontWeight: isActive ? 600 : 400 }}>
                      {label}
                    </span>
                    {isActive && (
                      <ChevronRight size={13} style={{ marginLeft: "auto", opacity: 0.7 }} />
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Semester + Logout */}
        <div className="px-4 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div
            className="rounded-xl px-4 py-3 mb-3"
            style={{ backgroundColor: "#0f2040" }}
          >
            <p style={{ color: "#94a3b8", fontSize: "0.68rem" }}>Năm học</p>
            <p style={{ color: "white", fontSize: "0.82rem", fontWeight: 600 }}>2025 / 2026</p>
            <div
              className="mt-2 rounded-full overflow-hidden"
              style={{ height: 4, backgroundColor: "#1e3a6e" }}
            >
              <div
                style={{
                  width: "65%",
                  height: "100%",
                  backgroundColor: roleColor.color,
                  borderRadius: 9999,
                }}
              />
            </div>
            <p style={{ color: "#475569", fontSize: "0.65rem", marginTop: 3 }}>
              Học kỳ 2 — Tuần 18/28
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5"
            style={{
              fontSize: "0.8rem",
              color: "#94a3b8",
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "none",
              cursor: "pointer",
            }}
          >
            <LogOut size={15} />
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
}

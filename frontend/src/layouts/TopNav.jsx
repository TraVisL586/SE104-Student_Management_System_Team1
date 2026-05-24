import { useState, useRef, useEffect } from "react";
import { 
  Bell, Search, Menu, ChevronDown, User, LogOut, Settings, Shield,
  BookOpen, Users, Globe, UserCheck, Award, Calendar, CreditCard,
  FileText, ClipboardList, CheckSquare, MessageSquare, CalendarRange,
  BookMarked, FolderOpen, AlertTriangle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRole } from "../context/RoleContext";
import { useToast } from "../context/ToastContext";
import studentService from "../services/studentService";
import courseRegistrationService from "../services/courseRegistrationService";
import adminStudentService from "../services/adminStudentService";
import adminCatalogService from "../services/adminCatalogService";
import advisorService from "../services/advisorService";
import lecturerService from "../services/lecturerService";
import ProfileSettingsModal from "../components/ProfileSettingsModal";

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

const SWITCH_ROLES = [
  { role: "STUDENT",  label: "Sinh viên",         icon: BookOpen },
  { role: "LECTURER", label: "Giảng viên",         icon: Users },
  { role: "ADMIN",    label: "Quản trị Đào tạo",   icon: Shield },
  { role: "ACADEMIC_ADVISOR",  label: "Cố vấn Học tập",     icon: UserCheck },
  { role: "PUBLIC",   label: "Công khai",           icon: Globe },
];



const removeDiacritics = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
};

const getCourseCode = (course) => course?.code || course?.courseCode || "";
const getCourseName = (course) => course?.name || course?.courseName || getCourseCode(course);
const getCourseCredits = (course) => course?.credits || course?.courseCredits || 0;

const getStudentCode = (student) => student?.studentCode || student?.code || "";
const getStudentName = (student) => student?.fullName || student?.studentName || student?.name || "Sinh viên";
const getStudentEmail = (student) => student?.email || "";
const getStudentMeta = (student) =>
  student?.departmentName ||
  student?.department ||
  student?.programName ||
  student?.programCode ||
  student?.academicStatus ||
  "Thông tin sinh viên";

const getIconComponent = (name) => {
  const icons = {
    Bell, Search, Menu, ChevronDown, User, LogOut, Settings, Shield, BookOpen, Users, Globe, UserCheck,
    Award, Calendar, CreditCard, FileText, ClipboardList, CheckSquare, MessageSquare, CalendarRange, 
    BookMarked, FolderOpen, AlertTriangle
  };
  return icons[name] || Globe;
};

const FUNCTION_ITEMS = [
  // Student items
  { roles: ["STUDENT"], title: "Xem điểm / Bảng điểm", keywords: ["diem", "bang diem", "xem diem", "coi diem", "grades", "score"], path: "/student/grades", iconName: "Award" },
  { roles: ["STUDENT"], title: "Đăng ký môn học", keywords: ["dang ky mon", "dang ky hoc phan", "dkmh", "registrations", "mon hoc", "hoc phan"], path: "/student/registrations", iconName: "BookOpen" },
  { roles: ["STUDENT"], title: "Thời khóa biểu", keywords: ["thoi khoa bieu", "tkb", "lich hoc", "timetable", "calendar"], path: "/student/timetable", iconName: "Calendar" },
  { roles: ["STUDENT"], title: "Học phí & Lệ phí", keywords: ["hoc phi", "dong tien", "nap tien", "so du", "fees", "tuition", "le phi"], path: "/student/fees", iconName: "CreditCard" },
  { roles: ["STUDENT"], title: "Yêu cầu học vụ / Xin nghỉ học", keywords: ["yeu cau", "xin nghi", "nghi hoc", "don tu", "requests"], path: "/student/requests", iconName: "FileText" },
  { roles: ["STUDENT"], title: "Hồ sơ cá nhân", keywords: ["thong tin ca nhan", "ho so", "ca nhan", "profile", "thong tin"], actionType: "profile", iconName: "User" },
  { roles: ["STUDENT"], title: "Cài đặt tài khoản", keywords: ["cai dat", "mat khau", "settings", "password"], actionType: "settings", iconName: "Settings" },
  { roles: ["STUDENT"], title: "Bảo mật", keywords: ["bao mat", "security", "mat khau"], actionType: "security", iconName: "Shield" },

  // Lecturer items
  { roles: ["LECTURER"], title: "Danh sách lớp học", keywords: ["lop hoc", "danh sach lop", "roster", "class"], path: "/lecturer/roster", iconName: "Users" },
  { roles: ["LECTURER"], title: "Nhập điểm sinh viên", keywords: ["nhap diem", "diem", "grades", "score"], path: "/lecturer/grades", iconName: "Award" },
  { roles: ["LECTURER"], title: "Điểm danh lớp học", keywords: ["diem danh", "attendance"], path: "/lecturer/attendance", iconName: "CheckSquare" },
  { roles: ["LECTURER"], title: "Thông báo & Liên lạc", keywords: ["thong bao", "lien lac", "communications", "announcements"], path: "/lecturer/communications", iconName: "MessageSquare" },
  { roles: ["LECTURER"], title: "Lịch giảng dạy", keywords: ["lich day", "lich giang day", "timetable", "calendar"], path: "/lecturer/timetable", iconName: "CalendarRange" },
  { roles: ["LECTURER"], title: "Hồ sơ cá nhân", keywords: ["thong tin ca nhan", "ho so", "ca nhan", "profile", "thong tin"], actionType: "profile", iconName: "User" },
  { roles: ["LECTURER"], title: "Cài đặt tài khoản", keywords: ["cai dat", "mat khau", "settings", "password"], actionType: "settings", iconName: "Settings" },

  // Admin items
  { roles: ["ADMIN"], title: "Quản lý Lớp học phần", keywords: ["lop hoc phan", "mon hoc", "courses", "quan ly lop"], path: "/admin/courses", iconName: "BookMarked" },
  { roles: ["ADMIN"], title: "Quản lý Chương trình học", keywords: ["chuong trinh", "khung dao tao", "curriculum", "quan ly chuong trinh"], path: "/admin/curriculum", iconName: "FolderOpen" },
  { roles: ["ADMIN"], title: "Trạng thái Sinh viên / Kỷ luật", keywords: ["trang thai", "thoi hoc", "khen thuong", "student status", "ky luat"], path: "/admin/student-status", iconName: "AlertTriangle" },
  { roles: ["ADMIN"], title: "Quản lý Thời khóa biểu", keywords: ["thoi khoa bieu", "timetable manager", "xep lich"], path: "/admin/timetable-manager", iconName: "CalendarRange" },
  { roles: ["ADMIN"], title: "Nhật ký hệ thống", keywords: ["nhat ky", "logs", "system logs"], path: "/admin/logs", iconName: "Settings" },
  { roles: ["ADMIN"], title: "Hồ sơ cá nhân", keywords: ["thong tin ca nhan", "ho so", "ca nhan", "profile", "thong tin"], actionType: "profile", iconName: "User" },

  // Advisor items
  { roles: ["ACADEMIC_ADVISOR"], title: "Hồ sơ Sinh viên phụ trách", keywords: ["ho so", "sinh vien", "profiles", "quan ly sinh vien"], path: "/advisor/profiles", iconName: "UserCheck" },
  { roles: ["ACADEMIC_ADVISOR"], title: "Xử lý Yêu cầu học vụ", keywords: ["yeu cau", "requests", "duyet don"], path: "/advisor/requests", iconName: "ClipboardList" },
  { roles: ["ACADEMIC_ADVISOR"], title: "Hồ sơ cá nhân", keywords: ["thong tin ca nhan", "ho so", "ca nhan", "profile", "thong tin"], actionType: "profile", iconName: "User" },
];

const MOCK_COURSES = [
  { code: "CSC301", name: "Cơ sở dữ liệu", credits: 4, departmentName: "Khoa CNTT" },
  { code: "CSC302", name: "Phát triển ứng dụng Web", credits: 3, departmentName: "Khoa CNTT" },
  { code: "CSC303", name: "Trí tuệ nhân tạo", credits: 3, departmentName: "Khoa CNTT" },
  { code: "MAT101", name: "Giải tích 1", credits: 3, departmentName: "Khoa Toán" },
  { code: "MAT102", name: "Đại số tuyến tính", credits: 3, departmentName: "Khoa Toán" },
  { code: "PHY101", name: "Vật lý đại cương", credits: 4, departmentName: "Khoa Vật lý" },
  { code: "ENG101", name: "Tiếng Anh chuyên ngành", credits: 2, departmentName: "Khoa Ngoại ngữ" }
];

const MOCK_STUDENTS = [
  { studentCode: "SV.2023.00847", name: "Nguyễn Thị Lan", email: "lan.nguyen@student.edu.vn", department: "Khoa CNTT", programCode: "CNTT_CLC" },
  { studentCode: "SV.2023.00124", name: "Trần Minh Hoàng", email: "hoang.tran@student.edu.vn", department: "Khoa CNTT", programCode: "CNTT_DA" },
  { studentCode: "SV.2023.00412", name: "Phạm Thanh Thảo", email: "thao.pham@student.edu.vn", department: "Khoa Toán", programCode: "TOAN_TIN" },
  { studentCode: "SV.2023.00981", name: "Lê Văn Hải", email: "hai.le@student.edu.vn", department: "Khoa Điện tử", programCode: "DTVT" },
  { studentCode: "SV.2023.00355", name: "Vũ Thị Mai", email: "mai.vu@student.edu.vn", department: "Khoa Kinh tế", programCode: "QTKD" }
];

export function TopNav({ onMenuToggle }) {
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [switchOpen,  setSwitchOpen]  = useState(false);
  const [searchVal,   setSearchVal]   = useState("");
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("profile");
  const notifRef   = useRef(null);
  const profileRef = useRef(null);
  const navigate   = useNavigate();
  const { user, loginDemo, logout } = useRole();
  const { showToast } = useToast();
  const USE_MOCK = (import.meta.env.VITE_USE_MOCK || '').toLowerCase() === 'true';

  const role = user?.role || "PUBLIC";
  const roleColor = ROLE_COLORS[role.toUpperCase()] || ROLE_COLORS.PUBLIC;

  const [notifications, setNotifications] = useState([]);
  const unread = notifications.filter(n => n.unread).length;

  useEffect(() => {
    function handler(e) {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
        setSwitchOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [dynamicLoading, setDynamicLoading] = useState(false);
  const [hasFetchedDynamic, setHasFetchedDynamic] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function clickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  const loadDynamicEntities = async () => {
    if (!user) return;
    setDynamicLoading(true);
    try {
      if (USE_MOCK) {
        setCourses(MOCK_COURSES);
        setStudents(MOCK_STUDENTS);
        setHasFetchedDynamic(true);
        return;
      }

      // Real API mode
      if (role === "ADMIN") {
        const [courseData, studentData] = await Promise.all([
          adminCatalogService.getCourses().catch(() => []),
          adminStudentService.getAllStudents().catch(() => [])
        ]);
        setCourses(Array.isArray(courseData) ? courseData : []);
        setStudents(Array.isArray(studentData) ? studentData : []);
      } else if (role === "ACADEMIC_ADVISOR") {
        const studentData = await advisorService.getMyStudents().catch(() => []);
        setStudents(Array.isArray(studentData) ? studentData : []);
      } else if (role === "LECTURER") {
        const timetableData = await lecturerService.getMyTimetable().catch(() => []);
        const extractedCourses = [];
        if (Array.isArray(timetableData)) {
          const codes = new Set();
          timetableData.forEach(item => {
            if (item.courseCode && !codes.has(item.courseCode)) {
              codes.add(item.courseCode);
              extractedCourses.push({
                code: item.courseCode,
                name: item.courseName || item.courseCode,
                credits: item.credits || 3,
                departmentName: item.departmentName || "Khoa CNTT"
              });
            }
          });
        }
        setCourses(extractedCourses);
      } else if (role === "STUDENT") {
        const [regData, openData] = await Promise.all([
          courseRegistrationService.getMyRegistrations().catch(() => []),
          courseRegistrationService.getOpenSections().catch(() => [])
        ]);
        const studentCourses = [];
        const codes = new Set();
        
        if (Array.isArray(regData)) {
          regData.forEach(r => {
            const code = r.courseCode || r.courseSection?.courseCode;
            if (code && !codes.has(code)) {
              codes.add(code);
              studentCourses.push({
                code,
                name: r.courseName || r.courseSection?.courseName || code,
                credits: r.credits || r.courseSection?.credits || 3,
                departmentName: r.departmentName || ""
              });
            }
          });
        }
        if (Array.isArray(openData)) {
          openData.forEach(s => {
            const code = s.courseCode;
            if (code && !codes.has(code)) {
              codes.add(code);
              studentCourses.push({
                code,
                name: s.courseName || code,
                credits: s.credits || 3,
                departmentName: s.departmentName || ""
              });
            }
          });
        }
        setCourses(studentCourses);
      }
      setHasFetchedDynamic(true);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu tìm kiếm động:", err);
      setCourses([]);
      setStudents([]);
      setHasFetchedDynamic(true);
    } finally {
      setDynamicLoading(false);
    }
  };

  const handleSearchFocus = () => {
    setIsOpen(true);
    if (!hasFetchedDynamic) {
      loadDynamicEntities();
    }
  };

  // Recalculate suggestions as searchVal changes
  useEffect(() => {
    const term = removeDiacritics(searchVal).trim();
    if (!term) {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }

    const matchedSuggestions = [];

    // 1. Match system functions for the current role
    const matchedFunctions = FUNCTION_ITEMS.filter(item => {
      if (!item.roles.includes(role)) return false;
      return (
        removeDiacritics(item.title).includes(term) ||
        item.keywords.some(k => removeDiacritics(k).includes(term))
      );
    }).map(item => ({
      type: "function",
      title: item.title,
      subtitle: "Chức năng hệ thống",
      iconName: item.iconName,
      path: item.path,
      actionType: item.actionType
    }));
    if (matchedFunctions.length > 0) {
      matchedSuggestions.push({ category: "Chức năng", items: matchedFunctions });
    }

    // 2. Match courses
    const matchedCourses = courses.filter(c =>
      removeDiacritics(getCourseCode(c)).includes(term) ||
      removeDiacritics(getCourseName(c)).includes(term)
    ).slice(0, 5).map(c => ({
      type: "course",
      title: getCourseName(c),
      subtitle: `${getCourseCode(c)} • ${getCourseCredits(c)} tín chỉ`,
      iconName: "BookOpen",
      path: role === "STUDENT" 
        ? `/student/registrations?search=${encodeURIComponent(getCourseCode(c))}`
        : role === "ADMIN"
        ? `/admin/courses?search=${encodeURIComponent(getCourseCode(c))}`
        : role === "LECTURER"
        ? `/lecturer/roster?search=${encodeURIComponent(getCourseCode(c))}`
        : `/`
    }));
    if (matchedCourses.length > 0) {
      matchedSuggestions.push({ category: "Môn học", items: matchedCourses });
    }

    // 3. Match students (only for ADMIN, ACADEMIC_ADVISOR, LECTURER)
    if (role === "ADMIN" || role === "ACADEMIC_ADVISOR" || role === "LECTURER") {
      const matchedStudents = students.filter(s =>
        removeDiacritics(getStudentCode(s)).includes(term) ||
        removeDiacritics(getStudentName(s)).includes(term) ||
        removeDiacritics(getStudentEmail(s)).includes(term)
      ).slice(0, 5).map(s => ({
        type: "student",
        title: getStudentName(s),
        subtitle: `${getStudentCode(s)} • ${getStudentMeta(s)}`,
        iconName: "User",
        path: role === "ADMIN" 
          ? `/admin/student-status?search=${encodeURIComponent(getStudentCode(s))}`
          : role === "ACADEMIC_ADVISOR"
          ? `/advisor/profiles?search=${encodeURIComponent(getStudentCode(s))}`
          : `/lecturer/roster?search=${encodeURIComponent(getStudentCode(s))}`
      }));
      if (matchedStudents.length > 0) {
        matchedSuggestions.push({ category: "Sinh viên", items: matchedStudents });
      }
    }

    setSuggestions(matchedSuggestions);
    setActiveIndex(-1);
  }, [searchVal, courses, students, role]);

  const getFlatSuggestions = () => {
    const flat = [];
    suggestions.forEach(cat => {
      cat.items.forEach(item => {
        flat.push(item);
      });
    });
    return flat;
  };

  const handleSelectSuggestion = (item) => {
    setSearchVal("");
    setIsOpen(false);
    setActiveIndex(-1);

    if (item.actionType === "profile") {
      setActiveSettingsTab("profile");
      setProfileSettingsOpen(true);
    } else if (item.actionType === "settings") {
      setActiveSettingsTab("settings");
      setProfileSettingsOpen(true);
    } else if (item.actionType === "security") {
      setActiveSettingsTab("security");
      setProfileSettingsOpen(true);
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const handleKeyDown = (e) => {
    const flat = getFlatSuggestions();
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex(prev => (prev < flat.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex(prev => (prev > 0 ? prev - 1 : flat.length - 1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < flat.length) {
        e.preventDefault();
        handleSelectSuggestion(flat[activeIndex]);
      } else {
        const term = searchVal.trim();
        if (!term) return;
        
        if (flat.length > 0) {
          e.preventDefault();
          handleSelectSuggestion(flat[0]);
        } else {
          const rolePaths = {
            STUDENT: `/student/registrations?search=${encodeURIComponent(term)}`,
            LECTURER: `/lecturer/roster?search=${encodeURIComponent(term)}`,
            ACADEMIC_ADVISOR: `/advisor/profiles?search=${encodeURIComponent(term)}`,
            ADMIN: `/admin/courses?search=${encodeURIComponent(term)}`,
          };
          const path = rolePaths[role] || "/";
          navigate(path);
          setIsOpen(false);
        }
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== "STUDENT") {
      setNotifications([]);
      return;
    }

    let active = true;
    async function loadNotifications() {
      try {
        const data = await studentService.getMyNotifications();
        if (active && Array.isArray(data)) {
          const mapped = data.map(n => ({
            id: n.id,
            title: n.title,
            message: n.content || n.message,
            time: n.createdAt ? new Date(n.createdAt).toLocaleDateString('vi-VN') + ' ' + new Date(n.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : "—",
            unread: !n.read,
            color: n.read ? "#cbd5e1" : "#2563eb"
          }));
          setNotifications(mapped);
        }
      } catch (err) {
        console.error("Failed to load notifications in TopNav:", err);
      }
    }

    loadNotifications();
    return () => {
      active = false;
    };
  }, [user, notifOpen]);

  async function handleMarkAsRead(id, unreadVal) {
    if (!unreadVal || !user || user.role !== "STUDENT") return;
    try {
      await studentService.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false, color: "#cbd5e1" } : n));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }

  async function handleMarkAllAsRead() {
    if (!user || user.role !== "STUDENT") return;
    try {
      await studentService.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, unread: false, color: "#cbd5e1" })));
      showToast("success", "Thành công", "Đã đánh dấu tất cả thông báo là đã đọc.");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      showToast("error", "Lỗi", "Không thể cập nhật trạng thái thông báo.");
    }
  }

  function switchRole(r) {
    loginDemo(r);
    setSwitchOpen(false);
    setProfileOpen(false);
    navigate("/");
  }

  return (
    <header
      className="flex items-center gap-4 px-4 lg:px-6"
      style={{
        height: 64, backgroundColor: "#fff",
        borderBottom: "1px solid #e2e8f0",
        flexShrink: 0, position: "relative", zIndex: 10,
      }}
    >
      <button
        onClick={onMenuToggle}
        className="lg:hidden"
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        <Menu size={20} color="#475569" />
      </button>

      {/* Search */}
      <div ref={dropdownRef} className="flex-1 max-w-md" style={{ position: "relative" }}>
        <Search
          size={15} color="#94a3b8"
          style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
        />
        <input
          type="text"
          placeholder="Tìm kiếm sinh viên, môn học, yêu cầu… (Nhấn Enter)"
          value={searchVal}
          onChange={(e) => {
            setSearchVal(e.target.value);
            setIsOpen(true);
          }}
          onFocus={handleSearchFocus}
          onKeyDown={handleKeyDown}
          style={{
            width: "100%", paddingLeft: 36, paddingRight: 16,
            paddingTop: 8, paddingBottom: 8,
            borderRadius: 12, border: "1px solid #e2e8f0",
            fontSize: "0.82rem", backgroundColor: "#f8fafc",
            color: "#334155", outline: "none",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        />
        {/* Dropdown Suggestions */}
        {isOpen && (searchVal.trim() || dynamicLoading) && (
          <div style={{
            position: "absolute", left: 0, right: 0, top: 44,
            backgroundColor: "#fff", border: "1px solid #e2e8f0",
            borderRadius: 16, boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
            zIndex: 999, overflow: "hidden", maxHeight: 400,
            display: "flex", flexDirection: "column"
          }}>
            {dynamicLoading && (
              <div style={{ padding: "12px 16px", color: "#64748b", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: 8 }}>
                <span className="animate-spin" style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #3b82f6", borderTopColor: "transparent", borderRadius: "50%" }}></span>
                Đang tải dữ liệu tìm kiếm...
              </div>
            )}
            
            {!dynamicLoading && suggestions.length === 0 && (
              <div style={{ padding: "20px 16px", textAlign: "center", color: "#64748b", fontSize: "0.82rem" }}>
                Không tìm thấy kết quả phù hợp cho "{searchVal}"
              </div>
            )}
            
            {!dynamicLoading && suggestions.length > 0 && (
              <div style={{ overflowY: "auto", padding: "6px 0" }}>
                {suggestions.map((cat) => (
                  <div key={cat.category}>
                    <p style={{
                      fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8",
                      textTransform: "uppercase", letterSpacing: "0.08em",
                      padding: "8px 16px 4px", backgroundColor: "#f8fafc"
                    }}>
                      {cat.category}
                    </p>
                    <div>
                      {cat.items.map((item) => {
                        const flat = getFlatSuggestions();
                        const flatIdx = flat.findIndex(f => 
                          f.title === item.title && f.subtitle === item.subtitle
                        );
                        const isHighlighted = flatIdx === activeIndex;
                        const Icon = getIconComponent(item.iconName);
                        
                        return (
                          <button
                            key={`${item.title}-${item.subtitle}`}
                            onClick={() => handleSelectSuggestion(item)}
                            onMouseEnter={() => setActiveIndex(flatIdx)}
                            style={{
                              width: "100%", display: "flex", alignItems: "center", gap: 12,
                              padding: "10px 16px", border: "none", background: isHighlighted ? "#f1f5f9" : "none",
                              cursor: "pointer", textAlign: "left", transition: "background 0.15s"
                            }}
                          >
                            <div style={{
                              width: 32, height: 32, borderRadius: 8,
                              backgroundColor: isHighlighted ? "#fff" : "#f1f5f9",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              transition: "background 0.15s", flexShrink: 0
                            }}>
                              <Icon size={15} color={isHighlighted ? "#2563eb" : "#64748b"} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{
                                fontSize: "0.82rem", fontWeight: 600,
                                color: isHighlighted ? "#1e293b" : "#334155",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                              }}>
                                {item.title}
                              </p>
                              <p style={{
                                fontSize: "0.7rem", color: "#64748b",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                marginTop: 1
                              }}>
                                {item.subtitle}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Search footer hint */}
            {!dynamicLoading && (
              <div style={{
                padding: "8px 16px", borderTop: "1px solid #f1f5f9",
                backgroundColor: "#f8fafc", fontSize: "0.68rem", color: "#94a3b8",
                display: "flex", justifyContent: "space-between"
              }}>
                <span>Di chuyển bằng ↑↓, Enter để chọn</span>
                <span>ESC để đóng</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Demo Role Switcher */}
        {USE_MOCK && (
        <div style={{ position: "relative" }}>
          <button
            onClick={() => { setSwitchOpen((v) => !v); setNotifOpen(false); setProfileOpen(false); }}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{
              backgroundColor: roleColor.light,
              border: `1px solid ${roleColor.color}30`,
              cursor: "pointer",
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: 9999, backgroundColor: roleColor.color }} />
            <span style={{ fontSize: "0.72rem", color: roleColor.color, fontWeight: 700 }}>
              Demo: {ROLE_LABELS[role]}
            </span>
            <ChevronDown size={11} color={roleColor.color} />
          </button>
          {switchOpen && (
            <div style={{
              position: "absolute", right: 0, top: 44, width: 230,
              backgroundColor: "#fff", border: "1px solid #e2e8f0",
              borderRadius: 16, boxShadow: "0 16px 40px rgba(0,0,0,0.12)",
              zIndex: 60, overflow: "hidden",
            }}>
              <p style={{ fontSize: "0.62rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "10px 14px 4px" }}>
                Chuyển vai trò Demo
              </p>
              {SWITCH_ROLES.map(({ role: r, label, icon: Icon }) => {
                const rc = ROLE_COLORS[r];
                return (
                  <button
                    key={r}
                    onClick={() => switchRole(r)}
                    className="w-full flex items-center gap-3 px-4 py-2.5"
                    style={{
                      background: r === role ? rc.light : "none",
                      border: "none", cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      backgroundColor: rc.light,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <Icon size={14} color={rc.color} />
                    </div>
                    <span style={{ fontSize: "0.82rem", color: r === role ? rc.color : "#334155", fontWeight: r === role ? 700 : 400 }}>
                      {label}
                    </span>
                    {r === role && (
                      <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: 9999, backgroundColor: rc.color }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        )}

        {/* Notifications */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); setSwitchOpen(false); }}
            style={{
              position: "relative", width: 40, height: 40,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 12, background: "none", border: "none", cursor: "pointer",
            }}
          >
            <Bell size={19} color="#475569" />
            {unread > 0 && (
              <span style={{
                position: "absolute", top: 6, right: 6,
                width: 17, height: 17, borderRadius: 9999,
                backgroundColor: "#ef4444", color: "white",
                fontSize: "0.58rem", fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {unread}
              </span>
            )}
          </button>
          {notifOpen && (
            <div style={{
              position: "absolute", right: 0, top: 52, width: 340,
              backgroundColor: "#fff", border: "1px solid #e2e8f0",
              borderRadius: 16, boxShadow: "0 20px 40px rgba(0,0,0,0.12)", zIndex: 50,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1e293b" }}>Thông báo</p>
                  <span style={{ backgroundColor: "#dbeafe", color: "#1d4ed8", fontSize: "0.7rem", fontWeight: 600, padding: "2px 8px", borderRadius: 9999 }}>
                    {unread} mới
                  </span>
                </div>
                {unread > 0 && user?.role === "STUDENT" && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    style={{ fontSize: "0.72rem", color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}
                  >
                    Đọc tất cả
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 288, overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "32px 16px", textAlign: "center", color: "#94a3b8", fontSize: "0.8rem" }}>
                    Không có thông báo nào
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} onClick={() => handleMarkAsRead(n.id, n.unread)} style={{
                      display: "flex", gap: 12, padding: "12px 16px",
                      borderBottom: "1px solid #f1f5f9",
                      backgroundColor: n.unread ? "#fafbff" : "#fff", cursor: "pointer",
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: n.unread ? (n.color || "#2563eb") : "#cbd5e1", flexShrink: 0, marginTop: 6 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: n.unread ? 700 : 500, fontSize: "0.8rem", color: "#1e293b" }}>{n.title}</p>
                        <p style={{ fontSize: "0.72rem", color: n.unread ? "#334155" : "#64748b", marginTop: 2, lineHeight: 1.4 }}>{n.message}</p>
                        <p style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: 4 }}>{n.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div style={{ padding: "10px 16px", textAlign: "center" }}>
                <button 
                  onClick={() => {
                    if (user?.role === "STUDENT") {
                      navigate("/student/notifications");
                    } else {
                      showToast("info", "Thông báo", "Tính năng thông báo đầy đủ khả dụng với sinh viên.");
                    }
                    setNotifOpen(false);
                  }}
                  style={{ fontSize: "0.78rem", color: "#2563eb", fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}
                >
                  Xem tất cả thông báo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} style={{ position: "relative" }}>
          <button
            onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); setSwitchOpen(false); }}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 12px", borderRadius: 12, cursor: "pointer", border: "none", background: "none" }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 9999,
              background: `linear-gradient(135deg, ${roleColor.bg}, ${roleColor.color})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontSize: "0.78rem", fontWeight: 700,
            }}>
              {user?.avatarInitials ?? "?"}
            </div>
            <div className="hidden sm:block" style={{ textAlign: "left" }}>
              <p style={{ fontWeight: 600, fontSize: "0.8rem", color: "#1e293b", lineHeight: 1.2 }}>
                {user?.name ?? "Khách"}
              </p>
              <div className="flex items-center gap-1">
                <span style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: roleColor.color, display: "inline-block" }} />
                <p style={{ fontSize: "0.65rem", color: roleColor.color, fontWeight: 600, lineHeight: 1.2 }}>
                  {ROLE_LABELS[role]}
                </p>
              </div>
            </div>
            <ChevronDown size={13} color="#94a3b8" className="hidden sm:block" />
          </button>

          {profileOpen && (
            <div style={{
              position: "absolute", right: 0, top: 52, width: 260,
              backgroundColor: "#fff", border: "1px solid #e2e8f0",
              borderRadius: 16, boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
              zIndex: 50, overflow: "hidden",
            }}>
              <div style={{ padding: "14px 16px", backgroundColor: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                <div className="flex items-center gap-3">
                  <div style={{
                    width: 42, height: 42, borderRadius: 9999,
                    background: `linear-gradient(135deg,${roleColor.bg},${roleColor.color})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontSize: "0.9rem", fontWeight: 700,
                  }}>
                    {user?.avatarInitials ?? "?"}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "#1e293b" }}>{user?.name}</p>
                    <p style={{ fontSize: "0.68rem", color: "#64748b", fontFamily: "monospace" }}>{user?.id}</p>
                    <span style={{
                      display: "inline-block", backgroundColor: roleColor.light, color: roleColor.color,
                      fontSize: "0.62rem", fontWeight: 700, padding: "1px 8px", borderRadius: 9999, marginTop: 3,
                    }}>
                      {ROLE_LABELS[role]}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ padding: "6px 0" }}>
                {[
                  { 
                    icon: User,     
                    label: "Hồ sơ cá nhân",    
                    action: () => { 
                      setActiveSettingsTab("profile");
                      setProfileSettingsOpen(true);
                      setProfileOpen(false); 
                    } 
                  },
                  { 
                    icon: Settings, 
                    label: "Cài đặt tài khoản", 
                    action: () => { 
                      setActiveSettingsTab("settings");
                      setProfileSettingsOpen(true);
                      setProfileOpen(false); 
                    } 
                  },
                  { 
                    icon: Shield,   
                    label: "Bảo mật",           
                    action: () => { 
                      setActiveSettingsTab("security");
                      setProfileSettingsOpen(true);
                      setProfileOpen(false); 
                    } 
                  },
                ].map(({ icon: Icon, label, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                  >
                    <Icon size={15} color="#64748b" />
                    <span style={{ fontSize: "0.82rem", color: "#334155" }}>{label}</span>
                  </button>
                ))}
              </div>
              <div style={{ borderTop: "1px solid #f1f5f9", padding: "6px 0" }}>
                <button
                  onClick={() => { logout(); navigate("/login"); setProfileOpen(false); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "none", border: "none", cursor: "pointer" }}
                >
                  <LogOut size={15} color="#ef4444" />
                  <span style={{ fontSize: "0.82rem", color: "#ef4444" }}>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      <ProfileSettingsModal
        isOpen={profileSettingsOpen}
        onOpenChange={setProfileSettingsOpen}
        defaultTab={activeSettingsTab}
      />
    </header>
  );
}

export default TopNav;

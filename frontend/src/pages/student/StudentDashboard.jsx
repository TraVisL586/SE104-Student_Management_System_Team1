import { useNavigate } from "react-router";
import { useRole } from "../../context/RoleContext";
import { useToast } from "../../context/ToastContext";
import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LabelList,
} from "recharts";
import {
  BookOpen, Calendar, Award, CreditCard, FileText,
  TrendingUp, Clock, ChevronRight, Loader2, Key,
} from "lucide-react";
import studentService from "../../services/studentService";
import timetableService from "../../services/timetableService";
import courseRegistrationService from "../../services/courseRegistrationService";
import ChangePasswordModal from "../../components/ChangePasswordModal";

export function StudentDashboard() {
  const { user } = useRole();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [grades, setGrades] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [registrations, setRegistrations] = useState([]);

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);
        const [profileData, gradesData, ttData, regData] = await Promise.allSettled([
          studentService.getMyProfile(),
          studentService.getMyGrades(),
          timetableService.getStudentTimetable(),
          courseRegistrationService.getMyRegistrations().catch(() => []),
        ]);

        if (profileData.status === "fulfilled") setProfile(profileData.value);
        if (gradesData.status === "fulfilled") setGrades(Array.isArray(gradesData.value) ? gradesData.value : []);
        if (ttData.status === "fulfilled") setTimetable(Array.isArray(ttData.value) ? ttData.value : []);
        if (regData.status === "fulfilled") setRegistrations(Array.isArray(regData.value) ? regData.value : []);
      } catch (err) {
        showToast('error', 'Lỗi', 'Không thể tải dữ liệu dashboard');
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [showToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  const displayName = profile?.name || user?.name || "Sinh viên";
  const studentCode = profile?.studentCode || user?.id || "N/A";
  const department = profile?.department || profile?.departmentName || user?.department || "N/A";

  // Calculate stats from real data
  const publishedGrades = grades.filter(g => g.status === "PUBLISHED" || g.gradeStatus === "PUBLISHED");
  let totalCredits = 0;
  let totalScorePoints = 0;
  publishedGrades.forEach(g => {
    const credits = g.credits || 3;
    totalCredits += credits;
    if (g.totalScore != null) totalScorePoints += (g.totalScore * credits);
  });
  const cumulativeGPA = totalCredits > 0 ? (totalScorePoints / totalCredits) : 0;

  // Build GPA chart from grades grouped by semester
  let GPA_TREND = [];
  if (publishedGrades.length > 0) {
    const groups = {};
    publishedGrades.forEach(g => {
      const reg = registrations.find(r => r.id === g.enrollmentId);
      const semKey = reg ? reg.semesterId : "unknown";
      
      let semName = "HK Khác";
      if (reg && reg.semesterName) {
        semName = reg.semesterName
          .replace(/Học kỳ|Hoc ky/gi, "HK")
          .replace(/năm học|nam hoc/gi, "")
          .trim();
      }
      
      if (!groups[semKey]) {
        groups[semKey] = { semesterId: semKey, ky: semName, totalScore: 0, totalCredits: 0 };
      }
      const credits = reg ? reg.credits : (g.credits || 3);
      groups[semKey].totalCredits += credits;
      if (g.totalScore != null) groups[semKey].totalScore += (g.totalScore * credits);
    });

    GPA_TREND = Object.values(groups)
      .sort((a, b) => {
        if (a.semesterId === "unknown") return 1;
        if (b.semesterId === "unknown") return -1;
        return a.semesterId - b.semesterId;
      })
      .map(group => ({
        ky: group.ky,
        gpa: group.totalCredits > 0 ? parseFloat((group.totalScore / group.totalCredits).toFixed(2)) : 0
      }));

    if (GPA_TREND.length === 1) {
      GPA_TREND = [{ ky: "Bắt đầu", gpa: 0 }, GPA_TREND[0]];
    }
  } else {
    GPA_TREND = [{ ky: "—", gpa: 0 }];
  }

  const mapDayOfWeek = (dayNum) => {
    const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
    return days[(dayNum || 1) - 1] || "Thứ 2";
  };

  const mapTime = (timeStr) => {
    if (!timeStr) return "";
    return timeStr.substring(0, 5);
  };

  // Enrolled courses from timetable
  const uniqueCourses = [];
  const seenCourses = new Set();
  timetable.forEach(item => {
    const key = item.courseCode || item.code;
    if (key && !seenCourses.has(key)) {
      seenCourses.add(key);
      uniqueCourses.push({
        code: item.courseCode || item.code || "",
        name: item.courseName || item.name || "",
        tc: item.credits || 3,
        lich: item.dayOfWeek ? `${mapDayOfWeek(item.dayOfWeek)} ${mapTime(item.startTime)}` : item.time || "",
        room: item.roomCode || item.roomName || item.room || "—",
      });
    }
  });
  const enrolledTC = uniqueCourses.reduce((s, c) => s + (c.tc || 0), 0);

  // Recent grades (last 3 published)
  const recentGrades = publishedGrades.slice(-3).reverse();

  // Upcoming from timetable (first 3)
  const upcoming = timetable.slice(0, 3).map(item => ({
    time: item.dayOfWeek ? `${mapDayOfWeek(item.dayOfWeek)} ${mapTime(item.startTime)}` : item.time || "",
    mon: item.courseName || item.name || "",
    room: item.roomCode || item.roomName || item.room || "—",
    type: String(item.courseName || "").toLowerCase().includes("thực hành") || 
          String(item.courseName || "").toLowerCase().includes("lab") ||
          String(item.courseCode || "").toLowerCase().includes("lab") ? "lab" : "lecture",
  }));

  const gradeLabel = (gpa) => {
    if (gpa >= 8.5) return "Giỏi";
    if (gpa >= 7.0) return "Khá";
    if (gpa >= 5.5) return "TB Khá";
    if (gpa >= 4.0) return "Trung bình";
    if (gpa > 0) return "Yếu";
    return "—";
  };

  const STAT_CARDS = [
    { label: "GPA Tích lũy",     value: cumulativeGPA > 0 ? cumulativeGPA.toFixed(2) : "—",   sub: `Xếp loại: ${gradeLabel(cumulativeGPA)}`,        icon: TrendingUp,  color: "#2563eb", bg: "#dbeafe" },
    { label: "Tín chỉ HK này",   value: `${enrolledTC}/24`,  sub: "BR-2: Tối đa 24 TC",    icon: BookOpen,    color: "#8b5cf6", bg: "#ede9fe" },
    { label: "Tín chỉ Tích lũy", value: `${totalCredits}/130`, sub: `${Math.round((totalCredits/130)*100)}% chương trình`,      icon: Award,       color: "#10b981", bg: "#d1fae5" },
    { label: "Môn đang học",  value: `${uniqueCourses.length}`, sub: `${enrolledTC} TC đăng ký`,    icon: CreditCard,  color: "#f59e0b", bg: "#fef3c7" },
  ];

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div
        className="rounded-2xl px-6 py-5 flex flex-wrap items-center justify-between gap-4"
        style={{ background: "linear-gradient(135deg, #1a3461 0%, #2563eb 100%)" }}
      >
        <div>
          <p style={{ color: "#93c5fd", fontSize: "0.82rem" }}>Chào mừng trở lại 👋</p>
          <h1 style={{ color: "white", marginTop: 2 }}>{displayName}</h1>
          <p style={{ color: "#bfdbfe", fontSize: "0.8rem", marginTop: 4 }}>
            {studentCode} · {department}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: "Đăng ký môn",  path: "/student/registrations", icon: BookOpen },
            { label: "Xem điểm",     path: "/student/grades",        icon: Award },
            { label: "Đóng học phí", path: "/student/fees",          icon: CreditCard },
          ].map(({ label, path, icon: Icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 500 }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
          <ChangePasswordModal
            trigger={
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 500 }}
              >
                <Key size={14} /> Đổi mật khẩu
              </button>
            }
          />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-2xl p-4"
            style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}
          >
            <div className="flex items-center justify-between mb-3">
              <p style={{ fontSize: "0.75rem", color: "#64748b" }}>{label}</p>
              <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={16} color={color} />
              </div>
            </div>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1e293b" }}>{value}</p>
            <p style={{ fontSize: "0.72rem", color: "#64748b", marginTop: 2 }}>{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* GPA Trend chart */}
        <div
          className="lg:col-span-2 rounded-2xl p-5"
          style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b" }}>GPA</p>
              <p style={{ fontSize: "0.72rem", color: "#64748b" }}>Thang 10.0 (BR-8)</p>
            </div>
            <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#2563eb" }}>{cumulativeGPA > 0 ? cumulativeGPA.toFixed(2) : "—"}</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={GPA_TREND}>
              <defs>
                <linearGradient id="stdGpaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="ky" tick={{ fontSize: 11, fill: "#94a3b8" }} tickMargin={10} />
              <YAxis domain={['dataMin - 0.5', 10]} tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={true} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: "0.8rem", padding: "8px 12px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
                formatter={(v) => [`${v}`, "GPA Kỳ"]}
              />
              {cumulativeGPA > 0 && (
                <ReferenceLine 
                  y={cumulativeGPA} 
                  stroke="#f59e0b" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.5}
                  label={{ position: 'insideBottomLeft', value: `Tích lũy: ${cumulativeGPA.toFixed(2)}`, fill: '#f59e0b', fontSize: 11, fontWeight: 700, offset: 10 }}
                />
              )}
              <Area type="monotone" dataKey="gpa" stroke="#2563eb" strokeWidth={2.5} fill="url(#stdGpaGrad)" dot={{ r: 4, fill: "#2563eb", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }}>
                <LabelList dataKey="gpa" position="top" offset={10} style={{ fontSize: 11, fontWeight: 600, fill: "#1e293b" }} />
              </Area>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming schedule */}
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}
        >
          <div className="flex items-center justify-between mb-4">
            <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b" }}>Lịch sắp tới</p>
            <button
              onClick={() => navigate("/student/timetable")}
              style={{ fontSize: "0.72rem", color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}
            >
              Xem TKB
            </button>
          </div>
          <div className="space-y-3">
            {upcoming.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có lịch</p>
            ) : upcoming.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: item.type === "lab" ? "#ede9fe" : "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Clock size={15} color={item.type === "lab" ? "#8b5cf6" : "#2563eb"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1e293b" }} className="truncate">{item.mon}</p>
                  <p style={{ fontSize: "0.7rem", color: "#64748b" }}>{item.time} · {item.room}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Enrolled courses */}
        <div
          className="rounded-2xl"
          style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b" }}>Môn đang học</p>
              <p style={{ fontSize: "0.72rem", color: "#64748b" }}>{enrolledTC}/24 tín chỉ đã đăng ký</p>
            </div>
            <button
              onClick={() => navigate("/student/registrations")}
              className="flex items-center gap-1"
              style={{ fontSize: "0.72rem", color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}
            >
              Quản lý <ChevronRight size={13} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  {["Mã MH", "Tên môn học", "TC", "Lịch"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5" style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uniqueCourses.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-4 text-sm text-slate-500">Chưa đăng ký môn nào</td></tr>
                ) : uniqueCourses.map((c) => (
                  <tr key={c.code} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td className="px-4 py-2.5" style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#2563eb", fontWeight: 600 }}>{c.code}</td>
                    <td className="px-4 py-2.5" style={{ fontSize: "0.8rem", color: "#1e293b" }}>{c.name}</td>
                    <td className="px-4 py-2.5" style={{ fontSize: "0.78rem", color: "#64748b" }}>{c.tc}</td>
                    <td className="px-4 py-2.5" style={{ fontSize: "0.72rem", color: "#64748b" }}>{c.lich} · {c.room}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent grades + quick requests */}
        <div className="space-y-5">
          <div
            className="rounded-2xl"
            style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b" }}>Điểm gần nhất</p>
              <button
                onClick={() => navigate("/student/grades")}
                style={{ fontSize: "0.72rem", color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}
              >
                Xem bảng điểm
              </button>
            </div>
            <div className="divide-y" style={{ borderColor: "#f1f5f9" }}>
              {recentGrades.length === 0 ? (
                <div className="px-5 py-4 text-sm text-slate-500">Chưa có điểm nào được công bố</div>
              ) : recentGrades.map((g) => (
                <div key={g.id || g.courseCode} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p style={{ fontSize: "0.82rem", color: "#1e293b", fontWeight: 500 }}>{g.courseName || g.courseCode}</p>
                    <p style={{ fontSize: "0.7rem", color: "#64748b" }}>{g.courseCode}</p>
                  </div>
                  <div className="flex gap-3 text-right">
                    <div>
                      <p style={{ fontSize: "0.62rem", color: "#94a3b8" }}>Giữa kỳ</p>
                      <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#2563eb" }}>{g.midtermScore ?? "—"}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: "0.62rem", color: "#94a3b8" }}>Tổng kết</p>
                      <p style={{ fontSize: "0.9rem", fontWeight: 700, color: g.totalScore != null ? "#10b981" : "#94a3b8" }}>
                        {g.totalScore ?? "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}
          >
            <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b", marginBottom: 12 }}>Thao tác nhanh</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Nộp đơn học vụ",   path: "/student/requests",      icon: FileText,  color: "#2563eb", bg: "#dbeafe" },
                { label: "Xem thời khóa biểu",path: "/student/timetable",     icon: Calendar,  color: "#8b5cf6", bg: "#ede9fe" },
                { label: "Tra cứu điểm",      path: "/student/grades",        icon: Award,     color: "#10b981", bg: "#d1fae5" },
                { label: "Thanh toán học phí",path: "/student/fees",          icon: CreditCard,color: "#f59e0b", bg: "#fef3c7" },
              ].map(({ label, path, icon: Icon, color, bg }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="flex items-center gap-2 p-3 rounded-xl text-left"
                  style={{ backgroundColor: bg, border: "none", cursor: "pointer" }}
                >
                  <Icon size={16} color={color} />
                  <span style={{ fontSize: "0.78rem", color, fontWeight: 600 }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
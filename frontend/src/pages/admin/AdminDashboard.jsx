import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useRole } from "../../context/RoleContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Users, BookMarked, FolderOpen, AlertTriangle, CalendarRange, TrendingUp, ChevronRight, Loader2, CreditCard, UnlockKeyhole, BarChart3 } from "lucide-react";
import adminReportService from "../../services/adminReportService";
import adminStudentService from "../../services/adminStudentService";
import adminSchedulingService from "../../services/adminSchedulingService";

const DEPT_COLORS = ["#2563eb", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];

export function AdminDashboard() {
  const { user } = useRole();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalSections, setTotalSections] = useState(0);
  const [statusSummary, setStatusSummary] = useState([]);
  const [fillRates, setFillRates] = useState([]);
  const [warningCount, setWarningCount] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [studentsData, sectionsData, statusData, fillData] = await Promise.allSettled([
        adminStudentService.getAllStudents(),
        adminSchedulingService.getCourseSections(),
        adminReportService.getStudentStatusSummary(),
        adminReportService.getClassFillRates(),
      ]);

      if (studentsData.status === "fulfilled") {
        const students = Array.isArray(studentsData.value) ? studentsData.value : [];
        setTotalStudents(students.length);
        // Count warnings from student data as fallback
        const warnCount = students.filter(s =>
          s.academicStatus === "WARNING" || s.academicStatus === "SUSPENDED"
        ).length;
        setWarningCount(warnCount);
      }

      if (sectionsData.status === "fulfilled") {
        const sections = Array.isArray(sectionsData.value) ? sectionsData.value : [];
        setTotalSections(sections.length);
      }

      if (statusData.status === "fulfilled") {
        const data = Array.isArray(statusData.value) ? statusData.value : [];
        setStatusSummary(data);
        // Better warning count from report
        const warnFromReport = data.reduce((sum, d) => {
          if (d.status === "WARNING" || d.status === "SUSPENDED") return sum + (d.studentCount || d.count || 0);
          return sum;
        }, 0);
        if (warnFromReport > 0) setWarningCount(warnFromReport);
      }

      if (fillData.status === "fulfilled") {
        setFillRates(Array.isArray(fillData.value) ? fillData.value : []);
      }
    } catch (error) {
      console.error("Dashboard load error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Build pie chart from status summary
  const pieData = statusSummary.map((d) => ({
    name: d.status || d.name || "Unknown",
    value: d.studentCount || d.count || d.value || 0,
  })).filter(d => d.value > 0);

  // Build bar chart from fill rates
  const barData = fillRates.slice(0, 10).map((d) => ({
    code: d.courseSectionCode || d.sectionCode || d.code || "",
    enrolled: d.enrolledCount || d.enrolled || 0,
    capacity: d.capacity || 0,
  }));

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div
        className="rounded-2xl px-6 py-5 flex flex-wrap items-center justify-between gap-4"
        style={{ background: "linear-gradient(135deg, #064e3b 0%, #10b981 100%)" }}
      >
        <div>
          <p style={{ color: "#a7f3d0", fontSize: "0.82rem" }}>Bảng điều khiển Quản trị 🎓</p>
          <h1 style={{ color: "white", marginTop: 2 }}>{user?.name || "Admin"}</h1>
          <p style={{ color: "#bbf7d0", fontSize: "0.8rem", marginTop: 4 }}>
            {user?.email}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-green-600" size={32} />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Tổng Sinh viên", value: totalStudents.toLocaleString(), sub: "Trong hệ thống", color: "#2563eb", bg: "#dbeafe", icon: Users },
              { label: "Lớp học phần", value: totalSections.toString(), sub: "Tất cả học kỳ", color: "#8b5cf6", bg: "#ede9fe", icon: BookMarked },
              { label: "Chương trình", value: "—", sub: "Xem tại CTĐT", color: "#10b981", bg: "#d1fae5", icon: FolderOpen },
              { label: "Cần xử lý", value: warningCount.toString(), sub: "SV cảnh báo / đình chỉ", color: "#f59e0b", bg: "#fef3c7", icon: AlertTriangle },
            ].map(({ label, value, sub, color, bg, icon: Icon }) => (
              <div key={label} className="rounded-2xl p-4" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
                <div className="flex items-center justify-between mb-3">
                  <p style={{ fontSize: "0.75rem", color: "#64748b" }}>{label}</p>
                  <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={16} color={color} />
                  </div>
                </div>
                <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1e293b" }}>{value}</p>
                <p style={{ fontSize: "0.72rem", color, fontWeight: 600, marginTop: 2 }}>{sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Fill rate chart */}
            <div className="lg:col-span-2 rounded-2xl p-5" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} color="#10b981" />
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b" }}>Tỷ lệ lấp đầy lớp HP</p>
                  <p style={{ fontSize: "0.72rem", color: "#64748b" }}>Enrolled vs Capacity (top 10 lớp)</p>
                </div>
              </div>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData} barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="code" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: "0.78rem" }} />
                    <Bar dataKey="enrolled" fill="#10b981" radius={[4, 4, 0, 0]} name="Đã đăng ký" />
                    <Bar dataKey="capacity" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Sức chứa" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-slate-500 py-8 text-center">Chưa có dữ liệu fill rate</p>
              )}
            </div>

            {/* Status pie */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b", marginBottom: 2 }}>Trạng thái SV</p>
              <p style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: 12 }}>Tổng {totalStudents} sinh viên</p>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={2}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "0.72rem" }} />
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: "0.78rem" }} formatter={(v) => [`${v} SV`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-slate-500 py-8 text-center">Chưa có dữ liệu</p>
              )}
            </div>
          </div>

          {/* Quick nav */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl p-5" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b", marginBottom: 14 }}>Chức năng quản trị</p>
              <div className="space-y-2">
                {[
                  { label: "Quản lý Lớp học phần", path: "/admin/courses", icon: BookMarked, color: "#8b5cf6", bg: "#ede9fe", desc: "Mở/đóng lớp, phân công GV" },
                  { label: "Quản lý Chương trình ĐT", path: "/admin/curriculum", icon: FolderOpen, color: "#10b981", bg: "#d1fae5", desc: "Cập nhật CTĐT, môn học" },
                  { label: "Trạng thái Sinh viên", path: "/admin/student-status", icon: AlertTriangle, color: "#f59e0b", bg: "#fef3c7", desc: "Cảnh báo, đình chỉ, buộc thôi" },
                  { label: "Quản lý Thời khóa biểu", path: "/admin/timetable-manager", icon: CalendarRange, color: "#2563eb", bg: "#dbeafe", desc: "Lập và điều chỉnh TKB" },
                  { label: "Quản lý Công nợ", path: "/admin/tuition", icon: CreditCard, color: "#dc2626", bg: "#fee2e2", desc: "Theo dõi học phí, ghi nhận thanh toán" },
                  { label: "Mở khóa điểm", path: "/admin/grade-unlocks", icon: UnlockKeyhole, color: "#7c3aed", bg: "#ede9fe", desc: "Duyệt yêu cầu sửa điểm đã publish" },
                  { label: "Báo cáo thống kê", path: "/admin/reports", icon: BarChart3, color: "#0891b2", bg: "#cffafe", desc: "Xem biểu đồ và export CSV" },
                ].map(({ label, path, icon: Icon, color, bg, desc }) => (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left"
                    style={{ border: "1px solid #f1f5f9", cursor: "pointer", background: "none" }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={16} color={color} />
                    </div>
                    <div className="flex-1">
                      <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>{label}</p>
                      <p style={{ fontSize: "0.7rem", color: "#64748b" }}>{desc}</p>
                    </div>
                    <ChevronRight size={14} color="#94a3b8" />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick stats from reports */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b", marginBottom: 14 }}>Tổng quan nhanh</p>
              <div className="space-y-3">
                {statusSummary.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "#f8fafc" }}>
                    <div className="flex items-center gap-3">
                      <div style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                      <span style={{ fontSize: "0.85rem", color: "#1e293b" }}>{s.status || s.name}</span>
                    </div>
                    <span style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b" }}>{s.studentCount || s.count || s.value || 0} SV</span>
                  </div>
                ))}
                {statusSummary.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">Chưa có dữ liệu thống kê</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;

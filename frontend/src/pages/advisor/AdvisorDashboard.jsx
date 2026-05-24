import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useRole } from "../../context/RoleContext";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { UserCheck, FileText, AlertTriangle, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import advisorService from "../../services/advisorService";
import { getAcademicStatusConfig, getStudentDisplayName, isAtRiskStatus } from "./advisorStatus";

export function AdvisorDashboard() {
  const { user } = useRole();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [students, setStudents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const [stuData, reqData] = await Promise.all([
        advisorService.getMyStudents(),
        advisorService.getAdvisorRequests("PENDING")
      ]);
      setStudents(Array.isArray(stuData) ? stuData : []);
      setRequests(Array.isArray(reqData) ? reqData : []);
    } catch {
      setLoadError(true);
      showToast("error", "Lỗi", "Không thể tải dữ liệu bảng điều khiển cố vấn");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  const pendingRequests = requests.filter(r => r.status === "PENDING");

  const statusCounts = useMemo(() => students.reduce((acc, student) => {
    const status = student.academicStatus || "UNKNOWN";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {}), [students]);

  const atRiskStudents = useMemo(
    () => students.filter((student) => isAtRiskStatus(student.academicStatus)),
    [students]
  );

  const STATUS_DATA = [
    { name: "Đang học", value: statusCounts.STUDYING || 0, color: "#10b981" },
    { name: "Tạm nghỉ", value: statusCounts.ON_LEAVE || 0, color: "#f59e0b" },
    { name: "Đình chỉ", value: statusCounts.SUSPENDED || 0, color: "#ef4444" },
    { name: "Tốt nghiệp", value: statusCounts.GRADUATED || 0, color: "#2563eb" },
  ];

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div
        className="rounded-2xl px-6 py-5 flex flex-wrap items-center justify-between gap-4"
        style={{ background: "linear-gradient(135deg, #78350f 0%, #f59e0b 100%)" }}
      >
        <div>
          <p style={{ color: "#fde68a", fontSize: "0.82rem" }}>Bảng điều khiển Cố vấn Học tập</p>
          <h1 style={{ color: "white", marginTop: 2 }}>{user?.name || "Cố vấn"}</h1>
          <p style={{ color: "#fef3c7", fontSize: "0.8rem", marginTop: 4 }}>
            {user?.email}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: "Hồ sơ SV",   path: "/advisor/profiles",  icon: UserCheck },
            { label: "Xử lý đơn",  path: "/advisor/requests",  icon: FileText },
          ].map(({ label, path, icon: Icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white", border: "none", cursor: "pointer", fontSize: "0.8rem" }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-orange-500" size={32} />
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border border-red-100 bg-white p-8 text-center">
          <AlertTriangle className="mx-auto mb-3 text-red-500" size={34} />
          <p className="text-sm font-semibold text-slate-800">Không thể tải dữ liệu cố vấn</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            <RefreshCw size={14} /> Tải lại
          </button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Sinh viên phụ trách",  value: students.length,  sub: "Đang theo dõi",        color: "#f59e0b", bg: "#fef3c7", icon: UserCheck },
              { label: "Đơn chờ xử lý",        value: pendingRequests.length, sub: "Đang chờ duyệt", color: "#ef4444", bg: "#fee2e2", icon: FileText },
              { label: "Tạm nghỉ",      value: statusCounts.ON_LEAVE || 0,   sub: "Cần theo dõi", color: "#f59e0b", bg: "#fef3c7", icon: AlertTriangle },
              { label: "Đình chỉ",    value: statusCounts.SUSPENDED || 0,   sub: "Cần chú ý", color: "#dc2626", bg: "#fecaca", icon: AlertTriangle },
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
            {/* Status pie */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b", marginBottom: 2 }}>Tình trạng học vụ</p>
              <p style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: 12 }}>{students.length} sinh viên phụ trách</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={STATUS_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                    {STATUS_DATA.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "0.72rem" }} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: "0.78rem" }} formatter={(v) => [`${v} SV`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Pending requests */}
            <div className="lg:col-span-2 rounded-2xl flex flex-col" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
                <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b" }}>Đơn cần xử lý</p>
                <button
                  onClick={() => navigate("/advisor/requests")}
                  className="flex items-center gap-1"
                  style={{ fontSize: "0.72rem", color: "#f59e0b", background: "none", border: "none", cursor: "pointer" }}
                >
                  Xem tất cả <ChevronRight size={13} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {pendingRequests.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">Không có đơn chờ xử lý</div>
                ) : pendingRequests.slice(0, 4).map((req) => (
                  <div key={req.id} className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      backgroundColor: "#fef3c7",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <FileText size={17} color="#f59e0b" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "#1e293b" }}>{req.type}</p>
                      </div>
                      <p style={{ fontSize: "0.72rem", color: "#64748b" }}>{req.studentName} · {req.studentCode}</p>
                    </div>
                    <p style={{ fontSize: "0.68rem", color: "#94a3b8", whiteSpace: "nowrap" }}>
                      {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 mt-auto">
                <button
                  onClick={() => navigate("/advisor/requests")}
                  className="w-full py-2 rounded-xl"
                  style={{ backgroundColor: "#fef3c7", color: "#92400e", border: "none", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}
                >
                  Xử lý đơn yêu cầu →
                </button>
              </div>
            </div>
          </div>

          {/* At-risk students */}
          {atRiskStudents.length > 0 && (
            <div className="rounded-2xl mt-5" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
              <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
                <AlertTriangle size={16} color="#ef4444" />
                <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b" }}>Sinh viên cần theo dõi</p>
              </div>
              <div className="divide-y" style={{ borderColor: "#f1f5f9" }}>
                {atRiskStudents.map((s) => {
                  const statusConfig = getAcademicStatusConfig(s.academicStatus);
                  const displayName = getStudentDisplayName(s);
                  return (
                  <div key={s.studentId} className="flex items-center gap-4 px-5 py-3">
                    <div style={{ width: 36, height: 36, borderRadius: 9999, backgroundColor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#ef4444" }}>{displayName.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "#1e293b" }}>{displayName}</p>
                      <p style={{ fontSize: "0.7rem", color: "#64748b" }}>{s.studentCode}</p>
                    </div>
                    <div style={{ maxWidth: 200 }}>
                      <p style={{ fontSize: "0.72rem", color: "#ef4444", fontWeight: 500 }}>
                        {statusConfig.label}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate("/advisor/profiles")}
                      style={{ padding: "5px 12px", borderRadius: 8, backgroundColor: "#fef3c7", color: "#92400e", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, whiteSpace: "nowrap" }}
                    >
                      Xem hồ sơ
                    </button>
                  </div>
                )})}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdvisorDashboard;

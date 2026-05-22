import { useState, useEffect } from "react";
import { Search, UserCheck, Award, FileText, AlertTriangle, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useSearchParams } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import advisorService from "../../services/advisorService";

const STATUS_CFG = {
  ACTIVE:    { label: "Bình thường",    color: "#10b981", bg: "#d1fae5" },
  WARNING:   { label: "Cảnh báo",       color: "#f59e0b", bg: "#fef3c7" },
  SUSPENDED: { label: "Đình chỉ",       color: "#dc2626", bg: "#fee2e2" },
  GRADUATED: { label: "Đã tốt nghiệp",  color: "#2563eb", bg: "#dbeafe" },
  DROPPED_OUT:  { label: "Buộc thôi học",  color: "#7f1d1d", bg: "#fee2e2" },
};

export function StudentProfiles() {
  const [searchParams] = useSearchParams();
  const searchParam = searchParams.get("search") || "";
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState(searchParam);

  useEffect(() => {
    setSearch(searchParam);
  }, [searchParam]);
  const [selectedId, setSelectedId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchProfile(selectedId);
    } else {
      setProfile(null);
    }
  }, [selectedId]);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const data = await advisorService.getMyStudents();
      setStudents(data);
    } catch (error) {
      showToast("error", "Lỗi", "Không thể tải danh sách sinh viên do bạn phụ trách.");
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchProfile = async (id) => {
    try {
      setLoadingProfile(true);
      const data = await advisorService.getStudentProfile(id);
      setProfile(data);
    } catch (error) {
      showToast("error", "Lỗi", "Không thể tải hồ sơ chi tiết của sinh viên.");
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  const filtered = students.filter(
    (s) =>
      s.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      s.studentCode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 style={{ color: "#1e293b" }}>Hồ sơ Sinh viên</h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 2 }}>
          Xem thông tin học vụ chi tiết của sinh viên được phụ trách
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Student list */}
        <div className="rounded-2xl flex flex-col" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", maxHeight: "800px" }}>
          <div className="px-4 py-3" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ position: "relative" }}>
              <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input
                placeholder="Tìm sinh viên…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "0.82rem", outline: "none" }}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: "#f1f5f9" }}>
            {loadingStudents ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-blue-600" size={24} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-sm text-slate-500">
                Không tìm thấy sinh viên nào
              </div>
            ) : filtered.map((s) => {
              const cfg = STATUS_CFG[s.academicStatus] || STATUS_CFG.ACTIVE;
              return (
                <button
                  key={s.studentId}
                  onClick={() => setSelectedId(s.studentId)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                  style={{
                    background: selectedId === s.studentId ? "#fffbeb" : "none",
                    border: "none",
                    borderLeft: selectedId === s.studentId ? `3px solid #f59e0b` : "3px solid transparent",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 9999, backgroundColor: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: cfg.color }}>
                      {s.studentName.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "#1e293b" }} className="truncate">{s.studentName}</p>
                    <p style={{ fontSize: "0.68rem", color: "#94a3b8", fontFamily: "monospace" }}>{s.studentCode}</p>
                    <span style={{ fontSize: "0.62rem", fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Profile detail */}
        <div className="lg:col-span-2">
          {loadingProfile ? (
            <div className="rounded-2xl p-12 flex justify-center" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
              <Loader2 className="animate-spin text-orange-500" size={32} />
            </div>
          ) : profile ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="rounded-2xl p-5 flex items-start justify-between flex-wrap gap-4" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
                <div className="flex items-center gap-4">
                  <div style={{ width: 56, height: 56, borderRadius: 9999, background: "linear-gradient(135deg,#92400e,#f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "1.2rem", fontWeight: 700 }}>
                    {profile.studentName.charAt(0)}
                  </div>
                  <div>
                    <h2 style={{ color: "#1e293b" }}>{profile.studentName}</h2>
                    <p style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#64748b" }}>{profile.studentCode}</p>
                    <span style={{ display: "inline-block", marginTop: 4, fontSize: "0.7rem", fontWeight: 700, padding: "2px 9px", borderRadius: 9999, backgroundColor: (STATUS_CFG[profile.academicStatus] || STATUS_CFG.ACTIVE).bg, color: (STATUS_CFG[profile.academicStatus] || STATUS_CFG.ACTIVE).color }}>
                      {(STATUS_CFG[profile.academicStatus] || STATUS_CFG.ACTIVE).label}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  {[
                    { label: "GPA", value: profile.gpa || "N/A", color: (profile.gpa || 0) < 5 ? "#ef4444" : (profile.gpa || 0) < 7 ? "#f59e0b" : "#10b981" },
                    { label: "Tín chỉ tích lũy", value: profile.accumulatedCredits || 0, color: "#2563eb" },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <p style={{ fontSize: "1.3rem", fontWeight: 800, color }}>{value}</p>
                      <p style={{ fontSize: "0.68rem", color: "#94a3b8" }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warnings */}
              {profile.academicStatus !== "ACTIVE" && (
                <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: "#fef3c7", border: "1px solid #fde68a" }}>
                  <AlertTriangle size={16} color="#f59e0b" style={{ marginTop: 1, flexShrink: 0 }} />
                  <p style={{ fontSize: "0.82rem", color: "#92400e" }}>
                    Sinh viên đang có tình trạng học vụ <strong>{(STATUS_CFG[profile.academicStatus] || STATUS_CFG.WARNING).label}</strong>. Cần tư vấn và theo dõi đặc biệt.
                  </p>
                </div>
              )}

              {/* Recent Grades */}
              <div className="rounded-2xl p-5" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
                <p style={{ fontWeight: 700, fontSize: "0.92rem", color: "#1e293b", marginBottom: 12 }}>Kết quả học tập gần đây</p>
                {profile.recentGrades && profile.recentGrades.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500">
                          <th className="px-3 py-2 text-left font-semibold">Môn học</th>
                          <th className="px-3 py-2 text-left font-semibold">Điểm</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profile.recentGrades.map((g, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-3 py-2">{g.courseName} <span className="text-slate-400 text-xs">({g.courseCode})</span></td>
                            <td className="px-3 py-2 font-semibold" style={{ color: (g.finalScore || 0) < 5 ? "#ef4444" : "#10b981" }}>{g.finalScore || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Chưa có dữ liệu điểm.</p>
                )}
              </div>

            </div>
          ) : (
            <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
              <UserCheck size={40} color="#cbd5e1" style={{ margin: "0 auto 12px" }} />
              <p style={{ color: "#94a3b8", fontSize: "0.88rem" }}>Chọn sinh viên để xem hồ sơ chi tiết</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentProfiles;
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BookOpenCheck, Loader2, Phone, RefreshCw, Search, UserCheck } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import advisorService from "../../services/advisorService";
import { getAcademicStatusConfig, getStudentDisplayName, isAtRiskStatus } from "./advisorStatus";

export function StudentProfiles() {
  const [searchParams] = useSearchParams();
  const searchParam = searchParams.get("search") || "";
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState(searchParam);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    setSearch(searchParam);
  }, [searchParam]);
  const [selectedId, setSelectedId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const { showToast } = useToast();

  const fetchStudents = useCallback(async () => {
    try {
      setLoadingStudents(true);
      setLoadError(false);
      const data = await advisorService.getMyStudents();
      const nextStudents = Array.isArray(data) ? data : [];
      setStudents(nextStudents);
      setSelectedId((current) => current || nextStudents[0]?.studentId || null);
    } catch {
      setLoadError(true);
      showToast("error", "Lỗi", "Không thể tải danh sách sinh viên do bạn phụ trách.");
    } finally {
      setLoadingStudents(false);
    }
  }, [showToast]);

  const fetchProfile = useCallback(async (id) => {
    try {
      setLoadingProfile(true);
      const data = await advisorService.getStudentProfile(id);
      setProfile(data);
    } catch {
      showToast("error", "Lỗi", "Không thể tải hồ sơ chi tiết của sinh viên.");
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }, [showToast]);

  useEffect(() => {
    void fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    if (selectedId) {
      void fetchProfile(selectedId);
    } else {
      setProfile(null);
    }
  }, [fetchProfile, selectedId]);

  const filtered = useMemo(() => students.filter(
    (s) =>
      getStudentDisplayName(s).toLowerCase().includes(deferredSearch.toLowerCase()) ||
      s.studentCode?.toLowerCase().includes(deferredSearch.toLowerCase())
  ), [deferredSearch, students]);

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
            ) : loadError ? (
              <div className="px-4 py-10 text-center">
                <AlertTriangle className="mx-auto mb-3 text-red-500" size={28} />
                <p className="text-sm text-slate-600">Không thể tải danh sách sinh viên</p>
                <button onClick={fetchStudents} className="mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold">
                  <RefreshCw size={14} /> Tải lại
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-sm text-slate-500">
                Không tìm thấy sinh viên nào
              </div>
            ) : filtered.map((s) => {
              const cfg = getAcademicStatusConfig(s.academicStatus);
              const displayName = getStudentDisplayName(s);
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
                      {displayName.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "#1e293b" }} className="truncate">{displayName}</p>
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
                    {getStudentDisplayName(profile).charAt(0)}
                  </div>
                  <div>
                    <h2 style={{ color: "#1e293b" }}>{getStudentDisplayName(profile)}</h2>
                    <p style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#64748b" }}>{profile.studentCode}</p>
                    <span style={{ display: "inline-block", marginTop: 4, fontSize: "0.7rem", fontWeight: 700, padding: "2px 9px", borderRadius: 9999, backgroundColor: getAcademicStatusConfig(profile.academicStatus).bg, color: getAcademicStatusConfig(profile.academicStatus).color }}>
                      {getAcademicStatusConfig(profile.academicStatus).label}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { label: "GPA", value: profile.gpa || "N/A", color: (profile.gpa || 0) < 5 ? "#ef4444" : (profile.gpa || 0) < 7 ? "#f59e0b" : "#10b981" },
                    { label: "Tín chỉ đạt", value: profile.passedCredits || 0, color: "#2563eb" },
                    { label: "Môn rớt", value: profile.failedCourses || 0, color: "#ef4444" },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <p style={{ fontSize: "1.3rem", fontWeight: 800, color }}>{value}</p>
                      <p style={{ fontSize: "0.68rem", color: "#94a3b8" }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warnings */}
              {isAtRiskStatus(profile.academicStatus) && (
                <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: "#fef3c7", border: "1px solid #fde68a" }}>
                  <AlertTriangle size={16} color="#f59e0b" style={{ marginTop: 1, flexShrink: 0 }} />
                  <p style={{ fontSize: "0.82rem", color: "#92400e" }}>
                    Sinh viên đang có tình trạng học vụ <strong>{getAcademicStatusConfig(profile.academicStatus).label}</strong>. Cần tư vấn và theo dõi đặc biệt.
                  </p>
                </div>
              )}

              <div className="rounded-2xl p-5" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
                <p style={{ fontWeight: 700, fontSize: "0.92rem", color: "#1e293b", marginBottom: 12 }}>Thông tin liên hệ</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoItem label="Email" value={profile.email || "—"} icon={UserCheck} />
                  <InfoItem label="Số điện thoại" value={profile.phone || "—"} icon={Phone} />
                  <InfoItem label="Tín chỉ đã đạt" value={`${profile.passedCredits || 0} tín chỉ`} icon={BookOpenCheck} />
                  <InfoItem label="Số môn chưa đạt" value={`${profile.failedCourses || 0} môn`} icon={AlertTriangle} />
                </div>
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

function InfoItem({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-500">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

export default StudentProfiles;

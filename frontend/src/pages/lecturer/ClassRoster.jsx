import { useState, useEffect } from "react";
import { Search, Download, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import lecturerService from "../../services/lecturerService";

const STATUS = {
  ACTIVE:  { label: "Bình thường", color: "#10b981", bg: "#d1fae5" },
  SUSPENDED: { label: "Đình chỉ",    color: "#f59e0b", bg: "#fef3c7" },
  DROPPED_OUT: { label: "Thôi học",    color: "#ef4444", bg: "#fee2e2" },
};

export function ClassRoster() {
  const [searchParams] = useSearchParams();
  const searchParam = searchParams.get("search") || "";
  const [classes, setClasses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState(searchParam);

  useEffect(() => {
    setSearch(searchParam);
  }, [searchParam]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selected) {
      fetchRoster(selected);
    }
  }, [selected]);

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const data = await lecturerService.getMyTimetable();
      // Filter out duplicate sections if the timetable has multiple sessions per week
      const uniqueClasses = [];
      const seen = new Set();
      data.forEach(item => {
        if (!seen.has(item.courseSectionId)) {
          seen.add(item.courseSectionId);
          uniqueClasses.push({
            id: item.courseSectionId,
            code: item.courseSectionCode || item.courseCode,
            name: item.courseName,
            semesterCode: item.semesterCode,
            capacity: item.capacity,
            enrolled: item.enrolledCount
          });
        }
      });
      setClasses(uniqueClasses);
      if (uniqueClasses.length > 0) {
        setSelected(uniqueClasses[0].id);
      }
    } catch (error) {
      showToast("error", "Lỗi", "Không thể tải danh sách lớp học phần");
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchRoster = async (sectionId) => {
    try {
      setLoadingRoster(true);
      const data = await lecturerService.getClassRoster(sectionId);
      setStudents(data.students || []);
    } catch (error) {
      showToast("error", "Lỗi", "Không thể tải danh sách sinh viên");
      setStudents([]);
    } finally {
      setLoadingRoster(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.studentCode?.toLowerCase().includes(search.toLowerCase())
  );

  const cls = classes.find((c) => c.id === selected);

  return (
    <div className="space-y-5">
      <div>
        <h1 style={{ color: "#1e293b" }}>Danh sách Lớp</h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 2 }}>
          Xem danh sách sinh viên đã đăng ký từng lớp học phần
        </p>
      </div>

      {loadingClasses ? (
        <div className="flex justify-center py-4">
          <Loader2 className="animate-spin text-blue-600" size={24} />
        </div>
      ) : classes.length === 0 ? (
        <div className="p-4 bg-white rounded-xl border text-slate-500 text-sm">
          Bạn chưa được phân công lớp nào.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {classes.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                style={{
                  padding: "8px 16px", borderRadius: 12, fontSize: "0.82rem",
                  backgroundColor: selected === c.id ? "#4c1d95" : "#fff",
                  color: selected === c.id ? "#fff" : "#334155",
                  border: `1px solid ${selected === c.id ? "#4c1d95" : "#e2e8f0"}`,
                  cursor: "pointer", fontWeight: selected === c.id ? 600 : 400,
                }}
              >
                {c.code}
                <span style={{ marginLeft: 6, opacity: 0.7, fontSize: "0.72rem" }}>({c.enrolled || 0})</span>
              </button>
            ))}
          </div>

          <div className="rounded-2xl" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
            <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b" }}>{cls?.name}</p>
                <p style={{ fontSize: "0.72rem", color: "#64748b" }}>{students.length} sinh viên</p>
              </div>
              <div className="flex gap-2">
                <div style={{ position: "relative" }}>
                  <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    placeholder="Tìm sinh viên…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "0.82rem", outline: "none", width: 200 }}
                  />
                </div>
                <button className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ border: "1px solid #e2e8f0", background: "none", cursor: "pointer", fontSize: "0.78rem", color: "#475569" }}>
                  <Download size={13} /> Xuất
                </button>
              </div>
            </div>

            {loadingRoster ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-purple-600" size={32} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc" }}>
                      {["#", "MSSV", "Họ và tên", "Email", "Trạng thái"].map((h) => (
                        <th key={h} className="text-left px-4 py-3" style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-4 text-sm text-slate-500">Không có dữ liệu</td></tr>
                    ) : filteredStudents.map((s, i) => {
                      const st = STATUS[s.academicStatus] ?? STATUS.ACTIVE;
                      return (
                        <tr key={s.studentId} style={{ borderTop: "1px solid #f1f5f9" }}>
                          <td className="px-4 py-3" style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{i + 1}</td>
                          <td className="px-4 py-3" style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#8b5cf6", fontWeight: 600 }}>{s.studentCode}</td>
                          <td className="px-4 py-3" style={{ fontSize: "0.85rem", color: "#1e293b", fontWeight: 500 }}>{s.fullName}</td>
                          <td className="px-4 py-3" style={{ fontSize: "0.78rem", color: "#64748b" }}>{s.email}</td>
                          <td className="px-4 py-3">
                            <span style={{ fontSize: "0.7rem", fontWeight: 600, padding: "2px 8px", borderRadius: 9999, backgroundColor: st.bg, color: st.color }}>
                              {st.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ClassRoster;
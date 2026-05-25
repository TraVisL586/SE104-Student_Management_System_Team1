import { useState, useEffect } from "react";
import { CheckSquare, Save, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import lecturerService from "../../services/lecturerService";

const STATUS_OPTS = [
  { key: "PRESENT", label: "Có mặt", color: "#10b981", bg: "#d1fae5" },
  { key: "LATE",    label: "Đi trễ", color: "#f59e0b", bg: "#fef3c7" },
  { key: "ABSENT",  label: "Vắng",   color: "#ef4444", bg: "#fee2e2" },
];

export function Attendance() {
  const [classes, setClasses] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState({});
  const [students, setStudents] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedSection && date) {
      fetchAttendance(selectedSection, date);
    }
  }, [selectedSection, date]);

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const ttData = await lecturerService.getMyTimetable();
      const uniqueClasses = [];
      const seen = new Set();
      ttData.forEach(item => {
        if (!seen.has(item.courseSectionId)) {
          seen.add(item.courseSectionId);
          uniqueClasses.push({
            id: item.courseSectionId,
            code: item.courseSectionCode || item.courseCode,
            name: item.courseName,
            semesterCode: item.semesterCode,
          });
        }
      });
      setClasses(uniqueClasses);
      if (uniqueClasses.length > 0) {
        setSelectedSection(uniqueClasses[0].id);
      }
    } catch (error) {
      showToast("error", "Lỗi", "Không thể tải danh sách lớp");
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchAttendance = async (sectionId, dateStr) => {
    try {
      setLoadingAttendance(true);
      const [rosterRes, attendanceRes] = await Promise.all([
        lecturerService.getClassRoster(sectionId).catch(() => ({ students: [] })),
        lecturerService.getAttendance(sectionId, dateStr).catch(() => ({ records: [] }))
      ]);

      const stuList = rosterRes?.students || [];
      const attendanceRecords = attendanceRes?.records || attendanceRes?.attendances || [];

      // Map students from roster
      const studentsFromRoster = stuList.map(s => ({
        studentId: s.studentId,
        studentCode: s.studentCode,
        studentName: s.fullName || s.studentName,
      }));
      setStudents(studentsFromRoster);

      // Merge attendance statuses
      const newRecords = {};
      
      // Default all to PRESENT
      studentsFromRoster.forEach(s => {
        newRecords[s.studentId] = "PRESENT";
      });

      // Override with recorded statuses if they exist
      attendanceRecords.forEach(r => {
        if (r.studentId) {
          newRecords[r.studentId] = r.status || "PRESENT";
        }
      });
      
      setRecords(newRecords);
    } catch (error) {
      setStudents([]);
      setRecords({});
    } finally {
      setLoadingAttendance(false);
    }
  };

  const stats = {
    PRESENT: Object.values(records).filter((v) => v === "PRESENT").length,
    LATE:    Object.values(records).filter((v) => v === "LATE").length,
    ABSENT:  Object.values(records).filter((v) => v === "ABSENT").length,
  };

  const markAll = (status) => {
    const newRecords = {};
    students.forEach(s => { newRecords[s.studentId] = status; });
    setRecords(newRecords);
  };

  const save = async () => {
    try {
      setSubmitting(true);
      const attendanceData = {
        attendanceDate: date,
        records: students.map(s => ({
          studentId: s.studentId,
          status: records[s.studentId] || "PRESENT",
        })),
      };
      await lecturerService.recordAttendance(selectedSection, attendanceData);
      const cls = classes.find(c => c.id === selectedSection);
      showToast("success", "Lưu điểm danh thành công!", `${cls?.name} · ${date} · ${stats.PRESENT} có mặt`);
    } catch (error) {
      showToast("error", "Lỗi", "Không thể lưu điểm danh");
    } finally {
      setSubmitting(false);
    }
  };

  const cls = classes.find(c => c.id === selectedSection);

  return (
    <div className="space-y-5">
      <div>
        <h1 style={{ color: "#1e293b" }}>Điểm danh</h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 2 }}>
          Ghi nhận điểm danh sinh viên theo từng buổi học
        </p>
      </div>

      {loadingClasses ? (
        <div className="flex justify-center py-4">
          <Loader2 className="animate-spin text-purple-600" size={24} />
        </div>
      ) : classes.length === 0 ? (
        <div className="p-4 bg-white rounded-xl border text-slate-500 text-sm">
          Bạn chưa được phân công lớp nào.
        </div>
      ) : (
        <>
          {/* Selectors */}
          <div className="flex flex-wrap gap-4">
            <div>
              <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Lớp học phần</p>
              <div className="flex gap-2 flex-wrap">
                {classes.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedSection(c.id)}
                    style={{
                      padding: "7px 14px", borderRadius: 10, fontSize: "0.8rem",
                      backgroundColor: selectedSection === c.id ? "#4c1d95" : "#fff",
                      color: selectedSection === c.id ? "#fff" : "#334155",
                      border: `1px solid ${selectedSection === c.id ? "#4c1d95" : "#e2e8f0"}`,
                      cursor: "pointer",
                    }}
                  >
                    {c.code}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Ngày điểm danh</p>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="p-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Session info */}
          <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
            <CheckSquare size={16} color="#2563eb" />
            <p style={{ fontSize: "0.82rem", color: "#1e40af" }}>
              <strong>{cls?.name}</strong> · {cls?.code} · Ngày {date}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {STATUS_OPTS.map(({ key, label, color, bg }) => (
              <div key={key} className="rounded-xl p-3 text-center" style={{ backgroundColor: bg }}>
                <p style={{ fontSize: "1.4rem", fontWeight: 800, color }}>{stats[key] || 0}</p>
                <p style={{ fontSize: "0.72rem", color, fontWeight: 600 }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="flex gap-2">
            <p style={{ fontSize: "0.8rem", color: "#64748b", alignSelf: "center" }}>Đánh dấu tất cả:</p>
            {STATUS_OPTS.map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => markAll(key)}
                style={{
                  padding: "5px 12px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 600,
                  color, border: `1px solid ${color}40`, backgroundColor: `${color}15`, cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Attendance table */}
          {loadingAttendance ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-purple-600" size={32} />
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc" }}>
                    {["#", "MSSV", "Họ và tên", "Trạng thái", "Ghi chú"].map((h) => (
                      <th key={h} className="text-left px-4 py-3" style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-6 text-sm text-slate-500">Không có sinh viên</td></tr>
                  ) : students.map((s, i) => {
                    const status = records[s.studentId] || "PRESENT";
                    const opt = STATUS_OPTS.find((o) => o.key === status);
                    return (
                      <tr key={s.studentId} style={{ borderTop: "1px solid #f1f5f9" }}>
                        <td className="px-4 py-3" style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{i + 1}</td>
                        <td className="px-4 py-3" style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#8b5cf6", fontWeight: 600 }}>{s.studentCode}</td>
                        <td className="px-4 py-3" style={{ fontSize: "0.85rem", color: "#1e293b" }}>{s.studentName}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            {STATUS_OPTS.map((o) => (
                              <button
                                key={o.key}
                                onClick={() => setRecords((p) => ({ ...p, [s.studentId]: o.key }))}
                                style={{
                                  padding: "3px 10px", borderRadius: 8, fontSize: "0.72rem", fontWeight: 600,
                                  backgroundColor: status === o.key ? o.bg : "#f8fafc",
                                  color: status === o.key ? o.color : "#94a3b8",
                                  border: `1px solid ${status === o.key ? o.color : "#e2e8f0"}`,
                                  cursor: "pointer",
                                }}
                              >
                                {o.label}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {status === "ABSENT" && (
                            <span className="flex items-center gap-1" style={{ fontSize: "0.7rem", color: "#ef4444" }}>
                              <AlertTriangle size={11} /> Vắng không phép
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={save}
              disabled={submitting || students.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl disabled:opacity-50"
              style={{ backgroundColor: "#4c1d95", color: "white", border: "none", cursor: "pointer", fontSize: "0.88rem", fontWeight: 600 }}
            >
              {submitting ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />} Lưu điểm danh
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Attendance;
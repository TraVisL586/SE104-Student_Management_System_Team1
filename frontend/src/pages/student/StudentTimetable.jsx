import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import timetableService from "../../services/timetableService";
import { getCurrentSemesterInfo } from "../../utils/dateUtils";

const DAYS   = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
const SLOTS  = [
  { id: 1, label: "Tiết 1-3",  time: "07:30 – 09:45" },
  { id: 2, label: "Tiết 4-6",  time: "10:00 – 12:15" },
  { id: 3, label: "Tiết 7-9",  time: "13:00 – 15:15" },
  { id: 4, label: "Tiết 10-12",time: "15:30 – 17:45" },
];

// We will use getCurrentSemesterInfo from dateUtils to get the week and semesterStart

export function StudentTimetable() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const { academicYear, semesterName, maxWeeks, week: initialWeek, semesterStart } = getCurrentSemesterInfo();
  const [week, setWeek] = useState(initialWeek);
  const { showToast } = useToast();

  // Calculate dates dynamically based on week number
  const DATES = (() => {
    const daysOffset = (week - 1) * 7;
    const weekStart = new Date(semesterStart);
    weekStart.setDate(weekStart.getDate() + daysOffset);
    
    const dates = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      dates.push(`${date.getDate()}/${date.getMonth() + 1}`);
    }
    return dates;
  })();

  useEffect(() => {
    loadTimetable();
  }, []);

  const loadTimetable = useCallback(async () => {
    try {
      setLoading(true);
      const data = await timetableService.getStudentTimetable();
      const formatted = (Array.isArray(data) ? data : []).map((sch) => {
        let day = (sch.dayOfWeek || 1) - 1;
        
        let slot = 1;
        const startTimeStr = String(sch.startTime || "07:30");
        if (startTimeStr.startsWith("07")) slot = 1;
        else if (startTimeStr.startsWith("10")) slot = 2;
        else if (startTimeStr.startsWith("13")) slot = 3;
        else if (startTimeStr.startsWith("15")) slot = 4;
        
        const nameLower = String(sch.courseName || "").toLowerCase();
        const codeLower = String(sch.courseCode || "").toLowerCase();
        
        let color = "#dbeafe";
        let border = "#2563eb";
        let type = "theory";
        
        if (nameLower.includes("thực hành") || nameLower.includes("lab") || codeLower.includes("lab")) {
          color = "#ede9fe";
          border = "#8b5cf6";
          type = "lab";
        } else if (nameLower.includes("tiếng anh") || nameLower.includes("anh văn") || nameLower.includes("english") || codeLower.startsWith("eng")) {
          color = "#d1fae5";
          border = "#10b981";
          type = "language";
        }

        return {
          ...sch,
          day,
          slot,
          code: sch.courseCode || sch.courseSectionCode,
          name: sch.courseName,
          room: sch.roomCode || sch.roomName || "N/A",
          gv: sch.lecturerName || "N/A",
          color,
          border,
          type
        };
      });
      setSchedule(formatted);
    } catch (err) {
      setSchedule([]);
      const message = err?.data?.message || err?.message || "Không thể tải thời khóa biểu.";
      showToast("error", "Lỗi tải dữ liệu", message);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  function getCell(day, slot) {
    return schedule.find((s) => s.day === day && s.slot === slot);
  }

  // Calculate summary stats
  const summaryStats = {
    courses: new Set(schedule.map(s => s.code || s.courseCode)).size,
    totalSlots: schedule.length,
    totalCredits: schedule.reduce((sum, s) => sum + (s.credits || 0), 0),
    labSessions: schedule.filter(s => s.type === 'lab' || s.type === 'LAB').length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 style={{ color: "#1e293b" }}>Thời khóa biểu</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 2 }}>
            {semesterName} — {academicYear} · Tuần {week}/{maxWeeks}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeek((w) => Math.max(1, w - 1))} disabled={loading} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1 }}>
            <ChevronLeft size={16} color="#475569" />
          </button>
          <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1e293b", padding: "0 8px" }}>
            Tuần {week}: {DATES[0]} – {DATES[5]}
          </span>
          <button onClick={() => setWeek((w) => Math.min(maxWeeks, w + 1))} disabled={loading} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1 }}>
            <ChevronRight size={16} color="#475569" />
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
          Đang tải thời khóa biểu...
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        {[
          { label: "Lý thuyết", color: "#2563eb", bg: "#dbeafe" },
          { label: "Thực hành", color: "#8b5cf6", bg: "#ede9fe" },
          { label: "Ngoại ngữ", color: "#10b981", bg: "#d1fae5" },
        ].map(({ label, color, bg }) => (
          <div key={label} className="flex items-center gap-2">
            <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: bg, border: `2px solid ${color}` }} />
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Timetable grid */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 700 }}>
            <thead>
              <tr style={{ backgroundColor: "#1a3461" }}>
                <th style={{ width: 110, padding: "12px 16px", textAlign: "left", fontSize: "0.72rem", color: "#93c5fd", fontWeight: 700 }}>
                  Ca học
                </th>
                {DAYS.map((d, i) => (
                  <th key={d} style={{ padding: "12px 8px", textAlign: "center", fontSize: "0.78rem", color: "white", fontWeight: 700 }}>
                    <p>{d}</p>
                    <p style={{ fontSize: "0.68rem", color: "#93c5fd", fontWeight: 400 }}>{DATES[i]}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((slot) => (
                <tr key={slot.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 16px", backgroundColor: "#f8fafc" }}>
                    <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1e293b" }}>{slot.label}</p>
                    <p style={{ fontSize: "0.65rem", color: "#94a3b8" }}>{slot.time}</p>
                  </td>
                  {DAYS.map((_, di) => {
                    const cell = getCell(di, slot.id);
                    return (
                      <td key={di} style={{ padding: 6, verticalAlign: "top", minWidth: 100 }}>
                        {cell ? (
                          <div style={{
                            backgroundColor: cell.color,
                            border: `1.5px solid ${cell.border}`,
                            borderRadius: 10, padding: "8px 10px",
                          }}>
                            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: cell.border, fontFamily: "monospace" }}>
                              {cell.code}
                            </p>
                            <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#1e293b", marginTop: 2, lineHeight: 1.3 }}>
                              {cell.name}
                            </p>
                            <div className="flex items-center gap-1 mt-1.5">
                              <Calendar size={10} color="#94a3b8" />
                              <p style={{ fontSize: "0.65rem", color: "#64748b" }}>{cell.room}</p>
                            </div>
                          </div>
                        ) : (
                          <div style={{ height: 60 }} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Môn học",       value: `${summaryStats.courses} môn`, color: "#2563eb" },
          { label: "Tiết/tuần",     value: `${summaryStats.totalSlots * 3} tiết`, color: "#8b5cf6" },
          { label: "Tín chỉ HK",    value: `${summaryStats.totalCredits} TC`,   color: "#10b981" },
          { label: "Phòng Lab",     value: `${summaryStats.labSessions} buổi`,  color: "#f59e0b" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl px-4 py-3 text-center" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: "1.1rem", fontWeight: 700, color }}>{value}</p>
            <p style={{ fontSize: "0.72rem", color: "#64748b" }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


export default StudentTimetable;
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import timetableService from "../../services/timetableService";
import lecturerService from "../../services/lecturerService";

const DAYS  = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
const SLOTS  = [
  { id: 1, label: "Tiết 1-3",  time: "07:30 – 09:45" },
  { id: 2, label: "Tiết 4-6",  time: "10:00 – 12:15" },
  { id: 3, label: "Tiết 7-9",  time: "13:00 – 15:15" },
  { id: 4, label: "Tiết 10-12",time: "15:30 – 17:45" },
];

// Calculate current week from today's date
const getCurrentWeek = () => {
  const semesterStart = new Date(2025, 8, 1); // Sept 1, 2025 (Week 1)
  const today = new Date();
  const daysElapsed = Math.floor((today - semesterStart) / (1000 * 60 * 60 * 24));
  const week = Math.floor(daysElapsed / 7) + 1;
  return Math.max(1, Math.min(week, 28)); // Clamp between 1-28
};

export function LecturerTimetable() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [week, setWeek] = useState(getCurrentWeek()); // Current week, not hardcoded
  const { showToast } = useToast();

  // Calculate dates dynamically based on week number
  // Semester starts week 1 on Sept 1, 2025 (Monday)
  const DATES = (() => {
    const semesterStart = new Date(2025, 8, 1); // Sept 1, 2025
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
      const data = await timetableService.getLecturerTimetable();
      const rawList = Array.isArray(data) ? data : [];
      
      // Get unique sectionIds
      const uniqueSectionIds = [...new Set(rawList.map(item => item.courseSectionId || item.sectionId).filter(Boolean))];
      
      // Fetch rosters for these sections in parallel to get enrolledCount
      const rosterMap = {};
      try {
        const rosters = await Promise.all(
          uniqueSectionIds.map(async (id) => {
            try {
              const roster = await lecturerService.getClassRoster(id);
              return { id, enrolledCount: roster?.enrolledCount || roster?.students?.length || 0 };
            } catch (err) {
              console.error(`Failed to fetch roster for section ${id}`, err);
              return { id, enrolledCount: 0 };
            }
          })
        );
        rosters.forEach(r => {
          rosterMap[r.id] = r.enrolledCount;
        });
      } catch (err) {
        console.error("Error fetching class rosters", err);
      }

      // Map raw entries to timetable format
      const formatted = rawList.map((sch) => {
        let day = (sch.dayOfWeek || 1) - 1;
        
        let slot = 1;
        const startTimeStr = String(sch.startTime || "07:30");
        if (startTimeStr.startsWith("07")) slot = 1;
        else if (startTimeStr.startsWith("10")) slot = 2;
        else if (startTimeStr.startsWith("13")) slot = 3;
        else if (startTimeStr.startsWith("15")) slot = 4;
        
        const isLab = String(sch.courseName || "").toLowerCase().includes("thực hành") || 
                      String(sch.courseName || "").toLowerCase().includes("lab") ||
                      String(sch.courseCode || "").toLowerCase().includes("lab");
        
        const color = isLab ? "#f5f3ff" : "#ede9fe";
        const border = isLab ? "#7c3aed" : "#8b5cf6";

        const sectionId = sch.courseSectionId || sch.sectionId;
        const enrolledCount = rosterMap[sectionId] !== undefined ? rosterMap[sectionId] : (sch.enrolledCount || 0);

        return {
          ...sch,
          day,
          slot,
          code: sch.courseSectionCode || sch.sectionCode || sch.courseCode,
          name: sch.courseName,
          room: sch.roomCode || sch.roomName || "N/A",
          sv: enrolledCount,
          color,
          border
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
    classes: new Set(schedule.map(s => s.code || s.sectionCode)).size,
    totalStudents: schedule.reduce((sum, s) => sum + (s.sv || s.enrolledCount || 0), 0),
    totalSlots: schedule.length,
    totalDays: new Set(schedule.map(s => s.day)).size,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 style={{ color: "#1e293b" }}>Lịch giảng dạy</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 2 }}>
            Học kỳ 2 — 2025/2026 · Tuần {week}/28
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeek((w) => Math.max(1, w - 1))} disabled={loading} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1 }}>
            <ChevronLeft size={16} color="#475569" />
          </button>
          <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1e293b", padding: "0 8px" }}>
            Tuần {week}: {DATES[0]}–{DATES[4]}/2026
          </span>
          <button onClick={() => setWeek((w) => Math.min(28, w + 1))} disabled={loading} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1 }}>
            <ChevronRight size={16} color="#475569" />
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
          Đang tải lịch giảng dạy...
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 620 }}>
            <thead>
              <tr style={{ backgroundColor: "#4c1d95" }}>
                <th style={{ width: 110, padding: "12px 16px", textAlign: "left", fontSize: "0.72rem", color: "#c4b5fd", fontWeight: 700 }}>
                  Ca học
                </th>
                {DAYS.map((d, i) => (
                  <th key={d} style={{ padding: "12px 8px", textAlign: "center", fontSize: "0.78rem", color: "white", fontWeight: 700 }}>
                    <p>{d}</p>
                    <p style={{ fontSize: "0.68rem", color: "#c4b5fd", fontWeight: 400 }}>{DATES[i]}</p>
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
                      <td key={di} style={{ padding: 6, verticalAlign: "top", minWidth: 120 }}>
                        {cell ? (
                          <div style={{ backgroundColor: cell.color, border: `1.5px solid ${cell.border}`, borderRadius: 10, padding: "8px 10px" }}>
                            <p style={{ fontSize: "0.68rem", fontWeight: 700, color: cell.border, fontFamily: "monospace" }}>{cell.code}</p>
                            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#1e293b", marginTop: 2, lineHeight: 1.3 }}>{cell.name}</p>
                            <div className="flex items-center gap-1 mt-1.5">
                              <Users size={10} color="#94a3b8" />
                              <p style={{ fontSize: "0.65rem", color: "#64748b" }}>{cell.sv} SV · {cell.room}</p>
                            </div>
                          </div>
                        ) : (
                          <div style={{ height: 64 }} />
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Lớp học",      value: `${summaryStats.classes} lớp`,   color: "#8b5cf6" },
          { label: "Tổng SV",     value: `${summaryStats.totalStudents} SV`,  color: "#2563eb" },
          { label: "Tiết/tuần",   value: `${summaryStats.totalSlots * 3} tiết`, color: "#10b981" },
          { label: "Ngày dạy",    value: `${summaryStats.totalDays} ngày`,  color: "#f59e0b" },
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

export default LecturerTimetable;
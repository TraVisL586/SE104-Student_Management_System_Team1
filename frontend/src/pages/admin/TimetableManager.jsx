import { useState, useEffect, useCallback, useMemo } from "react";
import {
  AlertTriangle,
  Building2,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  Clock3,
  DoorOpen,
  GripVertical,
  Layers3,
  Plus,
  Search,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import adminSchedulingService from "../../services/adminSchedulingService";

const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
const SLOTS = [
  { id: 1, label: "Tiết 1-3", time: "07:30-09:45" },
  { id: 2, label: "Tiết 4-6", time: "10:00-12:15" },
  { id: 3, label: "Tiết 7-9", time: "13:00-15:15" },
  { id: 4, label: "Tiết 10-12", time: "15:30-17:45" },
];

const COLORS = ["#dbeafe", "#e0f2fe", "#dcfce7", "#fef3c7"];
const BORDERS = ["#2563eb", "#0284c7", "#16a34a", "#d97706"];
const DEFAULT_ROOMS = ["A101", "A102", "B201", "B202", "C301"];
const VIEW_OPTIONS = [
  { id: "room", label: "View by Room", icon: DoorOpen },
  { id: "lecturer", label: "View by Lecturer", icon: UserRound },
  { id: "weekly", label: "View by Class/Weekly", icon: CalendarRange },
];

const shell = {
  card: {
    background: "#fff",
    border: "1px solid #dbe3ef",
    borderRadius: 14,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
  },
  label: {
    display: "block",
    marginBottom: 5,
    color: "#475569",
    fontSize: "0.68rem",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.02em",
  },
};

const getCurrentWeek = () => {
  const semesterStart = new Date(2025, 8, 1);
  const today = new Date();
  const daysElapsed = Math.floor((today - semesterStart) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.min(Math.floor(daysElapsed / 7) + 1, 28));
};

const getSlotId = (startTime) => {
  const value = String(startTime || "07:30");
  if (value.startsWith("10")) return 2;
  if (value.startsWith("13")) return 3;
  if (value.startsWith("15")) return 4;
  return 1;
};

const compactName = (value, fallback = "N/A") => value || fallback;

export function TimetableManager() {
  const [schedule, setSchedule] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState("weekly");
  const [filters, setFilters] = useState({
    year: "2025/2026",
    semester: "Semester 2",
    faculty: "All faculties",
    building: "All buildings",
  });
  const [form, setForm] = useState({ day: 0, slot: 1, room: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sectionId, setSectionId] = useState(null);
  const [week, setWeek] = useState(getCurrentWeek());
  const { showToast } = useToast();

  const dates = useMemo(() => {
    const semesterStart = new Date(2025, 8, 1);
    const weekStart = new Date(semesterStart);
    weekStart.setDate(weekStart.getDate() + (week - 1) * 7);

    return DAYS.map((_, index) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + index);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });
  }, [week]);

  const loadTimetable = useCallback(async () => {
    try {
      setLoading(true);
      const courseSections = await adminSchedulingService.getCourseSections();
      if (!Array.isArray(courseSections)) {
        setSections([]);
        setSchedule([]);
        return;
      }

      const formattedSchedules = [];
      courseSections.forEach((sec) => {
        if (!Array.isArray(sec.schedules)) return;

        sec.schedules.forEach((sch) => {
          const index = formattedSchedules.length % COLORS.length;
          formattedSchedules.push({
            id: sch.id,
            sectionId: sec.id,
            day: (sch.dayOfWeek || 1) - 1,
            slot: getSlotId(sch.startTime),
            code: sec.code || sec.courseCode || `SEC-${sec.id}`,
            name: sec.courseName || sec.name || "Untitled course",
            room: sch.roomCode || sch.roomName || "N/A",
            gv: sec.lecturerName || sec.lecturer || "Unassigned lecturer",
            size: sec.classSize || sec.capacity || sec.maxStudents || sec.enrolledCount || "-",
            color: COLORS[index],
            border: BORDERS[index],
          });
        });
      });

      setSections(courseSections);
      setSchedule(formattedSchedules);
    } catch (err) {
      setSections([]);
      setSchedule([]);
      const message = err?.data?.message || err?.message || "Không thể tải thời khóa biểu.";
      showToast("error", "Lỗi tải dữ liệu", message);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void (async () => {
      await loadTimetable();
    })();
  }, [loadTimetable]);

  const conflicts = useMemo(() => {
    const conflictIds = new Set();
    const details = {};
    const groups = new Map();

    schedule.forEach((entry) => {
      [
        ["room", entry.room],
        ["lecturer", entry.gv],
      ].forEach(([type, value]) => {
        const key = `${entry.day}-${entry.slot}-${type}-${value}`;
        const current = groups.get(key) || [];
        current.push(entry);
        groups.set(key, current);
      });
    });

    groups.forEach((entries, key) => {
      if (entries.length < 2) return;
      const [, , type] = key.split("-");
      entries.forEach((entry) => {
        conflictIds.add(entry.id);
        const other = entries.find((item) => item.id !== entry.id);
        details[entry.id] =
            type === "room"
                ? `Room ${entry.room} overlapped with ${other?.code || "another section"}`
                : `Lecturer ${entry.gv} overlapped with ${other?.code || "another section"}`;
      });
    });

    return { ids: conflictIds, details };
  }, [schedule]);

  const unassignedCourses = useMemo(
      () =>
          sections
              .filter((section) => !Array.isArray(section.schedules) || section.schedules.length === 0)
              .map((section) => ({
                id: section.id,
                code: section.code || section.courseCode || `SEC-${section.id}`,
                name: section.courseName || section.name || "Untitled course",
                gv: section.lecturerName || section.lecturer || "Unassigned lecturer",
                size: section.classSize || section.capacity || section.maxStudents || "-",
                faculty: section.departmentName || section.facultyName || "General",
              })),
      [sections]
  );

  const rooms = useMemo(
      () => Array.from(new Set([...DEFAULT_ROOMS, ...schedule.map((entry) => entry.room).filter(Boolean)])).sort(),
      [schedule]
  );

  const lecturers = useMemo(
      () => Array.from(new Set(schedule.map((entry) => entry.gv).filter(Boolean))).sort(),
      [schedule]
  );

  const stats = useMemo(
      () => [
        { label: "Unassigned", value: unassignedCourses.length, color: "#b45309" },
        { label: "Conflicts", value: conflicts.ids.size, color: "#dc2626" },
        { label: "Rooms used", value: new Set(schedule.map((entry) => entry.room)).size, color: "#1d4ed8" },
        { label: "Scheduled", value: schedule.length, color: "#047857" },
      ],
      [conflicts.ids.size, schedule, unassignedCourses.length]
  );

  function entriesForWeeklyCell(day, slot) {
    return schedule.filter((entry) => entry.day === day && entry.slot === slot);
  }

  function entriesForResourceCell(resource, slot, field) {
    return schedule.filter((entry) => entry[field] === resource && entry.slot === slot);
  }

  function openQuickAdd(day, slot, room = "") {
    setForm({ day, slot, room });
    setShowForm(true);
  }

  function handleDrop(event, day, slot, room = "") {
    const droppedSectionId = event.dataTransfer.getData("sectionId");
    if (!droppedSectionId) return;

    setSectionId(Number(droppedSectionId));
    openQuickAdd(day, slot, room);
    showToast("info", "Ready to schedule", `Section ${droppedSectionId} selected. Confirm room before saving.`);
  }

  function addEntry(event) {
    event.preventDefault();
    const day = Number(form.day);
    const slot = Number(form.slot);
    const roomConflict = schedule.find((entry) => entry.day === day && entry.slot === slot && entry.room === form.room);

    if (roomConflict) {
      showToast(
          "error",
          "Conflict detected",
          `Room ${form.room} overlapped with ${roomConflict.code}. Choose another room or time slot.`
      );
      return;
    }

    addScheduleToApi();
  }

  const addScheduleToApi = async () => {
    try {
      setSubmitting(true);

      if (!sectionId) {
        showToast("warning", "Chưa nhập Section ID", "Vui lòng nhập Section ID trước khi thêm lịch học.");
        return;
      }

      if (!form.room) {
        showToast("warning", "Chưa nhập Room ID", "Vui lòng nhập Room ID (số) vào ô phòng học.");
        return;
      }

      const slotTimes = {
        1: { start: "07:30:00", end: "09:45:00" },
        2: { start: "10:00:00", end: "12:15:00" },
        3: { start: "13:00:00", end: "15:15:00" },
        4: { start: "15:30:00", end: "17:45:00" },
      };

      await adminSchedulingService.addCourseSectionSchedule(sectionId, {
        roomId: Number(form.room),
        dayOfWeek: Number(form.day) + 1,
        startTime: slotTimes[form.slot].start,
        endTime: slotTimes[form.slot].end,
      });

      showToast("success", "Đã thêm vào TKB", `Section ${sectionId} - ${DAYS[form.day]}`);
      setForm({ day: 0, slot: 1, room: "" });
      setShowForm(false);
      setSectionId(null);
      loadTimetable();
    } catch (err) {
      const message = err?.data?.message || err?.message || "Không thể thêm vào thời khóa biểu.";
      showToast("error", "Lỗi thêm dữ liệu", message);
    } finally {
      setSubmitting(false);
    }
  };

  function removeEntry(id) {
    const entry = schedule.find((item) => item.id === id);
    removeScheduleFromApi(id, entry);
  }

  const removeScheduleFromApi = async (id, entry) => {
    try {
      setSubmitting(true);
      if (entry?.sectionId) {
        await adminSchedulingService.removeCourseSectionSchedule(entry.sectionId, id);
      }

      showToast("info", "Đã xóa khỏi TKB", entry?.code || "Thành công");
      loadTimetable();
    } catch (err) {
      const message = err?.data?.message || err?.message || "Không thể xóa khỏi thời khóa biểu.";
      showToast("error", "Lỗi xóa dữ liệu", message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderScheduleCard = (entry, dense = false) => {
    const hasConflict = conflicts.ids.has(entry.id);
    return (
        <div
            key={entry.id}
            title={hasConflict ? `Conflict detected: ${conflicts.details[entry.id]}` : "Occupied"}
            style={{
              position: "relative",
              minHeight: dense ? 70 : 82,
              padding: dense ? "7px 8px" : "8px 10px",
              borderRadius: 8,
              border: `1.5px solid ${hasConflict ? "#dc2626" : entry.border}`,
              background: hasConflict ? "#fee2e2" : entry.color,
            }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 5, paddingRight: 22 }}>
            {hasConflict && <AlertTriangle size={13} color="#dc2626" />}
            <span style={{ color: hasConflict ? "#b91c1c" : entry.border, fontSize: "0.68rem", fontWeight: 900 }}>
            {entry.code}
          </span>
          </div>
          <p style={{ marginTop: 3, color: "#0f172a", fontSize: dense ? "0.68rem" : "0.72rem", fontWeight: 800, lineHeight: 1.25 }}>
            {entry.name}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
            {[
              ["Room", entry.room],
              ["Lecturer", entry.gv],
              ["Size", entry.size],
            ].map(([label, value]) => (
                <span
                    key={label}
                    style={{
                      padding: "2px 5px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.78)",
                      color: "#334155",
                      fontSize: "0.58rem",
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                >
              {label}: {value}
            </span>
            ))}
          </div>
          {hasConflict && (
              <p style={{ marginTop: 5, color: "#b91c1c", fontSize: "0.6rem", fontWeight: 800 }}>
                Conflict detected
              </p>
          )}
          <button
              onClick={() => removeEntry(entry.id)}
              disabled={submitting}
              title="Remove schedule"
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                width: 20,
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                borderRadius: 5,
                background: "rgba(255,255,255,0.86)",
              }}
          >
            <Trash2 size={11} color="#dc2626" />
          </button>
        </div>
    );
  };

  const renderEmptyCell = (day, slot, room = "") => (
      <div
          onClick={() => openQuickAdd(day, slot, room)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => handleDrop(event, day, slot, room)}
          title="Available - drop an unassigned course here"
          style={{
            minHeight: 72,
            border: "1.5px dashed #cbd5e1",
            borderRadius: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            color: "#64748b",
            background: "#f8fafc",
          }}
      >
        <Plus size={14} color="#94a3b8" />
        <span style={{ fontSize: "0.62rem", fontWeight: 800 }}>Available</span>
      </div>
  );

  const renderWeeklyGrid = () => (
      <table className="w-full" style={{ minWidth: 940, borderCollapse: "separate", borderSpacing: 0 }}>
        <thead>
        <tr style={{ background: "#0f2f4a" }}>
          <th style={{ width: 112, padding: "11px 12px", textAlign: "left", color: "#bfdbfe", fontSize: "0.68rem", fontWeight: 900 }}>
            Time slot
          </th>
          {DAYS.map((day, index) => (
              <th key={day} style={{ padding: "11px 8px", color: "#fff", textAlign: "center", fontSize: "0.72rem", fontWeight: 900 }}>
                {day}
                <span style={{ display: "block", marginTop: 2, color: "#bfdbfe", fontSize: "0.62rem" }}>{dates[index]}</span>
              </th>
          ))}
        </tr>
        </thead>
        <tbody>
        {SLOTS.map((slot) => (
            <tr key={slot.id}>
              <td style={{ padding: "9px 12px", borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
                <p style={{ color: "#0f172a", fontSize: "0.72rem", fontWeight: 900 }}>{slot.label}</p>
                <p style={{ color: "#64748b", fontSize: "0.62rem" }}>{slot.time}</p>
              </td>
              {DAYS.map((_, dayIndex) => {
                const entries = entriesForWeeklyCell(dayIndex, slot.id);
                return (
                    <td key={dayIndex} style={{ minWidth: 132, padding: 6, verticalAlign: "top", borderTop: "1px solid #e2e8f0" }}>
                      <div style={{ display: "grid", gap: 5 }}>
                        {entries.length ? entries.map((entry) => renderScheduleCard(entry, true)) : renderEmptyCell(dayIndex, slot.id)}
                      </div>
                    </td>
                );
              })}
            </tr>
        ))}
        </tbody>
      </table>
  );

  const renderResourceGrid = (resources, field, emptyLabel) => (
      <table className="w-full" style={{ minWidth: 880, borderCollapse: "separate", borderSpacing: 0 }}>
        <thead>
        <tr style={{ background: "#0f2f4a" }}>
          <th style={{ width: 150, padding: "11px 12px", textAlign: "left", color: "#bfdbfe", fontSize: "0.68rem", fontWeight: 900 }}>
            {emptyLabel}
          </th>
          {SLOTS.map((slot) => (
              <th key={slot.id} style={{ padding: "11px 8px", color: "#fff", textAlign: "center", fontSize: "0.72rem", fontWeight: 900 }}>
                {slot.label}
                <span style={{ display: "block", marginTop: 2, color: "#bfdbfe", fontSize: "0.62rem" }}>{slot.time}</span>
              </th>
          ))}
        </tr>
        </thead>
        <tbody>
        {(resources.length ? resources : ["Unassigned lecturer"]).map((resource) => (
            <tr key={resource}>
              <td style={{ padding: "10px 12px", borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
                <p style={{ color: "#0f172a", fontSize: "0.76rem", fontWeight: 900 }}>{resource}</p>
                <p style={{ color: "#64748b", fontSize: "0.62rem" }}>
                  {schedule.filter((entry) => entry[field] === resource).length} occupied slots
                </p>
              </td>
              {SLOTS.map((slot) => {
                const entries = entriesForResourceCell(resource, slot.id, field);
                return (
                    <td key={slot.id} style={{ minWidth: 168, padding: 6, verticalAlign: "top", borderTop: "1px solid #e2e8f0" }}>
                      <div style={{ display: "grid", gap: 5 }}>
                        {entries.length
                            ? entries.map((entry) => renderScheduleCard(entry, true))
                            : renderEmptyCell(0, slot.id, field === "room" ? resource : "")}
                      </div>
                    </td>
                );
              })}
            </tr>
        ))}
        </tbody>
      </table>
  );

  return (
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ color: "#0f172a", fontSize: "1.55rem", fontWeight: 900 }}>Timetable Management</h1>
            <p style={{ color: "#64748b", fontSize: "0.84rem", marginTop: 3 }}>
              Conflict-aware scheduling dashboard - Week {week}/28
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => setWeek((value) => Math.max(1, value - 1))} disabled={loading} style={navButton}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ minWidth: 148, textAlign: "center", color: "#0f172a", fontSize: "0.84rem", fontWeight: 900 }}>
            Week {week}: {dates[0]} - {dates[5]}/2026
          </span>
            <button onClick={() => setWeek((value) => Math.min(28, value + 1))} disabled={loading} style={navButton}>
              <ChevronRight size={16} />
            </button>
            <button onClick={() => setShowForm((value) => !value)} disabled={submitting || loading} style={primaryButton}>
              <Plus size={15} /> Add schedule
            </button>
          </div>
        </div>

        <div style={{ ...shell.card, padding: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(140px, 1fr))", gap: 10 }}>
            {[
              ["Academic Year", "year", ["2025/2026", "2026/2027"]],
              ["Semester", "semester", ["Semester 1", "Semester 2", "Summer"]],
              ["Week", "week", [`Week ${week}`, "Current week", "All weeks"]],
              ["Faculty/Department", "faculty", ["All faculties", "Computer Science", "Business", "Engineering"]],
              ["Building", "building", ["All buildings", "Building A", "Building B", "Building C"]],
            ].map(([label, key, options]) => (
                <div key={key}>
                  <label style={shell.label}>{label}</label>
                  <select
                      value={key === "week" ? `Week ${week}` : filters[key]}
                      onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.value }))}
                      style={control}
                  >
                    {options.map((option) => (
                        <option key={option}>{option}</option>
                    ))}
                  </select>
                </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "inline-flex", padding: 4, borderRadius: 12, background: "#e2e8f0", border: "1px solid #cbd5e1" }}>
            {VIEW_OPTIONS.map(({ id, label, icon: Icon }) => (
                <button
                    key={id}
                    onClick={() => setViewMode(id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "8px 12px",
                      border: "none",
                      borderRadius: 9,
                      background: viewMode === id ? "#0f2f4a" : "transparent",
                      color: viewMode === id ? "#fff" : "#334155",
                      fontSize: "0.78rem",
                      fontWeight: 900,
                    }}
                >
                  <Icon size={15} /> {label}
                </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(96px, 1fr))", gap: 8 }}>
            {stats.map((stat) => (
                <div key={stat.label} style={{ ...shell.card, minWidth: 100, padding: "8px 12px" }}>
                  <p style={{ color: stat.color, fontSize: "1rem", fontWeight: 900 }}>{stat.value}</p>
                  <p style={{ color: "#64748b", fontSize: "0.64rem", fontWeight: 800 }}>{stat.label}</p>
                </div>
            ))}
          </div>
        </div>

        {showForm && (
            <div style={{ ...shell.card, padding: 16 }}>
              <p style={{ color: "#0f172a", fontSize: "0.92rem", fontWeight: 900, marginBottom: 12 }}>Schedule selected section</p>
              <form onSubmit={addEntry} style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(130px, 1fr))", gap: 12 }}>
                <div>
                  <label style={shell.label}>Day</label>
                  <select value={form.day} onChange={(event) => setForm((current) => ({ ...current, day: event.target.value }))} style={control}>
                    {DAYS.map((day, index) => (
                        <option key={day} value={index}>
                          {day}
                        </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={shell.label}>Time slot</label>
                  <select value={form.slot} onChange={(event) => setForm((current) => ({ ...current, slot: event.target.value }))} style={control}>
                    {SLOTS.map((slot) => (
                        <option key={slot.id} value={slot.id}>
                          {slot.label} ({slot.time})
                        </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={shell.label}>Section ID</label>
                  <input
                      type="number"
                      value={sectionId || ""}
                      onChange={(event) => setSectionId(event.target.value ? Number(event.target.value) : null)}
                      placeholder="Example: 1"
                      required
                      style={control}
                  />
                </div>
                <div>
                  <label style={shell.label}>Room ID</label>
                  <input
                      value={form.room}
                      onChange={(event) => setForm((current) => ({ ...current, room: event.target.value }))}
                      placeholder="Numeric room ID"
                      required
                      style={control}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "end", gap: 8 }}>
                  <button type="button" onClick={() => setShowForm(false)} style={secondaryButton}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} style={primaryButton}>
                    Save
                  </button>
                </div>
              </form>
            </div>
        )}

        {loading ? (
            <div style={{ ...shell.card, padding: 28, textAlign: "center", color: "#64748b" }}>Đang tải thời khóa biểu...</div>
        ) : (
            <div style={{ display: "grid", gridTemplateColumns: sidebarOpen ? "300px minmax(0, 1fr)" : "44px minmax(0, 1fr)", gap: 12 }}>
              <aside style={{ ...shell.card, overflow: "hidden", background: "#0f2f4a", color: "#e0f2fe" }}>
                <button
                    onClick={() => setSidebarOpen((value) => !value)}
                    title={sidebarOpen ? "Collapse unassigned courses" : "Expand unassigned courses"}
                    style={{
                      width: "100%",
                      minHeight: 44,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: sidebarOpen ? "space-between" : "center",
                      padding: sidebarOpen ? "0 14px" : 0,
                      border: "none",
                      background: "#0b2438",
                      color: "#fff",
                      fontWeight: 900,
                    }}
                >
                  {sidebarOpen && <span>Unassigned Courses</span>}
                  <ChevronsLeft size={16} style={{ transform: sidebarOpen ? "none" : "rotate(180deg)" }} />
                </button>
                {sidebarOpen && (
                    <div style={{ padding: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: "#123c5a", marginBottom: 10 }}>
                        <Search size={14} color="#93c5fd" />
                        <span style={{ color: "#bfdbfe", fontSize: "0.72rem" }}>{unassignedCourses.length} courses still need a slot</span>
                      </div>
                      <div style={{ display: "grid", gap: 8, maxHeight: 560, overflowY: "auto", paddingRight: 2 }}>
                        {unassignedCourses.length ? (
                            unassignedCourses.map((course) => (
                                <div
                                    key={course.id}
                                    draggable
                                    onDragStart={(event) => event.dataTransfer.setData("sectionId", String(course.id))}
                                    style={{
                                      padding: 10,
                                      borderRadius: 10,
                                      background: "#f8fafc",
                                      color: "#0f172a",
                                      border: "1px solid #dbeafe",
                                      cursor: "grab",
                                    }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                                    <span style={{ color: "#1d4ed8", fontSize: "0.72rem", fontWeight: 900 }}>{course.code}</span>
                                    <GripVertical size={14} color="#94a3b8" />
                                  </div>
                                  <p style={{ marginTop: 4, color: "#0f172a", fontSize: "0.74rem", fontWeight: 850, lineHeight: 1.25 }}>
                                    {course.name}
                                  </p>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
                                    <span style={pill}><UserRound size={10} /> {compactName(course.gv)}</span>
                                    <span style={pill}><UsersRound size={10} /> {course.size}</span>
                                    <span style={pill}><Layers3 size={10} /> {course.faculty}</span>
                                  </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: 12, borderRadius: 10, background: "#123c5a", color: "#bfdbfe", fontSize: "0.76rem" }}>
                              No missed courses. Every section has at least one scheduled slot.
                            </div>
                        )}
                      </div>
                    </div>
                )}
              </aside>

              <section style={{ ...shell.card, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#047857", fontSize: "0.72rem", fontWeight: 900 }}>
                  <Clock3 size={13} /> Available
                </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#1d4ed8", fontSize: "0.72rem", fontWeight: 900 }}>
                  <Building2 size={13} /> Occupied
                </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#dc2626", fontSize: "0.72rem", fontWeight: 900 }}>
                  <AlertTriangle size={13} /> Conflict detected
                </span>
                  </div>
                  <p style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 800 }}>
                    Drop unassigned courses into available cells, then confirm Section ID and Room ID.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  {viewMode === "weekly" && renderWeeklyGrid()}
                  {viewMode === "room" && renderResourceGrid(rooms, "room", "Room")}
                  {viewMode === "lecturer" && renderResourceGrid(lecturers, "gv", "Lecturer")}
                </div>
              </section>
            </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 12, background: "#eff6ff", border: "1px solid #bfdbfe" }}>
          <AlertTriangle size={14} color="#2563eb" />
          <p style={{ color: "#1e40af", fontSize: "0.76rem", fontWeight: 700 }}>
            Bright red cells indicate room or lecturer overlap. Hover a conflicted card to see the exact error.
          </p>
        </div>
      </div>
  );
}

const control = {
  width: "100%",
  height: 36,
  padding: "7px 10px",
  borderRadius: 9,
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#0f172a",
  fontSize: "0.78rem",
  outline: "none",
};

const navButton = {
  width: 36,
  height: 36,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 9,
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#334155",
};

const primaryButton = {
  minHeight: 36,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: "0 13px",
  borderRadius: 9,
  border: "none",
  background: "#047857",
  color: "#fff",
  fontSize: "0.78rem",
  fontWeight: 900,
};

const secondaryButton = {
  minHeight: 36,
  padding: "0 13px",
  borderRadius: 9,
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#334155",
  fontSize: "0.78rem",
  fontWeight: 900,
};

const pill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "3px 6px",
  borderRadius: 999,
  background: "#e0f2fe",
  color: "#075985",
  fontSize: "0.6rem",
  fontWeight: 850,
};

export default TimetableManager;
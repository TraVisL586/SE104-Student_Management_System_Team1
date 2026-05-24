import { useCallback, useEffect, useMemo, useState } from "react";
import { Award, Download, Loader2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import studentService from "../../services/studentService";
import courseRegistrationService from "../../services/courseRegistrationService";

function gradeColor(g) {
  if (g === null || g === undefined) return "#94a3b8";
  if (g >= 8) return "#10b981";
  if (g >= 6.0) return "#2563eb";
  if (g >= 5.0) return "#f59e0b";
  return "#ef4444";
}

function gradeLabel(g) {
  if (g === null || g === undefined) return "Chưa có";
  if (g >= 8) return "Giỏi";
  if (g >= 6.0) return "Khá";
  if (g >= 5.0) return "Trung bình";
  return "Không đạt";
}

export function Grades() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchGrades = useCallback(async () => {
    try {
      setLoading(true);
      const [gradesData, registrationsData] = await Promise.all([
        studentService.getMyGrades(),
        courseRegistrationService.getMyRegistrations().catch(() => [])
      ]);

      // Filter only published grades
      const publishedGrades = gradesData.filter(g => g.status === "PUBLISHED" || g.isPublished || g.gradeStatus === "PUBLISHED");

      // Map each grade with semester info from registrations
      const mappedGrades = publishedGrades.map(g => {
        const reg = Array.isArray(registrationsData) ? registrationsData.find(r => r.id === g.enrollmentId) : null;
        return {
          ...g,
          credits: reg ? reg.credits : (g.credits || 3),
          semesterId: reg ? reg.semesterId : null,
          semesterCode: reg ? reg.semesterCode : "N/A",
          semesterName: reg ? reg.semesterName : "Chưa rõ học kỳ"
        };
      });

      setGrades(mappedGrades || []);
    } catch {
      showToast("error", "Lỗi", "Không thể tải bảng điểm");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void fetchGrades();
  }, [fetchGrades]);

  // Calculate statistics
  let totalCredits = 0;
  let totalScorePoints = 0;
  let passedCourses = 0;
  let failedCourses = 0;

  grades.forEach(g => {
    const credits = g.credits || 3;
    totalCredits += credits;
    if (g.totalScore !== null && g.totalScore !== undefined) {
      totalScorePoints += (g.totalScore * credits);
      if (g.totalScore >= 4.0) passedCourses++;
      else failedCourses++;
    }
  });

  const cumulativeGPA = totalCredits > 0 ? (totalScorePoints / totalCredits) : 0;

  // Group grades by semester
  const gradesBySemester = useMemo(() => {
    const groups = {};
    grades.forEach(g => {
      const semKey = g.semesterId || "unknown";
      if (!groups[semKey]) {
        groups[semKey] = {
          semesterId: g.semesterId,
          semesterCode: g.semesterCode,
          semesterName: g.semesterName || "Chưa rõ học kỳ",
          items: [],
          totalCredits: 0,
          totalScorePoints: 0,
        };
      }
      groups[semKey].items.push(g);
      const credits = g.credits || 3;
      groups[semKey].totalCredits += credits;
      if (g.totalScore !== null && g.totalScore !== undefined) {
        groups[semKey].totalScorePoints += (g.totalScore * credits);
      }
    });

    // Calculate GPA for each semester and convert to array
    return Object.values(groups).map(group => {
      const gpa = group.totalCredits > 0 ? (group.totalScorePoints / group.totalCredits) : 0;
      return {
        ...group,
        gpa: parseFloat(gpa.toFixed(2)),
      };
    }).sort((a, b) => {
      if (a.semesterId === null || a.semesterId === undefined) return 1;
      if (b.semesterId === null || b.semesterId === undefined) return -1;
      return a.semesterId - b.semesterId;
    });
  }, [grades]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 style={{ color: "#1e293b" }}>Bảng điểm</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 2 }}>
            Thang điểm 0.0 – 10.0 (BR-8) · Tích lũy: {totalCredits}/130 TC
          </p>
        </div>
        <button
          onClick={() => showToast("info", "Chưa hỗ trợ", "Tính năng tải bảng điểm PDF chưa được triển khai.")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ backgroundColor: "#1a3461", color: "white", border: "none", cursor: "pointer", fontSize: "0.82rem" }}
        >
          <Download size={14} /> Tải bảng điểm PDF
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "GPA Tích lũy", value: cumulativeGPA.toFixed(2), sub: `Xếp loại: ${gradeLabel(cumulativeGPA)}`, color: "#2563eb", bg: "#dbeafe" },
              { label: "Tín chỉ Tích lũy", value: `${totalCredits}/130`, sub: `${Math.round((totalCredits / 130) * 100)}% chương trình`, color: "#10b981", bg: "#d1fae5" },
              { label: "Môn đạt", value: passedCourses.toString(), sub: `Tổng ${grades.length} môn đã học`, color: "#8b5cf6", bg: "#ede9fe" },
              { label: "Môn chưa đạt", value: failedCourses.toString(), sub: failedCourses > 0 ? "Cần học lại" : "Rất tốt", color: "#f59e0b", bg: "#fef3c7" },
            ].map(({ label, value, sub, color, bg }) => (
              <div key={label} className="rounded-2xl p-4" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <Award size={15} color={color} />
                </div>
                <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1e293b" }}>{value}</p>
                <p style={{ fontSize: "0.72rem", color: "#64748b" }}>{label}</p>
                <p style={{ fontSize: "0.68rem", color, fontWeight: 600, marginTop: 2 }}>{sub}</p>
              </div>
            ))}
          </div>

          {/* Semester details list */}
          <div className="space-y-6">
            {gradesBySemester.length === 0 ? (
              <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
                <p style={{ fontSize: "0.85rem", color: "#64748b" }}>Chưa có điểm nào được công bố.</p>
              </div>
            ) : (
              gradesBySemester.map((sem) => {
                let passedCount = 0;
                let failedCount = 0;
                sem.items.forEach(c => {
                  if (c.totalScore !== null && c.totalScore !== undefined) {
                    if (c.totalScore >= 4.0) passedCount++;
                    else failedCount++;
                  }
                });

                return (
                  <div key={sem.semesterId || "unknown"} className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 flex-wrap gap-2" style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
                      <div>
                        <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "#1a3461" }}>
                          {sem.semesterName}
                        </h3>
                        {sem.semesterCode && sem.semesterCode !== "N/A" && (
                          <p style={{ fontSize: "0.72rem", color: "#64748b", marginTop: 1 }}>
                            Mã học kỳ: {sem.semesterCode}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "4px 10px", borderRadius: 8, backgroundColor: `${gradeColor(sem.gpa)}15`, color: gradeColor(sem.gpa), border: `1px solid ${gradeColor(sem.gpa)}30` }}>
                          GPA Kỳ: {sem.gpa.toFixed(2)} ({gradeLabel(sem.gpa)})
                        </span>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "4px 10px", borderRadius: 8, backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}>
                          Tín chỉ: {sem.totalCredits} TC
                        </span>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr style={{ backgroundColor: "#fafbfc", borderBottom: "1px solid #f1f5f9" }}>
                            {["Mã MH", "Tên môn học", "Tín chỉ", "Quá trình (10%)", "Giữa kỳ (30%)", "Cuối kỳ (60%)", "Tổng kết", "Xếp loại"].map((h) => (
                              <th key={h} className="text-left px-5 py-3" style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sem.items.map((c) => (
                            <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td className="px-5 py-3.5" style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#2563eb", fontWeight: 600 }}>{c.courseCode}</td>
                              <td className="px-5 py-3.5" style={{ fontSize: "0.82rem", color: "#1e293b", fontWeight: 500 }}>{c.courseName}</td>
                              <td className="px-5 py-3.5" style={{ fontSize: "0.8rem", color: "#475569" }}>{c.credits} TC</td>
                              <td className="px-5 py-3.5" style={{ fontSize: "0.85rem", fontWeight: 600, color: gradeColor(c.processScore) }}>{c.processScore ?? "—"}</td>
                              <td className="px-5 py-3.5" style={{ fontSize: "0.85rem", fontWeight: 600, color: gradeColor(c.midtermScore) }}>{c.midtermScore ?? "—"}</td>
                              <td className="px-5 py-3.5" style={{ fontSize: "0.85rem", fontWeight: 600, color: gradeColor(c.finalScore) }}>{c.finalScore ?? "—"}</td>
                              <td className="px-5 py-3.5" style={{ fontSize: "0.95rem", fontWeight: 700, color: gradeColor(c.totalScore) }}>{c.totalScore ?? "—"}</td>
                              <td className="px-5 py-3.5">
                                <span style={{
                                  fontSize: "0.7rem", fontWeight: 600, padding: "2.5px 8px", borderRadius: 6,
                                  backgroundColor: c.totalScore !== null ? `${gradeColor(c.totalScore)}18` : "#f1f5f9",
                                  color: gradeColor(c.totalScore),
                                }}>
                                  {gradeLabel(c.totalScore)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Footer */}
                    <div className="flex items-center justify-between px-5 py-3.5 flex-wrap gap-4" style={{ backgroundColor: "#fcfdfe", borderTop: "1px solid #f1f5f9" }}>
                      <div className="flex gap-4 text-xs text-slate-500">
                        <span>Tổng số môn: <strong style={{ color: "#334155" }}>{sem.items.length}</strong></span>
                        <span>Môn đạt: <strong style={{ color: "#10b981" }}>{passedCount}</strong></span>
                        {failedCount > 0 && <span>Môn chưa đạt: <strong style={{ color: "#ef4444" }}>{failedCount}</strong></span>}
                      </div>
                      <div className="flex gap-6 items-center flex-wrap">
                        <span style={{ fontSize: "0.8rem", color: "#475569" }}>
                          Tích lũy học kỳ: <strong style={{ color: "#1e293b", fontSize: "0.88rem" }}>{sem.totalCredits} TC</strong>
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "#475569" }}>
                          GPA Học kỳ: <strong style={{ color: gradeColor(sem.gpa), fontSize: "0.98rem" }}>{sem.gpa.toFixed(2)}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Grades;

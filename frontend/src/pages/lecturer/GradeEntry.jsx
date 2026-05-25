import { useCallback, useEffect, useState } from "react";
import { Save, Info, Loader2, Lock, Unlock, Send } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import lecturerService from "../../services/lecturerService";
import ConfirmDialog from "../../components/ConfirmDialog";

function calcFinal(processScore, midtermScore, finalScore) {
  const p = parseFloat(processScore);
  const m = parseFloat(midtermScore);
  const f = parseFloat(finalScore);
  if (isNaN(p) || isNaN(m) || isNaN(f)) return null;
  return (p * 0.1 + m * 0.3 + f * 0.6).toFixed(1);
}

function validateScore(val) {
  if (val === "" || val === null || val === undefined) return true;
  const n = parseFloat(val);
  return !isNaN(n) && n >= 0 && n <= 10;
}

function gradeColor(g) {
  if (g === null) return "#94a3b8";
  if (g >= 8.5) return "#10b981";
  if (g >= 7.0) return "#2563eb";
  if (g >= 5.5) return "#f59e0b";
  return "#ef4444";
}

export function GradeEntry() {
  const [classes, setClasses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [grades, setGrades] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");
  const [unlockEnrollmentId, setUnlockEnrollmentId] = useState(null);
  const [publishTarget, setPublishTarget] = useState(null);
  const { showToast } = useToast();

  const fetchGrades = useCallback(async (sectionId) => {
    try {
      setLoadingGrades(true);
      const data = await lecturerService.getGrades(sectionId);
      // Data might contain processScore, midtermScore, finalScore
      setGrades(data.map(g => ({
        ...g,
        isPublished: g.isPublished ?? g.status === "PUBLISHED",
        processScore: g.processScore != null ? g.processScore : "",
        midtermScore: g.midtermScore != null ? g.midtermScore : "",
        finalScore: g.finalScore != null ? g.finalScore : "",
        _original: { ...g } // Store original to track changes
      })));
    } catch {
      showToast("error", "Lỗi", "Không thể tải danh sách điểm");
      setGrades([]);
    } finally {
      setLoadingGrades(false);
    }
  }, [showToast]);

  const fetchClasses = useCallback(async () => {
    try {
      setLoadingClasses(true);
      const data = await lecturerService.getMyTimetable();
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
          });
        }
      });
      setClasses(uniqueClasses);
      if (uniqueClasses.length > 0) {
        setSelected(uniqueClasses[0].id);
      }
    } catch {
      showToast("error", "Lỗi", "Không thể tải danh sách lớp");
    } finally {
      setLoadingClasses(false);
    }
  }, [showToast]);

  useEffect(() => {
    void fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (selected) {
      void fetchGrades(selected);
    }
  }, [fetchGrades, selected]);

  const update = (enrollmentId, field, val) => {
    setGrades((prev) =>
      prev.map((s) => (s.enrollmentId === enrollmentId ? { ...s, [field]: val } : s))
    );
  };

  const saveGrades = async () => {
    const invalid = grades.filter(
      (s) => !validateScore(s.processScore) || !validateScore(s.midtermScore) || !validateScore(s.finalScore)
    );
    if (invalid.length) {
      showToast("error", "Điểm không hợp lệ", "Có điểm ngoài khoảng 0.0–10.0");
      return;
    }

    const changedGrades = grades.filter(s => 
      !s.isPublished && (
        String(s.processScore) !== String(s._original.processScore || "") ||
        String(s.midtermScore) !== String(s._original.midtermScore || "") ||
        String(s.finalScore) !== String(s._original.finalScore || "")
      )
    );

    if (changedGrades.length === 0) {
      showToast("info", "Không có thay đổi", "Không có điểm nào mới cần lưu.");
      return;
    }

    setSubmitting(true);
    let successCount = 0;
    for (const g of changedGrades) {
      try {
        await lecturerService.updateGrade(g.enrollmentId, {
          processScore: g.processScore || 0,
          midtermScore: g.midtermScore || 0,
          finalScore: g.finalScore || 0
        });
        successCount++;
      } catch {
        showToast("error", "Lỗi lưu điểm", `Không thể lưu điểm cho ${g.studentName}`);
      }
    }
    
    if (successCount > 0) {
      showToast("success", "Thành công", `Đã lưu điểm cho ${successCount} sinh viên.`);
      fetchGrades(selected);
    }
    setSubmitting(false);
  };

  const handlePublish = async () => {
    if (!publishTarget) return;
    try {
      setSubmitting(true);
      await lecturerService.publishGrade(publishTarget.enrollmentId);
      showToast("success", "Thành công", `Đã công bố điểm cho ${publishTarget.studentName}`);
      setPublishTarget(null);
      fetchGrades(selected);
    } catch {
      showToast("error", "Lỗi", "Không thể công bố điểm");
    } finally {
      setSubmitting(false);
    }
  };

  const openUnlockRequest = (enrollmentId) => {
    setUnlockEnrollmentId(enrollmentId);
    setUnlockReason("");
    setShowUnlockModal(true);
  };

  const submitUnlockRequest = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await lecturerService.requestGradeUnlock(unlockEnrollmentId, unlockReason);
      showToast("success", "Thành công", "Đã gửi yêu cầu mở khóa điểm");
      setShowUnlockModal(false);
      fetchGrades(selected);
    } catch (error) {
      showToast("error", "Lỗi", error.message || "Không thể gửi yêu cầu");
    } finally {
      setSubmitting(false);
    }
  };

  const filledCount = grades.filter(s => s.processScore !== "" && s.midtermScore !== "" && s.finalScore !== "").length;

  return (
    <div className="space-y-5">
      <div>
        <h1 style={{ color: "#1e293b" }}>Nhập điểm</h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 2 }}>
          Nhập điểm thành phần · Thang điểm 0.0–10.0
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
          <div className="flex flex-wrap gap-3">
            <div>
              <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Lớp học phần</p>
              <div className="flex gap-2 flex-wrap">
                {classes.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c.id)}
                    style={{
                      padding: "8px 14px", borderRadius: 10, fontSize: "0.8rem",
                      backgroundColor: selected === c.id ? "#4c1d95" : "#fff",
                      color: selected === c.id ? "#fff" : "#334155",
                      border: `1px solid ${selected === c.id ? "#4c1d95" : "#e2e8f0"}`,
                      cursor: "pointer",
                    }}
                  >
                    {c.code}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
            <Info size={15} color="#2563eb" />
            <p style={{ fontSize: "0.78rem", color: "#1e40af" }}>
              Đã hoàn thành: <strong>{filledCount}/{grades.length}</strong> SV ·
              Điểm chưa công bố có thể chỉnh sửa tự do. Công thức tổng kết: 10% quá trình, 30% giữa kỳ, 60% cuối kỳ.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
            {loadingGrades ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-purple-600" size={32} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" style={{ minWidth: 800 }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc" }}>
                      {["MSSV", "Họ tên", "QT (10%)", "GK (30%)", "CK (60%)", "Tổng kết", "Trạng thái", "Thao tác"].map((h) => (
                        <th key={h} className="text-left px-4 py-3" style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grades.length === 0 ? (
                      <tr><td colSpan="8" className="text-center py-4 text-sm text-slate-500">Chưa có sinh viên</td></tr>
                    ) : grades.map((s) => {
                      const final = calcFinal(s.processScore, s.midtermScore, s.finalScore);
                      const pOk = validateScore(s.processScore);
                      const mOk = validateScore(s.midtermScore);
                      const fOk = validateScore(s.finalScore);
                      const isLocked = s.isPublished;

                      return (
                        <tr key={s.enrollmentId} style={{ borderTop: "1px solid #f1f5f9", backgroundColor: isLocked ? "#f8fafc" : "transparent" }}>
                          <td className="px-4 py-2.5" style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#8b5cf6", fontWeight: 600 }}>{s.studentCode}</td>
                          <td className="px-4 py-2.5" style={{ fontSize: "0.85rem", color: "#1e293b" }}>{s.studentName}</td>
                          <td className="px-4 py-2.5">
                            <input
                              value={s.processScore}
                              onChange={(e) => update(s.enrollmentId, "processScore", e.target.value)}
                              disabled={isLocked}
                              placeholder="0-10"
                              className="w-16 p-1 text-center border rounded outline-none text-sm"
                              style={{ borderColor: !pOk ? "#ef4444" : "#e2e8f0" }}
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <input
                              value={s.midtermScore}
                              onChange={(e) => update(s.enrollmentId, "midtermScore", e.target.value)}
                              disabled={isLocked}
                              placeholder="0-10"
                              className="w-16 p-1 text-center border rounded outline-none text-sm"
                              style={{ borderColor: !mOk ? "#ef4444" : "#e2e8f0" }}
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <input
                              value={s.finalScore}
                              onChange={(e) => update(s.enrollmentId, "finalScore", e.target.value)}
                              disabled={isLocked}
                              placeholder="0-10"
                              className="w-16 p-1 text-center border rounded outline-none text-sm"
                              style={{ borderColor: !fOk ? "#ef4444" : "#e2e8f0" }}
                            />
                          </td>
                          <td className="px-4 py-2.5" style={{ fontSize: "1rem", fontWeight: 700, color: gradeColor(final ? parseFloat(final) : null) }}>
                            {final ?? "—"}
                          </td>
                          <td className="px-4 py-2.5">
                            {isLocked ? (
                              <span className="flex items-center gap-1 text-xs text-green-600 font-semibold"><Lock size={12}/> Đã khóa</span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-slate-500"><Unlock size={12}/> Chưa khóa</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            {isLocked ? (
                              <button onClick={() => openUnlockRequest(s.enrollmentId)} className="text-xs text-blue-600 hover:underline">
                                Xin sửa điểm
                              </button>
                            ) : (
                              <button onClick={() => setPublishTarget(s)} disabled={!pOk || !mOk || !fOk || s.processScore==="" || s.midtermScore==="" || s.finalScore===""} className="text-xs text-purple-600 font-semibold hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer">
                                Công bố
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={saveGrades}
              disabled={submitting || loadingGrades}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl disabled:opacity-50"
              style={{ backgroundColor: "#4c1d95", color: "white", border: "none", cursor: "pointer", fontSize: "0.88rem", fontWeight: 600 }}
            >
              {submitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
              Lưu điểm
            </button>
          </div>
        </>
      )}

      {showUnlockModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 24, maxWidth: 500, width: "100%" }}>
            <h2 className="text-lg font-bold mb-4">Xin sửa điểm đã khóa</h2>
            <p className="text-sm text-slate-600 mb-4">Điểm đã công bố không thể tự ý sửa. Bạn cần gửi yêu cầu để Admin/Giáo vụ xem xét mở khóa.</p>
            <form onSubmit={submitUnlockRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Lý do xin sửa *</label>
                <textarea required rows={4} value={unlockReason} onChange={e => setUnlockReason(e.target.value)} className="w-full p-2 border rounded-lg text-sm resize-none" placeholder="VD: Nhập nhầm điểm thành phần..." />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button type="button" onClick={() => setShowUnlockModal(false)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
                <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Gửi yêu cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!publishTarget}
        title="Công bố điểm?"
        description={publishTarget ? `Điểm của ${publishTarget.studentName} sẽ bị khóa sau khi công bố.` : ""}
        confirmLabel="Công bố điểm"
        variant="success"
        loading={submitting}
        onCancel={() => setPublishTarget(null)}
        onConfirm={handlePublish}
      />
    </div>
  );
}

export default GradeEntry;

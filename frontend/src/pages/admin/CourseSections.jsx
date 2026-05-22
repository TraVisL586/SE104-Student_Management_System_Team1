import { useState, useEffect } from "react";
import { Plus, Search, Trash2, BookMarked, Users, CheckCircle2, XCircle, Loader2, Edit2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import adminSchedulingService from "../../services/adminSchedulingService";

export function CourseSections() {
  const [searchParams] = useSearchParams();
  const searchParam = searchParams.get("search") || "";
  const [sections, setSections] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState(searchParam);

  useEffect(() => {
    setSearch(searchParam);
  }, [searchParam]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ code: "", courseId: "", semesterId: "", lecturerId: "", capacity: 50 });
  const { showToast } = useToast();

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [secData, semData, rmData] = await Promise.all([
        adminSchedulingService.getCourseSections(),
        adminSchedulingService.getSemesters(),
        adminSchedulingService.getRooms(),
      ]);
      setSections(Array.isArray(secData) ? secData : []);
      setSemesters(Array.isArray(semData) ? semData : []);
      setRooms(Array.isArray(rmData) ? rmData : []);
    } catch (error) {
      showToast("error", "Lỗi", "Không thể tải danh sách lớp học phần");
    } finally {
      setLoading(false);
    }
  };

  const filtered = sections.filter(
    (s) =>
      (s.code || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.courseName || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.lecturerName || "").toLowerCase().includes(search.toLowerCase())
  );

  const openCount = sections.filter(s => s.status === "OPEN" || !s.status).length;
  const fullCount = sections.filter(s => (s.enrolledCount || 0) >= (s.capacity || 1)).length;
  const closedCount = sections.filter(s => s.status === "CLOSED").length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editId) {
        await adminSchedulingService.updateCourseSection(editId, form);
        showToast("success", "Thành công", "Đã cập nhật lớp học phần");
      } else {
        await adminSchedulingService.createCourseSection(form);
        showToast("success", "Thành công", "Đã tạo lớp học phần mới");
      }
      setForm({ code: "", courseId: "", semesterId: "", lecturerId: "", capacity: 50 });
      setShowForm(false);
      setEditId(null);
      fetchAll();
    } catch (error) {
      showToast("error", "Lỗi", error.message || "Không thể lưu lớp học phần");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lớp học phần này?")) return;
    try {
      await adminSchedulingService.deleteCourseSection(id);
      showToast("info", "Đã xóa", "Lớp học phần đã được xóa");
      fetchAll();
    } catch (error) {
      showToast("error", "Lỗi", "Không thể xóa lớp học phần");
    }
  };

  const openEdit = (sec) => {
    setEditId(sec.id);
    setForm({
      code: sec.code || "",
      courseId: sec.courseId || "",
      semesterId: sec.semesterId || "",
      lecturerId: sec.lecturerId || "",
      capacity: sec.capacity || 50,
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 style={{ color: "#1e293b" }}>Quản lý Lớp học phần</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 2 }}>
            Mở, đóng và quản lý các lớp học phần
          </p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setEditId(null); setForm({ code: "", courseId: "", semesterId: "", lecturerId: "", capacity: 50 }); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ backgroundColor: "#065f46", color: "white", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
        >
          <Plus size={16} /> Thêm lớp học phần
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl p-6" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
          <p style={{ fontWeight: 700, fontSize: "1rem", color: "#1e293b", marginBottom: 16 }}>{editId ? "Chỉnh sửa lớp học phần" : "Thêm lớp học phần mới"}</p>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mã lớp HP *</label>
              <input required value={form.code} onChange={(e) => setForm(p => ({ ...p, code: e.target.value }))} placeholder="VD: CSC501-L02" className="w-full p-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Course ID *</label>
              <input required type="number" value={form.courseId} onChange={(e) => setForm(p => ({ ...p, courseId: e.target.value }))} placeholder="VD: 1" className="w-full p-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Học kỳ *</label>
              <select required value={form.semesterId} onChange={(e) => setForm(p => ({ ...p, semesterId: e.target.value }))} className="w-full p-2 border rounded-lg text-sm">
                <option value="">Chọn học kỳ</option>
                {semesters.map(s => <option key={s.id} value={s.id}>{s.name || s.code}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Lecturer ID</label>
              <input type="number" value={form.lecturerId} onChange={(e) => setForm(p => ({ ...p, lecturerId: e.target.value }))} placeholder="VD: 2" className="w-full p-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Sĩ số tối đa</label>
              <input type="number" value={form.capacity} onChange={(e) => setForm(p => ({ ...p, capacity: parseInt(e.target.value) || 50 }))} className="w-full p-2 border rounded-lg text-sm" />
            </div>
            <div className="col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2 border rounded-lg text-sm cursor-pointer">Hủy</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-emerald-800 text-white rounded-lg text-sm font-semibold disabled:opacity-50 cursor-pointer">
                {submitting ? "Đang lưu..." : editId ? "Cập nhật" : "Tạo lớp"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Đang mở", value: openCount, color: "#10b981", bg: "#d1fae5" },
          { label: "Đã đầy", value: fullCount, color: "#f59e0b", bg: "#fef3c7" },
          { label: "Đã đóng", value: closedCount, color: "#64748b", bg: "#f1f5f9" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ backgroundColor: bg }}>
            <p style={{ fontSize: "1.4rem", fontWeight: 800, color }}>{value}</p>
            <p style={{ fontSize: "0.72rem", color, fontWeight: 600 }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
        <div className="flex items-center justify-between px-5 py-4 flex-wrap gap-3" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b" }}>Danh sách lớp học phần ({filtered.length})</p>
          <div style={{ position: "relative" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input
              placeholder="Tìm mã, tên môn, GV…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "0.82rem", outline: "none", width: 220 }}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-green-600" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: 800 }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  {["Mã lớp HP", "Môn học", "Giảng viên", "Sĩ số", "Trạng thái", "Thao tác"].map((h) => (
                    <th key={h} className="text-left px-4 py-3" style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-6 text-sm text-slate-500">Không có lớp học phần nào</td></tr>
                ) : filtered.map((s) => {
                  const isFull = (s.enrolledCount || 0) >= (s.capacity || 1);
                  const isClosed = s.status === "CLOSED";
                  const statusCfg = isClosed
                    ? { label: "Đã đóng", color: "#64748b", bg: "#f1f5f9" }
                    : isFull
                    ? { label: "Đã đầy", color: "#f59e0b", bg: "#fef3c7" }
                    : { label: "Đang mở", color: "#10b981", bg: "#d1fae5" };
                  return (
                    <tr key={s.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <td className="px-4 py-3" style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#10b981", fontWeight: 700 }}>{s.code}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <BookMarked size={14} color="#8b5cf6" />
                          <span style={{ fontSize: "0.85rem", color: "#1e293b" }}>{s.courseName || `Course #${s.courseId}`}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: "0.78rem", color: "#64748b" }}>{s.lecturerName || `Lecturer #${s.lecturerId || "—"}`}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Users size={13} color="#94a3b8" />
                          <span style={{ fontSize: "0.82rem", color: "#1e293b" }}>{s.enrolledCount || 0}/{s.capacity || 0}</span>
                        </div>
                        <div style={{ height: 4, backgroundColor: "#e2e8f0", borderRadius: 9999, marginTop: 4, width: 60, overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(100, ((s.enrolledCount || 0) / (s.capacity || 1)) * 100)}%`, height: "100%", backgroundColor: isFull ? "#ef4444" : "#10b981", borderRadius: 9999 }} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span style={{ fontSize: "0.72rem", fontWeight: 600, padding: "3px 9px", borderRadius: 9999, backgroundColor: statusCfg.bg, color: statusCfg.color }}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => openEdit(s)} title="Chỉnh sửa" style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "1px solid #e2e8f0", background: "none", cursor: "pointer" }}>
                            <Edit2 size={14} color="#2563eb" />
                          </button>
                          <button onClick={() => handleDelete(s.id)} title="Xóa" style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "1px solid #e2e8f0", background: "none", cursor: "pointer" }}>
                            <Trash2 size={14} color="#ef4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default CourseSections;
import { useState, useEffect } from "react";
import { Search, Edit2, Trash2, Plus, Loader2, Book } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import adminCatalogService from "../../services/adminCatalogService";
import ConfirmDialog from "../../components/ConfirmDialog";
import AdminModal from "../../components/AdminModal";

export function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  const [form, setForm] = useState({
    code: "",
    name: "",
    credits: 3,
    periodsPerSession: 1,
    description: "",
    departmentId: "",
  });
  
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseData, deptData] = await Promise.all([
        adminCatalogService.getCourses(),
        adminCatalogService.getDepartments()
      ]);
      setCourses(courseData);
      setDepartments(deptData);
    } catch (error) {
      showToast("error", "Lỗi", "Không thể tải dữ liệu môn học");
    } finally {
      setLoading(false);
    }
  };

  const filtered = courses.filter((c) => 
    c.code?.toLowerCase().includes(search.toLowerCase()) || 
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingId(null);
    setForm({ code: "", name: "", credits: 3, periodsPerSession: 1, description: "", departmentId: departments[0]?.id || "" });
    setShowModal(true);
  };

  const openEdit = (course) => {
    setEditingId(course.id);
    setForm({
      code: course.code || "",
      name: course.name || "",
      credits: course.credits || 3,
      periodsPerSession: course.periodsPerSession || 1,
      description: course.description || "",
      departmentId: course.departmentId || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminCatalogService.updateCourse(editingId, form);
        showToast("success", "Thành công", "Đã cập nhật môn học");
      } else {
        await adminCatalogService.createCourse(form);
        showToast("success", "Thành công", "Đã thêm môn học mới");
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      showToast("error", "Lỗi", error.message || "Không thể lưu thông tin");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await adminCatalogService.deleteCourse(deleteTarget.id);
      showToast("success", "Thành công", "Đã xóa môn học");
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      showToast("error", "Lỗi", "Không thể xóa môn học");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 style={{ color: "#1e293b" }}>Quản lý Môn học</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 2 }}>
            Danh mục môn học của toàn trường
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ backgroundColor: "#1a3461", color: "white", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
        >
          <Plus size={16} /> Thêm Môn học
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
        <div className="flex items-center justify-between px-5 py-4 flex-wrap gap-3" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b" }}>Danh sách ({filtered.length})</p>
          <div style={{ position: "relative" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input
              placeholder="Tìm mã, tên môn học…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "0.82rem", outline: "none", width: 250 }}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: 600 }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  {["ID", "Mã Môn", "Tên Môn học", "Khoa quản lý", "Tín chỉ", "Số tiết/buổi", "Thao tác"].map((h) => (
                    <th key={h} className="text-left px-4 py-3" style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td className="px-4 py-3" style={{ fontSize: "0.8rem", color: "#64748b" }}>#{c.id}</td>
                    <td className="px-4 py-3" style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#2563eb", fontWeight: 600 }}>{c.code}</td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      <Book size={16} color="#94a3b8" />
                      <span style={{ fontSize: "0.85rem", color: "#1e293b", fontWeight: 500 }}>{c.name}</span>
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: "0.8rem", color: "#475569" }}>{c.departmentName || "—"}</td>
                    <td className="px-4 py-3" style={{ fontSize: "0.85rem", color: "#10b981", fontWeight: 600 }}>{c.credits} TC</td>
                    <td className="px-4 py-3" style={{ fontSize: "0.85rem", color: "#8b5cf6", fontWeight: 600 }}>{c.periodsPerSession || 1} tiết</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminModal
        open={showModal}
        title={editingId ? "Sửa môn học" : "Thêm môn học mới"}
        onClose={() => setShowModal(false)}
        maxWidth="max-w-lg"
      >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Khoa quản lý *</label>
                <select required value={form.departmentId} onChange={e => setForm({...form, departmentId: parseInt(e.target.value)})} className="w-full p-2 border rounded-lg text-sm">
                  <option value="" disabled>-- Chọn Khoa --</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Mã Môn *</label>
                  <input required value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full p-2 border rounded-lg text-sm" placeholder="VD: CSC101" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Tín chỉ *</label>
                  <input required type="number" value={form.credits} onChange={e => setForm({...form, credits: parseInt(e.target.value)})} className="w-full p-2 border rounded-lg text-sm" min="1" max="10" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Số tiết mỗi buổi *</label>
                <input required type="number" value={form.periodsPerSession} onChange={e => setForm({...form, periodsPerSession: parseInt(e.target.value)})} className="w-full p-2 border rounded-lg text-sm" min="1" max="10" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Tên Môn học *</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2 border rounded-lg text-sm" placeholder="VD: Nhập môn Lập trình" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Mô tả nội dung</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-2 border rounded-lg text-sm resize-none" placeholder="Mô tả nội dung môn học, không nhập lịch học tại đây" />
              </div>
              
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Lưu thay đổi</button>
              </div>
            </form>
      </AdminModal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa môn học?"
        description={deleteTarget ? `Môn "${deleteTarget.code} - ${deleteTarget.name}" sẽ bị xóa nếu không có dữ liệu liên kết.` : ""}
        confirmLabel="Xóa môn học"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default CourseManagement;

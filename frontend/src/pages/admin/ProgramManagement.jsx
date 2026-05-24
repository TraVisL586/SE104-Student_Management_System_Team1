import { useState, useEffect } from "react";
import { Search, Edit2, Trash2, Plus, Loader2, BookOpen } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import adminCatalogService from "../../services/adminCatalogService";
import ConfirmDialog from "../../components/ConfirmDialog";
import AdminModal from "../../components/AdminModal";

export function ProgramManagement() {
  const [programs, setPrograms] = useState([]);
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
    departmentId: "",
    totalCredits: 120,
    durationYears: 4,
  });
  
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [progData, deptData] = await Promise.all([
        adminCatalogService.getPrograms(),
        adminCatalogService.getDepartments()
      ]);
      setPrograms(progData);
      setDepartments(deptData);
    } catch (error) {
      showToast("error", "Lỗi", "Không thể tải dữ liệu chương trình");
    } finally {
      setLoading(false);
    }
  };

  const filtered = programs.filter((p) => 
    p.code?.toLowerCase().includes(search.toLowerCase()) || 
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingId(null);
    setForm({ code: "", name: "", departmentId: departments[0]?.id || "", totalCredits: 120, durationYears: 4 });
    setShowModal(true);
  };

  const openEdit = (prog) => {
    setEditingId(prog.id);
    setForm({
      code: prog.code || "",
      name: prog.name || "",
      departmentId: prog.departmentId || "",
      totalCredits: prog.totalCredits || 120,
      durationYears: prog.durationYears || 4,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminCatalogService.updateProgram(editingId, form);
        showToast("success", "Thành công", "Đã cập nhật chương trình");
      } else {
        await adminCatalogService.createProgram(form);
        showToast("success", "Thành công", "Đã thêm chương trình mới");
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
      await adminCatalogService.deleteProgram(deleteTarget.id);
      showToast("success", "Thành công", "Đã xóa chương trình");
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      showToast("error", "Lỗi", "Không thể xóa chương trình");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 style={{ color: "#1e293b" }}>Quản lý Chương trình đào tạo</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 2 }}>
            Danh mục chương trình đào tạo của các Khoa
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ backgroundColor: "#1a3461", color: "white", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
        >
          <Plus size={16} /> Thêm Chương trình
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
        <div className="flex items-center justify-between px-5 py-4 flex-wrap gap-3" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b" }}>Danh sách ({filtered.length})</p>
          <div style={{ position: "relative" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input
              placeholder="Tìm mã, tên chương trình…"
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
            <table className="w-full" style={{ minWidth: 700 }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  {["ID", "Mã CT", "Tên Chương trình", "Khoa", "Tín chỉ", "Thời gian", "Thao tác"].map((h) => (
                    <th key={h} className="text-left px-4 py-3" style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td className="px-4 py-3" style={{ fontSize: "0.8rem", color: "#64748b" }}>#{p.id}</td>
                    <td className="px-4 py-3" style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#2563eb", fontWeight: 600 }}>{p.code}</td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      <BookOpen size={16} color="#94a3b8" />
                      <span style={{ fontSize: "0.85rem", color: "#1e293b", fontWeight: 500 }}>{p.name}</span>
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: "0.8rem", color: "#475569" }}>{p.departmentName || "—"}</td>
                    <td className="px-4 py-3" style={{ fontSize: "0.85rem", color: "#10b981", fontWeight: 600 }}>{p.totalCredits} TC</td>
                    <td className="px-4 py-3" style={{ fontSize: "0.8rem", color: "#475569" }}>{p.durationYears} năm</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors">
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
        title={editingId ? "Sửa chương trình" : "Thêm chương trình mới"}
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
                  <label className="block text-xs font-semibold mb-1">Mã CT *</label>
                  <input required value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full p-2 border rounded-lg text-sm" placeholder="VD: CNTT-KS" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Tổng Tín chỉ *</label>
                  <input required type="number" value={form.totalCredits} onChange={e => setForm({...form, totalCredits: parseInt(e.target.value)})} className="w-full p-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Tên Chương trình *</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2 border rounded-lg text-sm" placeholder="VD: Kỹ sư Công nghệ Thông tin" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Thời gian (Năm) *</label>
                <input required type="number" step="0.5" value={form.durationYears} onChange={e => setForm({...form, durationYears: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg text-sm" />
              </div>
              
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Lưu thay đổi</button>
              </div>
            </form>
      </AdminModal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa chương trình?"
        description={deleteTarget ? `Chương trình "${deleteTarget.code} - ${deleteTarget.name}" sẽ bị xóa nếu không có dữ liệu liên kết.` : ""}
        confirmLabel="Xóa chương trình"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default ProgramManagement;

import { useState, useEffect } from "react";
import { Search, Edit2, Trash2, Plus, Loader2, Building2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import adminCatalogService from "../../services/adminCatalogService";
import ConfirmDialog from "../../components/ConfirmDialog";
import AdminModal from "../../components/AdminModal";

export function DepartmentManagement() {
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
    description: "",
  });
  
  const { showToast } = useToast();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await adminCatalogService.getDepartments();
      setDepartments(data);
    } catch (error) {
      showToast("error", "Lỗi", "Không thể tải danh sách khoa");
    } finally {
      setLoading(false);
    }
  };

  const filtered = departments.filter((d) => 
    d.code?.toLowerCase().includes(search.toLowerCase()) || 
    d.name?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingId(null);
    setForm({ code: "", name: "", description: "" });
    setShowModal(true);
  };

  const openEdit = (dept) => {
    setEditingId(dept.id);
    setForm({
      code: dept.code || "",
      name: dept.name || "",
      description: dept.description || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminCatalogService.updateDepartment(editingId, form);
        showToast("success", "Thành công", "Đã cập nhật khoa");
      } else {
        await adminCatalogService.createDepartment(form);
        showToast("success", "Thành công", "Đã thêm khoa mới");
      }
      setShowModal(false);
      fetchDepartments();
    } catch (error) {
      showToast("error", "Lỗi", error.message || "Không thể lưu thông tin");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await adminCatalogService.deleteDepartment(deleteTarget.id);
      showToast("success", "Thành công", "Đã xóa khoa");
      setDeleteTarget(null);
      fetchDepartments();
    } catch (error) {
      showToast("error", "Lỗi", "Không thể xóa khoa, có thể do đang có dữ liệu liên kết");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 style={{ color: "#1e293b" }}>Quản lý Khoa</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 2 }}>
            Quản lý danh sách các Khoa trong trường
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ backgroundColor: "#1a3461", color: "white", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
        >
          <Plus size={16} /> Thêm Khoa
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
        <div className="flex items-center justify-between px-5 py-4 flex-wrap gap-3" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b" }}>Danh sách Khoa ({filtered.length})</p>
          <div style={{ position: "relative" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input
              placeholder="Tìm mã, tên khoa…"
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
                  {["ID", "Mã Khoa", "Tên Khoa", "Mô tả", "Thao tác"].map((h) => (
                    <th key={h} className="text-left px-4 py-3" style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td className="px-4 py-3" style={{ fontSize: "0.8rem", color: "#64748b" }}>#{d.id}</td>
                    <td className="px-4 py-3" style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#2563eb", fontWeight: 600 }}>{d.code}</td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      <Building2 size={16} color="#94a3b8" />
                      <span style={{ fontSize: "0.85rem", color: "#1e293b", fontWeight: 500 }}>{d.name}</span>
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: "0.8rem", color: "#475569" }}>{d.description || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(d)} className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => setDeleteTarget(d)} className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors">
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
        title={editingId ? "Sửa khoa" : "Thêm khoa mới"}
        onClose={() => setShowModal(false)}
        maxWidth="max-w-lg"
      >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Mã Khoa *</label>
                <input required value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full p-2 border rounded-lg text-sm" placeholder="VD: CNTT" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Tên Khoa *</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2 border rounded-lg text-sm" placeholder="VD: Khoa Công nghệ Thông tin" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Mô tả</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-2 border rounded-lg text-sm resize-none" placeholder="Thông tin thêm..." />
              </div>
              
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Lưu thay đổi</button>
              </div>
            </form>
      </AdminModal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa khoa?"
        description={deleteTarget ? `Khoa "${deleteTarget.code} - ${deleteTarget.name}" sẽ bị xóa. Các dữ liệu liên quan có thể bị ảnh hưởng.` : ""}
        confirmLabel="Xóa khoa"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default DepartmentManagement;

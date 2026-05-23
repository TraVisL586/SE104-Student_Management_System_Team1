import { useState, useEffect } from "react";
import { Search, Shield, Key, Plus, Loader2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import adminAccountService from "../../services/adminAccountService";

const ROLES = [
  { value: "STUDENT", label: "Sinh viên" },
  { value: "LECTURER", label: "Giảng viên" },
  { value: "ACADEMIC_ADVISOR", label: "Cố vấn học tập" },
  { value: "ADMIN", label: "Quản trị viên" },
];

const getPrimaryRole = (account) => account.roles?.[0] || account.role || account.profileType || "";

const createEmptyForm = () => ({
  username: "",
  email: "",
  password: "",
  role: "STUDENT",
  profileCode: "",
  phone: "",
  department: "",
  dateOfBirth: "",
  fullName: "",
});

const buildCreatePayload = (form) => {
  const payload = {
    username: form.username.trim(),
    email: form.email.trim(),
    password: form.password,
    role: form.role,
    fullName: form.fullName.trim(),
  };

  ["profileCode", "phone", "department", "dateOfBirth"].forEach((field) => {
    const value = form[field]?.trim();
    if (value) {
      payload[field] = value;
    }
  });

  return payload;
};

export function AccountManagement() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  
  const [form, setForm] = useState(createEmptyForm());

  const [passwordForm, setPasswordForm] = useState({ newPassword: "" });
  
  const { showToast } = useToast();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await adminAccountService.getAllAccounts();
      setAccounts(data);
    } catch (error) {
      showToast("error", "Lỗi", "Không thể tải danh sách tài khoản");
    } finally {
      setLoading(false);
    }
  };

  const filtered = accounts.filter((a) => 
    a.username?.toLowerCase().includes(search.toLowerCase()) || 
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    a.profileCode?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setForm(createEmptyForm());
    setShowModal(true);
  };

  const openResetPassword = (id) => {
    setSelectedAccountId(id);
    setPasswordForm({ newPassword: "" });
    setShowPasswordModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminAccountService.createAccount(buildCreatePayload(form));
      showToast("success", "Thành công", "Đã tạo tài khoản mới");
      setShowModal(false);
      fetchAccounts();
    } catch (error) {
      showToast("error", "Lỗi", error.message || "Không thể tạo tài khoản");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await adminAccountService.resetPassword(selectedAccountId, passwordForm.newPassword);
      showToast("success", "Thành công", "Đã đổi mật khẩu tài khoản");
      setShowPasswordModal(false);
    } catch (error) {
      showToast("error", "Lỗi", error.message || "Không thể đổi mật khẩu");
    }
  };

  const toggleStatus = async (account) => {
    try {
      await adminAccountService.updateAccountStatus(account.id, !account.isActive);
      showToast("success", "Thành công", `Đã ${!account.isActive ? 'kích hoạt' : 'khóa'} tài khoản`);
      fetchAccounts();
    } catch (error) {
      showToast("error", "Lỗi", "Không thể cập nhật trạng thái");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 style={{ color: "#1e293b" }}>Quản lý Tài khoản</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 2 }}>
            Quản lý tài khoản hệ thống và phân quyền
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ backgroundColor: "#1a3461", color: "white", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
        >
          <Plus size={16} /> Thêm tài khoản
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
        <div className="flex items-center justify-between px-5 py-4 flex-wrap gap-3" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b" }}>Danh sách tài khoản ({filtered.length})</p>
          <div style={{ position: "relative" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input
              placeholder="Tìm username, email, tên…"
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
            <table className="w-full" style={{ minWidth: 800 }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  {["Username", "Thông tin", "Vai trò", "Trạng thái", "Ngày tạo", "Thao tác"].map((h) => (
                    <th key={h} className="text-left px-4 py-3" style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td className="px-4 py-3" style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#1e293b", fontWeight: 600 }}>{a.username}</td>
                    <td className="px-4 py-3">
                      <p style={{ fontSize: "0.85rem", color: "#1e293b", fontWeight: 500 }}>{a.fullName}</p>
                      <p style={{ fontSize: "0.75rem", color: "#64748b" }}>{a.email}</p>
                      {a.profileCode && (
                        <p style={{ fontSize: "0.72rem", color: "#64748b", marginTop: 2 }}>
                          Mã hồ sơ: {a.profileCode}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1 w-fit">
                        <Shield size={12} /> {ROLES.find(r => r.value === getPrimaryRole(a))?.label || getPrimaryRole(a)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => toggleStatus(a)}
                        className={`px-2 py-1 rounded-full text-xs font-semibold border ${a.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                      >
                        {a.isActive ? "Hoạt động" : "Bị khóa"}
                      </button>
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: "0.78rem", color: "#64748b" }}>
                      {a.createdAt ? new Date(a.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => openResetPassword(a.id)} className="flex items-center gap-1 px-2 py-1 rounded text-blue-600 hover:bg-blue-50 transition-colors text-xs font-semibold">
                        <Key size={14} /> Đổi pass
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 24, maxWidth: 500, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 className="text-lg font-bold mb-4">Thêm tài khoản mới</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Username *</label>
                <input required value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Mật khẩu *</label>
                <input required type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Họ tên *</label>
                <input required value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Email *</label>
                <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Vai trò *</label>
                <select required value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full p-2 border rounded-lg text-sm">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              {form.role !== "ADMIN" && (
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    {form.role === "STUDENT" ? "Mã sinh viên *" : form.role === "LECTURER" ? "Mã giảng viên *" : "Mã cố vấn *"}
                  </label>
                  <input required value={form.profileCode} onChange={e => setForm({...form, profileCode: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold mb-1">Số điện thoại (tùy chọn)</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
              </div>
              {form.role === "STUDENT" && (
                <div>
                  <label className="block text-xs font-semibold mb-1">Ngày sinh (tùy chọn)</label>
                  <input type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold mb-1">Phòng ban / Khoa (tùy chọn)</label>
                <input value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
              </div>
              
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Tạo tài khoản</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 24, maxWidth: 400, width: "100%" }}>
            <h2 className="text-lg font-bold mb-4">Đổi mật khẩu</h2>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Mật khẩu mới *</label>
                <input required type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({newPassword: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Cập nhật</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountManagement;

import { useCallback, useEffect, useState } from "react";
import { Search, Edit2, Trash2, Plus, Loader2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import adminStudentService from "../../services/adminStudentService";

const ACADEMIC_STATUSES = [
  { value: "STUDYING", label: "Đang học" },
  { value: "ON_LEAVE", label: "Tạm nghỉ" },
  { value: "SUSPENDED", label: "Đình chỉ" },
  { value: "GRADUATED", label: "Tốt nghiệp" },
];

export function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({
    name: "",
    studentCode: "",
    email: "",
    phoneNumber: "",
    address: "",
    dateOfBirth: "",
    department: "",
    programCode: "",
    enrollmentYear: new Date().getFullYear(),
    academicStatus: "STUDYING",
    password: "",
    username: "",
  });
  
  const { showToast } = useToast();

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminStudentService.getAllStudents();
      setStudents(data);
    } catch {
      showToast("error", "Lỗi", "Không thể tải danh sách sinh viên");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStudents();
  }, [fetchStudents]);

  const filtered = students.filter((s) => 
    (s.fullName || s.name || "").toLowerCase().includes(search.toLowerCase()) || 
    s.studentCode?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const generateUsername = (studentCode) => {
    if (studentCode) {
      return studentCode.replace(/\s+/g, '').toLowerCase();
    }
    return "student_" + Math.random().toString(36).substr(2, 9);
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(form.password);
      showToast("success", "Đã sao chép", "Mật khẩu tạm thời đã được copy");
    } catch {
      showToast("warning", "Không thể sao chép", "Hãy chọn và copy mật khẩu thủ công");
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({
      name: "", studentCode: "", email: "", phoneNumber: "", address: "", 
      dateOfBirth: "", department: "", programCode: "",
      enrollmentYear: new Date().getFullYear(), academicStatus: "STUDYING", password: generateRandomPassword(), username: "",
    });
    setShowModal(true);
  };

  const openEdit = (student) => {
    setEditingId(student.id);
    setForm({
      name: student.fullName || student.name || "",
      studentCode: student.studentCode || "",
      email: student.email || "",
      phoneNumber: student.phoneNumber || "",
      address: student.address || "",
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : "",
      department: student.department || "",
      programCode: student.programCode || "",
      enrollmentYear: student.enrollmentYear || new Date().getFullYear(),
      academicStatus: student.academicStatus || "STUDYING",
      password: "",
      username: student.username || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let submitData = { ...form };

      if (editingId) {
        await adminStudentService.updateStudent(editingId, {
          fullName: submitData.name,
          studentCode: submitData.studentCode,
          email: submitData.email,
          phone: submitData.phoneNumber,
          dateOfBirth: submitData.dateOfBirth || null,
        });
        showToast("success", "Thành công", "Đã cập nhật sinh viên");
      } else {
        // Khi tạo mới: cần username và password
        if (!submitData.username) {
          submitData.username = generateUsername(submitData.studentCode);
        }

        await adminStudentService.createStudent({
          username: submitData.username,
          password: submitData.password,
          fullName: submitData.name,
          studentCode: submitData.studentCode,
          email: submitData.email,
          phone: submitData.phoneNumber,
          dateOfBirth: submitData.dateOfBirth || null,
        });
        showToast("success", "Thành công", "Đã thêm sinh viên mới");
      }
      setShowModal(false);
      fetchStudents();
    } catch (error) {
      showToast("error", "Lỗi", error.message || "Không thể lưu thông tin");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sinh viên này?")) {
      try {
        await adminStudentService.deleteStudent(id);
        showToast("success", "Thành công", "Đã xóa sinh viên");
        fetchStudents();
      } catch {
        showToast("error", "Lỗi", "Không thể xóa sinh viên");
      }
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await adminStudentService.updateStudentStatus(id, status);
      showToast("success", "Thành công", "Đã cập nhật trạng thái");
      fetchStudents();
    } catch {
      showToast("error", "Lỗi", "Không thể cập nhật trạng thái");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 style={{ color: "#1e293b" }}>Quản lý Sinh viên</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 2 }}>
            Danh sách, thông tin và trạng thái học vụ
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ backgroundColor: "#1a3461", color: "white", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
        >
          <Plus size={16} /> Thêm sinh viên
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
        <div className="flex items-center justify-between px-5 py-4 flex-wrap gap-3" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b" }}>Danh sách sinh viên ({filtered.length})</p>
          <div style={{ position: "relative" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input
              placeholder="Tìm MSSV, họ tên, email…"
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
                  {["MSSV", "Họ và tên", "Email", "Khoa / Ngành", "Trạng thái", "Thao tác"].map((h) => (
                    <th key={h} className="text-left px-4 py-3" style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td className="px-4 py-3" style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#10b981", fontWeight: 600 }}>{s.studentCode}</td>
                    <td className="px-4 py-3" style={{ fontSize: "0.85rem", color: "#1e293b", fontWeight: 500 }}>{s.fullName || s.name}</td>
                    <td className="px-4 py-3" style={{ fontSize: "0.78rem", color: "#64748b" }}>{s.email}</td>
                    <td className="px-4 py-3" style={{ fontSize: "0.78rem", color: "#64748b" }}>
                      {s.department || "—"}<br/>
                      <span style={{ fontSize: "0.68rem" }}>{s.programCode || ""}</span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={s.academicStatus || "STUDYING"}
                        onChange={(e) => handleStatusChange(s.id, e.target.value)}
                        style={{ padding: "4px 8px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.75rem", outline: "none" }}
                      >
                        {ACADEMIC_STATUSES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors">
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

      {showModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 24, maxWidth: 600, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 className="text-lg font-bold mb-4">
              {editingId ? "Sửa thông tin" : "Thêm sinh viên mới"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1: Họ tên + Mã sinh viên */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Họ tên *</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Mã sinh viên *</label>
                  <input required value={form.studentCode} onChange={e => setForm({...form, studentCode: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                </div>
              </div>

              {/* Tài khoản chỉ hiển thị khi chỉnh sửa */}
              {editingId && (
                  <div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Tên tài khoản</label>
                      <input
                          type="text"
                          value={form.username}
                          readOnly
                          className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-gray-600"
                          title="Không thể chỉnh sửa"
                      />
                    </div>
                  </div>
              )}

              {/* Row 2: Email + SĐT */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Email *</label>
                  <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">SĐT</label>
                  <input value={form.phoneNumber} onChange={e => setForm({...form, phoneNumber: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                </div>
              </div>

              {/* Row 3: Khoa / Viện + Mã CTĐT */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Khoa / Viện</label>
                  <input value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Mã CTĐT</label>
                  <input value={form.programCode} onChange={e => setForm({...form, programCode: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                </div>
              </div>

              {/* Row 4: Ngày sinh + Năm nhập học */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Ngày sinh</label>
                  <input type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Năm nhập học</label>
                  <input type="number" value={form.enrollmentYear} onChange={e => setForm({...form, enrollmentYear: parseInt(e.target.value) || 2026})} className="w-full p-2 border rounded-lg text-sm" />
                </div>
              </div>

              {/* Row 5: Địa chỉ (full width) */}
              <div>
                <label className="block text-xs font-semibold mb-1">Địa chỉ</label>
                <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
              </div>

              {/* Row 6: Password (chỉ hiển thị khi tạo mới) */}
              {!editingId && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Mật khẩu tạm thời tự tạo</label>
                      <input
                          type="text"
                          value={form.password}
                          readOnly
                          className="w-full p-2 border rounded-lg text-sm bg-gray-50 text-gray-600"
                          title="Mật khẩu được tạo tự động"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        FE tự sinh mật khẩu tạm thời để gửi cho API tạo sinh viên hiện tại.
                      </p>
                    </div>
                    <div className="flex items-end gap-2">
                      <button
                          type="button"
                          onClick={() => setForm({...form, password: generateRandomPassword()})}
                          className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-semibold"
                      >
                        Tạo lại
                      </button>
                      <button
                          type="button"
                          onClick={copyPassword}
                          className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-semibold"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
              )}

              {/* Button group */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentManagement;

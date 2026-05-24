import { useCallback, useEffect, useMemo, useState } from "react";
import { CreditCard, Loader2, Plus, Search, Trash2, WalletCards } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import adminFinanceService from "../../services/adminFinanceService";
import adminSchedulingService from "../../services/adminSchedulingService";
import adminStudentService from "../../services/adminStudentService";

const EMPTY_FORM = {
  studentId: "",
  semesterId: "",
  totalAmount: "",
  paidAmount: 0,
  status: "OWED",
  dueDate: "",
  note: "",
};

export function TuitionManagement() {
  const [records, setRecords] = useState([]);
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [paymentForm, setPaymentForm] = useState({ recordId: "", amount: "", note: "" });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [recordData, paymentData, studentData, semesterData] = await Promise.all([
        adminFinanceService.getTuitionRecords(),
        adminFinanceService.getPayments(),
        adminStudentService.getAllStudents(),
        adminSchedulingService.getSemesters(),
      ]);
      setRecords(Array.isArray(recordData) ? recordData : []);
      setPayments(Array.isArray(paymentData) ? paymentData : []);
      setStudents(Array.isArray(studentData) ? studentData : []);
      setSemesters(Array.isArray(semesterData) ? semesterData : []);
    } catch (error) {
      showToast("error", "Lỗi", error.message || "Không thể tải dữ liệu công nợ");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  async function submitRecord(event) {
    event.preventDefault();
    try {
      setSubmitting(true);
      await adminFinanceService.createTuitionRecord({
        ...form,
        studentId: Number(form.studentId),
        semesterId: Number(form.semesterId),
        totalAmount: Number(form.totalAmount),
        paidAmount: Number(form.paidAmount || 0),
      });
      showToast("success", "Đã tạo", "Khoản học phí đã được ghi nhận");
      setForm(EMPTY_FORM);
      setShowForm(false);
      await loadData();
    } catch (error) {
      showToast("error", "Lỗi", error.message || "Không thể tạo khoản học phí");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitPayment(event) {
    event.preventDefault();
    try {
      setSubmitting(true);
      await adminFinanceService.addTuitionPayment(
        paymentForm.recordId,
        Number(paymentForm.amount),
        paymentForm.note || "Admin ghi nhận thanh toán"
      );
      showToast("success", "Đã cập nhật", "Thanh toán đã được cộng vào công nợ");
      setPaymentForm({ recordId: "", amount: "", note: "" });
      await loadData();
    } catch (error) {
      showToast("error", "Lỗi", error.message || "Không thể cập nhật thanh toán");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteRecord(id) {
    if (!window.confirm("Bạn có chắc chắn muốn xóa khoản học phí này?")) return;
    try {
      await adminFinanceService.deleteTuitionRecord(id);
      showToast("info", "Đã xóa", "Khoản học phí đã được xóa");
      await loadData();
    } catch (error) {
      showToast("error", "Lỗi", error.message || "Không thể xóa khoản học phí");
    }
  }

  const filtered = useMemo(() => {
    const keyword = search.toLowerCase();
    return records.filter((record) => {
      const matchesKeyword = `${record.studentCode || ""} ${record.studentName || ""} ${record.studentEmail || ""}`
        .toLowerCase()
        .includes(keyword);
      const matchesStatus = !status || record.status === status;
      const matchesSemester = !semesterId || String(record.semesterId) === String(semesterId);
      return matchesKeyword && matchesStatus && matchesSemester;
    });
  }, [records, search, semesterId, status]);

  const owedCount = records.filter((record) => record.status === "OWED" || record.status === "PARTIAL").length;
  const outstandingTotal = records.reduce((sum, record) => sum + Number(record.outstandingAmount || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 style={{ color: "#1e293b" }}>Quản lý công nợ</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 2 }}>
            Theo dõi học phí, trạng thái nợ và ghi nhận thanh toán thủ công
          </p>
        </div>
        <button
          onClick={() => setShowForm((value) => !value)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ backgroundColor: "#047857" }}
        >
          <Plus size={16} /> Tạo công nợ
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={CreditCard} label="Tổng khoản học phí" value={records.length} color="#2563eb" bg="#dbeafe" />
        <StatCard icon={WalletCards} label="Còn nợ / trả một phần" value={owedCount} color="#f59e0b" bg="#fef3c7" />
        <StatCard icon={CreditCard} label="Tổng dư nợ" value={`${outstandingTotal.toLocaleString("vi-VN")} đ`} color="#dc2626" bg="#fee2e2" />
      </div>

      {showForm && (
        <section className="rounded-2xl p-5" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
          <p className="font-bold text-slate-800 mb-4">Tạo khoản học phí</p>
          <form onSubmit={submitRecord} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SelectField label="Sinh viên" value={form.studentId} onChange={(value) => setForm({ ...form, studentId: value })} required>
              <option value="">Chọn sinh viên</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>{student.studentCode} - {student.fullName}</option>
              ))}
            </SelectField>
            <SelectField label="Học kỳ" value={form.semesterId} onChange={(value) => setForm({ ...form, semesterId: value })} required>
              <option value="">Chọn học kỳ</option>
              {semesters.map((semester) => (
                <option key={semester.id} value={semester.id}>{semester.code} - {semester.name}</option>
              ))}
            </SelectField>
            <InputField label="Tổng tiền" type="number" value={form.totalAmount} onChange={(value) => setForm({ ...form, totalAmount: value })} required />
            <InputField label="Đã thanh toán" type="number" value={form.paidAmount} onChange={(value) => setForm({ ...form, paidAmount: value })} />
            <InputField label="Hạn đóng" type="date" value={form.dueDate} onChange={(value) => setForm({ ...form, dueDate: value })} />
            <InputField label="Ghi chú" value={form.note} onChange={(value) => setForm({ ...form, note: value })} />
            <div className="md:col-span-3 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
              <button disabled={submitting} className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: "#047857" }}>
                Lưu công nợ
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-2xl p-5" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
        <p className="font-bold text-slate-800 mb-4">Ghi nhận thanh toán</p>
        <form onSubmit={submitPayment} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SelectField label="Khoản học phí" value={paymentForm.recordId} onChange={(value) => setPaymentForm({ ...paymentForm, recordId: value })} required>
            <option value="">Chọn khoản học phí</option>
            {records.map((record) => (
              <option key={record.id} value={record.id}>
                #{record.id} - {record.studentCode} - {record.semesterCode} - còn {Number(record.outstandingAmount || 0).toLocaleString("vi-VN")} đ
              </option>
            ))}
          </SelectField>
          <InputField label="Số tiền" type="number" value={paymentForm.amount} onChange={(value) => setPaymentForm({ ...paymentForm, amount: value })} required />
          <InputField label="Ghi chú" value={paymentForm.note} onChange={(value) => setPaymentForm({ ...paymentForm, note: value })} />
          <div className="flex items-end">
            <button disabled={submitting} className="w-full px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: "#2563eb" }}>
              Cập nhật thanh toán
            </button>
          </div>
        </form>
      </section>

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
        <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm sinh viên..." className="pl-8 pr-3 py-2 border rounded-lg text-sm outline-none" />
          </div>
          <div className="flex gap-2">
            <select value={semesterId} onChange={(event) => setSemesterId(event.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white">
              <option value="">Tất cả học kỳ</option>
              {semesters.map((semester) => <option key={semester.id} value={semester.id}>{semester.code}</option>)}
            </select>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white">
              <option value="">Tất cả trạng thái</option>
              {["OWED", "PARTIAL", "PAID", "WAIVED"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-green-600" size={32} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: 980 }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  {["Sinh viên", "Học kỳ", "Tổng", "Đã đóng", "Còn lại", "Trạng thái", "Hạn đóng", ""].map((header) => (
                    <th key={header} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((record) => (
                  <tr key={record.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-800">{record.studentName}</p>
                      <p className="text-xs text-slate-500">{record.studentCode}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{record.semesterCode}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{Number(record.totalAmount || 0).toLocaleString("vi-VN")} đ</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{Number(record.paidAmount || 0).toLocaleString("vi-VN")} đ</td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-900">{Number(record.outstandingAmount || 0).toLocaleString("vi-VN")} đ</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 rounded-lg text-xs font-bold" style={statusStyle(record.status)}>{record.status}</span></td>
                    <td className="px-4 py-3 text-sm text-slate-700">{record.dueDate || "—"}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteRecord(record.id)} title="Xóa" className="w-8 h-8 inline-flex items-center justify-center border rounded-lg">
                        <Trash2 size={14} color="#dc2626" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan="8" className="text-center py-8 text-sm text-slate-500">Không có khoản học phí nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <section className="rounded-2xl p-5" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
        <p className="font-bold text-slate-800 mb-4">Giao dịch gần đây</p>
        <div className="grid gap-2">
          {payments.slice(0, 8).map((payment) => (
            <div key={payment.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
              <div>
                <p className="text-sm font-semibold text-slate-800">{payment.studentCode} - {payment.studentName}</p>
                <p className="text-xs text-slate-500">{payment.transactionCode}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">{Number(payment.amount || 0).toLocaleString("vi-VN")} đ</p>
                <p className="text-xs text-slate-500">{payment.status}</p>
              </div>
            </div>
          ))}
          {payments.length === 0 && <p className="text-sm text-slate-500">Chưa có giao dịch</p>}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500">{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
          <Icon size={17} color={color} />
        </div>
      </div>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function InputField({ label, value, onChange, type = "text", required }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-600 mb-1">{label}</span>
      <input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
    </label>
  );
}

function SelectField({ label, value, onChange, required, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-600 mb-1">{label}</span>
      <select required={required} value={value} onChange={(event) => onChange(event.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
        {children}
      </select>
    </label>
  );
}

function statusStyle(status) {
  if (status === "PAID" || status === "WAIVED") return { color: "#047857", backgroundColor: "#d1fae5" };
  if (status === "PARTIAL") return { color: "#b45309", backgroundColor: "#fef3c7" };
  return { color: "#dc2626", backgroundColor: "#fee2e2" };
}

export default TuitionManagement;

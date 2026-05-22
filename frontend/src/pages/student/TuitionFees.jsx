import { useState, useEffect } from "react";
import { CreditCard, AlertTriangle, CheckCircle2, Clock, Download, Loader2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import tuitionService from "../../services/tuitionService";

const STATUS_CFG = {
  PAID:    { label: "Đã thanh toán", color: "#10b981", bg: "#d1fae5", icon: CheckCircle2 },
  PARTIAL: { label: "Thanh toán 1 phần", color: "#3b82f6", bg: "#dbeafe", icon: CheckCircle2 },
  PENDING: { label: "Chưa thanh toán", color: "#f59e0b", bg: "#fef3c7", icon: AlertTriangle },
  OVERDUE: { label: "Quá hạn",       color: "#ef4444", bg: "#fee2e2", icon: AlertTriangle },
};

const fmt = (n) => n ? n.toLocaleString("vi-VN") + "₫" : "0₫";

export function TuitionFees() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [method, setMethod] = useState("MOMO");
  const { showToast } = useToast();

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const data = await tuitionService.getMyTuitionRecords();
      setFees(data);
    } catch (error) {
      showToast("error", "Lỗi", "Không thể tải danh sách học phí");
    } finally {
      setLoading(false);
    }
  };

  const pending  = fees.filter((f) => f.status === "PENDING" || f.status === "PARTIAL");
  const totalDue = pending.reduce((s, f) => s + (f.totalAmount - f.paidAmount), 0);
  const totalPaid = fees.reduce((s, f) => s + f.paidAmount, 0);

  function handlePay(fee) {
    setPaying(fee);
    setMethod("MOMO");
  }

  async function confirmPayment() {
    try {
      setConfirming(true);
      // Simulate connecting to payment gateway for 1.5s
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const amountToPay = paying.totalAmount - paying.paidAmount;
      const response = await tuitionService.createPayment(paying.id, amountToPay, method);
      
      // Auto mock confirm for testing
      await tuitionService.mockConfirmPayment(response.id, true, `MOCK_${Date.now()}`);
      
      showToast("success", "Thanh toán thành công!", `Đã tạo giao dịch qua ${method === "MOMO" ? "MoMo" : "Stripe"}.`);
      setPaying(null);
      fetchFees();
    } catch (error) {
      showToast("error", "Lỗi", error.message || "Không thể thanh toán");
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 style={{ color: "#1e293b" }}>Học phí</h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 2 }}>
          Theo dõi học phí các học kỳ · Thanh toán qua MoMo hoặc Stripe
        </p>
      </div>

      {/* Alert */}
      {totalDue > 0 && (
        <div className="flex items-center gap-3 rounded-2xl px-5 py-4" style={{ backgroundColor: "#fef3c7", border: "1px solid #fde68a" }}>
          <AlertTriangle size={20} color="#f59e0b" />
          <div className="flex-1">
            <p style={{ fontWeight: 700, color: "#92400e" }}>Cảnh báo nợ học phí</p>
            <p style={{ fontSize: "0.82rem", color: "#92400e", marginTop: 2 }}>
              Bạn còn <strong>{fmt(totalDue)}</strong> chưa thanh toán. Vui lòng hoàn tất trước hạn để tránh bị khóa đăng ký môn.
            </p>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Tổng phải đóng",  value: fmt(totalDue + totalPaid), color: "#1e293b", bg: "#f8fafc" },
          { label: "Đã thanh toán",   value: fmt(totalPaid),            color: "#10b981", bg: "#d1fae5" },
          { label: "Còn phải đóng",   value: fmt(totalDue),             color: "#f59e0b", bg: "#fef3c7" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="rounded-2xl p-5" style={{ backgroundColor: bg, border: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: "0.78rem", color: "#64748b" }}>{label}</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 800, color, marginTop: 4 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Fee list */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b" }}>Chi tiết học phí</p>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ fontSize: "0.75rem", color: "#475569", border: "1px solid #e2e8f0", background: "none", cursor: "pointer" }}>
            <Download size={13} /> Xuất PDF
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 640 }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                {["Học kỳ", "Tổng tiền", "Đã trả", "Hạn nộp", "Trạng thái", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3" style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fees.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-4">Không có bản ghi học phí</td></tr>
              ) : fees.map((fee) => {
                const cfg  = STATUS_CFG[fee.status] || STATUS_CFG.PENDING;
                const Icon = cfg.icon;
                return (
                  <tr key={fee.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td className="px-5 py-4">
                      <p style={{ fontSize: "0.85rem", fontWeight: 500, color: "#1e293b" }}>{fee.semesterName}</p>
                    </td>
                    <td className="px-5 py-4" style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1e293b" }}>
                      {fmt(fee.totalAmount)}
                    </td>
                    <td className="px-5 py-4" style={{ fontSize: "0.9rem", color: "#10b981", fontWeight: 600 }}>
                      {fmt(fee.paidAmount)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} color="#94a3b8" />
                        <span style={{ fontSize: "0.78rem", color: "#475569" }}>
                          {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString("vi-VN") : "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full" style={{ backgroundColor: cfg.bg, color: cfg.color, fontSize: "0.72rem", fontWeight: 600 }}>
                        <Icon size={10} /> {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {(fee.status === "PENDING" || fee.status === "PARTIAL") && (
                        <button
                          onClick={() => handlePay(fee)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl"
                          style={{ backgroundColor: "#1a3461", color: "white", border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}
                        >
                          <CreditCard size={13} /> Thanh toán
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment modal */}
      {paying && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ backgroundColor: "#fff", borderRadius: 20, padding: 28, maxWidth: 440, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>
            <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "#1e293b", marginBottom: 4 }}>Xác nhận Thanh toán</p>
            <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: 20 }}>Học phí {paying.semesterName}</p>

            <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: "#f8fafc" }}>
              <div className="flex justify-between mb-2">
                <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Tổng học phí</span>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1e293b" }}>{fmt(paying.totalAmount)}</span>
              </div>
              <div className="flex justify-between mb-3 pb-3 border-b border-slate-200">
                <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Đã trả</span>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#10b981" }}>{fmt(paying.paidAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Cần thanh toán</span>
                <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ef4444" }}>{fmt(paying.totalAmount - paying.paidAmount)}</span>
              </div>
            </div>

            <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: 10 }}>Chọn phương thức thanh toán</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { key: "MOMO",   label: "MoMo",   color: "#e91e8c", desc: "Ví điện tử MoMo" },
                { key: "STRIPE", label: "Stripe", color: "#635bff", desc: "Thẻ tín dụng / Stripe" },
              ].map(({ key, label, color, desc }) => (
                <button
                  key={key}
                  disabled={confirming}
                  onClick={() => setMethod(key)}
                  style={{
                    padding: "14px 12px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                    border: `2px solid ${method === key ? color : "#e2e8f0"}`,
                    backgroundColor: method === key ? `${color}10` : "#fff",
                    opacity: confirming ? 0.6 : 1,
                  }}
                >
                  <p style={{ fontWeight: 700, fontSize: "0.9rem", color }}>{label}</p>
                  <p style={{ fontSize: "0.72rem", color: "#64748b", marginTop: 2 }}>{desc}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                disabled={confirming}
                onClick={() => setPaying(null)}
                className="flex-1 py-2.5 rounded-xl"
                style={{ border: "1px solid #e2e8f0", background: "none", cursor: "pointer", fontSize: "0.85rem", color: "#475569", opacity: confirming ? 0.5 : 1 }}
              >
                Hủy
              </button>
              <button
                disabled={confirming}
                onClick={confirmPayment}
                className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2"
                style={{ backgroundColor: "#1a3461", color: "white", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700, opacity: confirming ? 0.8 : 1 }}
              >
                {confirming ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Thanh toán"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TuitionFees;
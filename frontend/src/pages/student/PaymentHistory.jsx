import { useState, useEffect } from "react";
import { Loader2, Receipt, XCircle } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import tuitionService from "../../services/tuitionService";

const STATUS_CFG = {
  PENDING:   { label: "Đang chờ",   color: "#f59e0b", bg: "#fef3c7" },
  SUCCESS:   { label: "Thành công", color: "#10b981", bg: "#d1fae5" },
  FAILED:    { label: "Thất bại",   color: "#ef4444", bg: "#fee2e2" },
  CANCELLED: { label: "Đã hủy",     color: "#64748b", bg: "#f1f5f9" },
};

const fmt = (n) => n ? n.toLocaleString("vi-VN") + "₫" : "0₫";

export function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await tuitionService.getMyPayments();
      setPayments(data);
    } catch (error) {
      showToast("error", "Lỗi", "Không thể tải lịch sử thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await tuitionService.cancelPayment(id);
      showToast("success", "Đã hủy", "Hủy thanh toán thành công");
      fetchPayments();
    } catch (error) {
      showToast("error", "Lỗi", "Không thể hủy thanh toán");
    }
  };

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
        <h1 style={{ color: "#1e293b" }}>Lịch sử Thanh toán</h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 2 }}>
          Lịch sử giao dịch thanh toán học phí của bạn
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 640 }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                {["Mã GD", "Học kỳ", "Số tiền", "Phương thức", "Ngày tạo", "Trạng thái", "Thao tác"].map((h) => (
                  <th key={h} className="text-left px-5 py-3" style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-4">Chưa có giao dịch nào</td></tr>
              ) : payments.map((payment) => {
                const cfg = STATUS_CFG[payment.status] || STATUS_CFG.PENDING;
                return (
                  <tr key={payment.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td className="px-5 py-4">
                      <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#2563eb", fontFamily: "monospace" }}>#{payment.id}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p style={{ fontSize: "0.85rem", color: "#1e293b" }}>{payment.semesterName || "—"}</p>
                    </td>
                    <td className="px-5 py-4" style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1e293b" }}>
                      {fmt(payment.amount)}
                    </td>
                    <td className="px-5 py-4" style={{ fontSize: "0.85rem", color: "#475569" }}>
                      {payment.provider === "MOCK" ? (
                        payment.providerReference?.startsWith("MOMO") ? "MoMo (Mô phỏng)" :
                        payment.providerReference?.startsWith("STRIPE") ? "Stripe (Mô phỏng)" :
                        "Thử nghiệm"
                      ) : payment.provider}
                    </td>
                    <td className="px-5 py-4" style={{ fontSize: "0.85rem", color: "#475569" }}>
                      {new Date(payment.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center justify-center w-fit px-2.5 py-1 rounded-full" style={{ backgroundColor: cfg.bg, color: cfg.color, fontSize: "0.72rem", fontWeight: 600 }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {payment.status === "PENDING" && (
                        <button
                          onClick={() => handleCancel(payment.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                          style={{ border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}
                        >
                          <XCircle size={14} /> Hủy
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
    </div>
  );
}

export default PaymentHistory;

import { useState, useEffect } from "react";
import { CreditCard, AlertTriangle, CheckCircle2, Clock, Loader2, ArrowLeft, QrCode, Lock, Smartphone } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import tuitionService from "../../services/tuitionService";

const STATUS_CFG = {
  PAID:    { label: "Đã thanh toán", color: "#10b981", bg: "#d1fae5", icon: CheckCircle2 },
  PARTIAL: { label: "Thanh toán 1 phần", color: "#3b82f6", bg: "#dbeafe", icon: CheckCircle2 },
  OWED:    { label: "Chưa thanh toán", color: "#f59e0b", bg: "#fef3c7", icon: AlertTriangle },
  OVERDUE: { label: "Quá hạn",       color: "#ef4444", bg: "#fee2e2", icon: AlertTriangle },
  WAIVED:  { label: "Miễn học phí",    color: "#64748b", bg: "#f1f5f9", icon: CheckCircle2 },
};

const fmt = (n) => n ? n.toLocaleString("vi-VN") + "₫" : "0₫";

export function TuitionFees() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [method, setMethod] = useState("MOMO");
  const [paymentStep, setPaymentStep] = useState("SELECT_METHOD"); // SELECT_METHOD, GATEWAY_MOMO, GATEWAY_STRIPE, PROCESSING
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

  const pending  = fees.filter((f) => f.status === "OWED" || f.status === "PARTIAL");
  const totalDue = pending.reduce((s, f) => s + (f.totalAmount - f.paidAmount), 0);
  const totalPaid = fees.reduce((s, f) => s + f.paidAmount, 0);

  function handlePay(fee) {
    setPaying(fee);
    setMethod("MOMO");
    setPaymentStep("SELECT_METHOD");
  }

  async function confirmPayment() {
    try {
      setConfirming(true);
      setPaymentStep("PROCESSING");
      // Simulate network delay for 1.5s
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const amountToPay = paying.totalAmount - paying.paidAmount;
      // Gửi 'MOCK' lên backend để tránh lỗi không tìm thấy enum provider MOMO/STRIPE
      const response = await tuitionService.createPayment(paying.id, amountToPay, "MOCK");
      
      // Lưu vết phương thức thực tế (MOMO hay STRIPE) trong providerReference để hiển thị ở Lịch sử thanh toán
      const providerRef = `${method}_MOCK_${Date.now()}`;
      await tuitionService.mockConfirmPayment(response.id, true, providerRef);
      
      showToast("success", "Thanh toán thành công!", `Đã hoàn tất thanh toán học phí qua cổng ${method === "MOMO" ? "MoMo" : "Stripe"} (Mô phỏng).`);
      setPaying(null);
      setPaymentStep("SELECT_METHOD");
      fetchFees();
    } catch (error) {
      showToast("error", "Lỗi", error.message || "Không thể thanh toán");
      setPaymentStep(method === "MOMO" ? "GATEWAY_MOMO" : "GATEWAY_STRIPE");
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
                const cfg  = STATUS_CFG[fee.status] || STATUS_CFG.OWED;
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
                      {(fee.status === "OWED" || fee.status === "PARTIAL") && (
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
          <div style={{ backgroundColor: "#fff", borderRadius: 20, padding: 28, maxWidth: 440, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,0.2)", position: "relative", overflow: "hidden" }}>
            {paymentStep === "SELECT_METHOD" && (
              <>
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
                      onClick={() => setMethod(key)}
                      style={{
                        padding: "14px 12px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                        border: `2px solid ${method === key ? color : "#e2e8f0"}`,
                        backgroundColor: method === key ? `${color}10` : "#fff",
                      }}
                    >
                      <p style={{ fontWeight: 700, fontSize: "0.9rem", color }}>{label}</p>
                      <p style={{ fontSize: "0.72rem", color: "#64748b", marginTop: 2 }}>{desc}</p>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setPaying(null)}
                    className="flex-1 py-2.5 rounded-xl"
                    style={{ border: "1px solid #e2e8f0", background: "none", cursor: "pointer", fontSize: "0.85rem", color: "#475569" }}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => setPaymentStep(method === "MOMO" ? "GATEWAY_MOMO" : "GATEWAY_STRIPE")}
                    className="flex-1 py-2.5 rounded-xl"
                    style={{ backgroundColor: "#1a3461", color: "white", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }}
                  >
                    Tiếp tục
                  </button>
                </div>
              </>
            )}

            {paymentStep === "GATEWAY_MOMO" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: "#f1f5f9" }}>
                  <button 
                    onClick={() => setPaymentStep("SELECT_METHOD")}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 800, color: "#e91e8c", fontSize: "1rem" }}>CỔNG THANH TOÁN MOMO</p>
                    <p style={{ fontSize: "0.72rem", color: "#64748b" }}>Giao dịch thử nghiệm (Sandbox)</p>
                  </div>
                  <div style={{ backgroundColor: "#e91e8c15", padding: "6px 10px", borderRadius: 8 }}>
                    <span style={{ color: "#e91e8c", fontWeight: 700, fontSize: "0.78rem" }}>MOMO</span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  {/* Mã QR giả lập siêu đẹp */}
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-3 relative group">
                    <svg width="140" height="140" viewBox="0 0 100 100" style={{ color: "#1e293b" }}>
                      {/* Cấu trúc QR code giả lập */}
                      <rect width="100" height="100" fill="white" />
                      {/* Dấu định vị góc trên trái */}
                      <rect x="5" y="5" width="25" height="25" fill="#e91e8c" />
                      <rect x="10" y="10" width="15" height="15" fill="white" />
                      <rect x="13" y="13" width="9" height="9" fill="#e91e8c" />
                      {/* Dấu định vị góc trên phải */}
                      <rect x="70" y="5" width="25" height="25" fill="#e91e8c" />
                      <rect x="75" y="10" width="15" height="15" fill="white" />
                      <rect x="78" y="13" width="9" height="9" fill="#e91e8c" />
                      {/* Dấu định vị góc dưới trái */}
                      <rect x="5" y="70" width="25" height="25" fill="#e91e8c" />
                      <rect x="10" y="75" width="15" height="15" fill="white" />
                      <rect x="13" y="78" width="9" height="9" fill="#e91e8c" />
                      {/* Các điểm dữ liệu ngẫu nhiên */}
                      <rect x="35" y="5" width="5" height="10" fill="#e91e8c" />
                      <rect x="45" y="15" width="10" height="5" fill="#1e293b" />
                      <rect x="60" y="5" width="5" height="5" fill="#e91e8c" />
                      <rect x="35" y="25" width="15" height="5" fill="#1e293b" />
                      <rect x="55" y="20" width="5" height="15" fill="#e91e8c" />
                      <rect x="5" y="35" width="10" height="5" fill="#1e293b" />
                      <rect x="20" y="40" width="5" height="15" fill="#e91e8c" />
                      <rect x="10" y="50" width="5" height="5" fill="#1e293b" />
                      {/* Điểm dữ liệu giữa */}
                      <rect x="35" y="40" width="30" height="5" fill="#e91e8c" />
                      <rect x="40" y="50" width="10" height="15" fill="#1e293b" />
                      <rect x="55" y="45" width="15" height="10" fill="#e91e8c" />
                      <rect x="35" y="70" width="5" height="25" fill="#1e293b" />
                      <rect x="45" y="80" width="20" height="5" fill="#e91e8c" />
                      <rect x="55" y="70" width="10" height="10" fill="#1e293b" />
                      <rect x="70" y="35" width="15" height="5" fill="#1e293b" />
                      <rect x="80" y="45" width="5" height="20" fill="#e91e8c" />
                      <rect x="70" y="70" width="10" height="5" fill="#1e293b" />
                      <rect x="85" y="75" width="10" height="15" fill="#e91e8c" />
                      {/* Logo MoMo nhỏ ở giữa */}
                      <rect x="40" y="40" width="20" height="20" rx="4" fill="#e91e8c" />
                      <text x="50" y="52" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">M</text>
                    </svg>
                    <div className="absolute inset-0 bg-[#e91e8c]/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                      <QrCode className="text-[#e91e8c] size-8 animate-pulse" />
                    </div>
                  </div>
                  
                  <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b" }}>
                    Quét mã để thanh toán
                  </p>
                  <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "#e91e8c", marginTop: 2 }}>
                    {fmt(paying.totalAmount - paying.paidAmount)}
                  </p>
                </div>

                <div className="space-y-2.5 rounded-xl p-3.5 border border-dashed" style={{ borderColor: "#cbd5e1" }}>
                  <div className="flex justify-between" style={{ fontSize: "0.78rem" }}>
                    <span style={{ color: "#64748b" }}>Nhà trường:</span>
                    <span style={{ fontWeight: 600, color: "#334155" }}>Hệ thống QLSV THPT</span>
                  </div>
                  <div className="flex justify-between" style={{ fontSize: "0.78rem" }}>
                    <span style={{ color: "#64748b" }}>Học kỳ:</span>
                    <span style={{ fontWeight: 600, color: "#334155" }}>{paying.semesterName}</span>
                  </div>
                  <div className="flex justify-between" style={{ fontSize: "0.78rem" }}>
                    <span style={{ color: "#64748b" }}>Nội dung:</span>
                    <span style={{ fontWeight: 600, color: "#e91e8c", fontFamily: "monospace" }}>QLSV_{paying.id}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setPaymentStep("SELECT_METHOD")}
                    className="flex-1 py-2.5 rounded-xl"
                    style={{ border: "1px solid #e2e8f0", background: "none", cursor: "pointer", fontSize: "0.85rem", color: "#475569" }}
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={confirmPayment}
                    className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2"
                    style={{ backgroundColor: "#e91e8c", color: "white", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }}
                  >
                    <Smartphone size={15} /> Xác nhận đã quét
                  </button>
                </div>
              </div>
            )}

            {paymentStep === "GATEWAY_STRIPE" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: "#f1f5f9" }}>
                  <button 
                    onClick={() => setPaymentStep("SELECT_METHOD")}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 800, color: "#635bff", fontSize: "1rem" }}>CỔNG THANH TOÁN STRIPE</p>
                    <p style={{ fontSize: "0.72rem", color: "#64748b" }}>Giao dịch thử nghiệm (Sandbox)</p>
                  </div>
                  <div style={{ backgroundColor: "#635bff15", padding: "6px 10px", borderRadius: 8 }}>
                    <span style={{ color: "#635bff", fontWeight: 700, fontSize: "0.78rem" }}>Stripe</span>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Số tiền thanh toán</label>
                    <div className="p-3 rounded-xl" style={{ backgroundColor: "#635bff08", border: "1px solid #635bff20" }}>
                      <p style={{ fontSize: "1.1rem", fontWeight: 800, color: "#635bff" }}>{fmt(paying.totalAmount - paying.paidAmount)}</p>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 rounded-2xl border" style={{ borderColor: "#e2e8f0", backgroundColor: "#fff" }}>
                    <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "#f1f5f9" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>Thông tin thẻ tín dụng</span>
                      <Lock size={12} color="#635bff" />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.68rem", color: "#64748b", display: "block", marginBottom: 3 }}>Số thẻ (Card Number)</label>
                      <input 
                        type="text" 
                        readOnly 
                        value="4242 •••• •••• 4242" 
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: "0.85rem", fontFamily: "monospace", color: "#334155", backgroundColor: "#f8fafc", cursor: "not-allowed" }} 
                      />
                      <span style={{ fontSize: "0.65rem", color: "#635bff", display: "block", marginTop: 2 }}>Thẻ thử nghiệm được điền sẵn mặc định</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label style={{ fontSize: "0.68rem", color: "#64748b", display: "block", marginBottom: 3 }}>Hết hạn (MM/YY)</label>
                        <input 
                          type="text" 
                          readOnly 
                          value="12/28" 
                          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: "0.85rem", fontFamily: "monospace", color: "#334155", backgroundColor: "#f8fafc", cursor: "not-allowed" }} 
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.68rem", color: "#64748b", display: "block", marginBottom: 3 }}>CVC / CVV</label>
                        <input 
                          type="password" 
                          readOnly 
                          value="123" 
                          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: "0.85rem", fontFamily: "monospace", color: "#334155", backgroundColor: "#f8fafc", cursor: "not-allowed" }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setPaymentStep("SELECT_METHOD")}
                    className="flex-1 py-2.5 rounded-xl"
                    style={{ border: "1px solid #e2e8f0", background: "none", cursor: "pointer", fontSize: "0.85rem", color: "#475569" }}
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={confirmPayment}
                    className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2"
                    style={{ backgroundColor: "#635bff", color: "white", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }}
                  >
                    Thanh toán bằng thẻ
                  </button>
                </div>
              </div>
            )}

            {paymentStep === "PROCESSING" && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="animate-spin text-blue-600 size-10" />
                <div className="text-center">
                  <p style={{ fontWeight: 700, color: "#1e293b", fontSize: "1rem" }}>Đang kết nối cổng thanh toán...</p>
                  <p style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 2 }}>Vui lòng không đóng trình duyệt hoặc tải lại trang</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TuitionFees;
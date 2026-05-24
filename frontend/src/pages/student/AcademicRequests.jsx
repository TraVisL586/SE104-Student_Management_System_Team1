import { useCallback, useEffect, useState } from "react";
import { FileText, Plus, Clock, CheckCircle2, XCircle, AlertCircle, Send, Loader2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import academicRequestService from "../../services/academicRequestService";

const REQUEST_TYPES = [
  { value: "LEAVE_OF_ABSENCE", label: "Xin nghỉ học tạm thời" },
  { value: "GRADE_REVIEW", label: "Phúc khảo bài thi" },
  { value: "CREDIT_OVERLOAD", label: "Đăng ký vượt tín chỉ" },
  { value: "OTHER", label: "Khác" },
];

const STATUS_CFG = {
  APPROVED: { label: "Được duyệt",    color: "#10b981", bg: "#d1fae5", icon: CheckCircle2 },
  PENDING:  { label: "Đang xử lý",    color: "#f59e0b", bg: "#fef3c7", icon: Clock },
  REJECTED: { label: "Bị từ chối",    color: "#ef4444", bg: "#fee2e2", icon: XCircle },
};

export function AcademicRequest() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ type: REQUEST_TYPES[0].value, title: "", reason: "", attachmentUrl: "", urgent: false });
  const { showToast }           = useToast();

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await academicRequestService.getMyRequests();
      setRequests(data);
    } catch {
      showToast("error", "Lỗi", "Không thể tải lịch sử yêu cầu");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast("warning", "Thiếu thông tin", "Vui lòng nhập tiêu đề yêu cầu.");
      return;
    }
    if (!form.reason.trim()) {
      showToast("warning", "Thiếu thông tin", "Vui lòng nhập lý do / nội dung yêu cầu.");
      return;
    }
    try {
      await academicRequestService.createRequest(
        form.type,
        form.title,
        form.reason,
        form.attachmentUrl.trim() || null
      );
      showToast("success", "Đã gửi yêu cầu!", "Yêu cầu của bạn đang được xử lý.");
      setForm({ type: REQUEST_TYPES[0].value, title: "", reason: "", attachmentUrl: "", urgent: false });
      setShowForm(false);
      fetchRequests();
    } catch (error) {
      showToast("error", "Lỗi", error.message || "Không thể gửi yêu cầu");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 style={{ color: "#1e293b" }}>Yêu cầu Học vụ</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 2 }}>
            Nộp và theo dõi các đơn từ học vụ — xử lý bởi Cố vấn Học tập
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ backgroundColor: "#1a3461", color: "white", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
        >
          <Plus size={16} /> Nộp đơn mới
        </button>
      </div>

      {/* New request form */}
      {showForm && (
        <div className="rounded-2xl p-6" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
          <div className="flex items-center gap-2 mb-5">
            <FileText size={18} color="#2563eb" />
            <p style={{ fontWeight: 700, fontSize: "1rem", color: "#1e293b" }}>Đơn yêu cầu học vụ mới</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>
                Loại yêu cầu <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: "0.85rem", color: "#334155", outline: "none" }}
              >
                {REQUEST_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>
                Tiêu đề <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Xin nghỉ học tạm thời học kỳ 1"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: "0.85rem", color: "#334155", outline: "none" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>
                Lý do / Nội dung chi tiết <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Mô tả chi tiết lý do và nội dung yêu cầu của bạn…"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: "0.85rem", color: "#334155", outline: "none", resize: "vertical" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>
                Link minh chứng
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={form.attachmentUrl}
                onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: "0.85rem", color: "#334155", outline: "none" }}
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="urgent"
                checked={form.urgent}
                onChange={(e) => setForm({ ...form, urgent: e.target.checked })}
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
              <label htmlFor="urgent" style={{ fontSize: "0.82rem", color: "#334155", cursor: "pointer" }}>
                Đánh dấu khẩn cấp
              </label>
              {form.urgent && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem", color: "#f59e0b", fontWeight: 600 }}>
                  <AlertCircle size={12} /> Yêu cầu sẽ được ưu tiên xử lý
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl"
                style={{ border: "1px solid #e2e8f0", background: "none", cursor: "pointer", fontSize: "0.85rem", color: "#475569" }}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl"
                style={{ backgroundColor: "#1a3461", color: "white", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }}
              >
                <Send size={15} /> Gửi yêu cầu
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History */}
      <div className="rounded-2xl" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b" }}>Lịch sử yêu cầu</p>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : requests.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-500 text-sm">Chưa có yêu cầu nào</div>
        ) : (
          <div className="space-y-0">
            {requests.map((req) => {
              const cfg  = STATUS_CFG[req.status] || STATUS_CFG.PENDING;
              const Icon = cfg.icon;
              const typeLabel = REQUEST_TYPES.find(t => t.value === req.type)?.label || req.type;
              return (
                <div
                  key={req.id}
                  className="flex items-start gap-4 px-5 py-4"
                  style={{ borderBottom: "1px solid #f1f5f9" }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={17} color={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p style={{ fontWeight: 700, fontSize: "0.88rem", color: "#1e293b" }}>{req.title}</p>
                        <p style={{ fontFamily: "monospace", fontSize: "0.68rem", color: "#94a3b8", marginTop: 1 }}>{typeLabel} · YC-{req.id}</p>
                      </div>
                      <span
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: cfg.bg, color: cfg.color, fontSize: "0.7rem", fontWeight: 600, whiteSpace: "nowrap" }}
                      >
                        <Icon size={10} /> {cfg.label}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "#475569", marginTop: 6 }}>{req.content}</p>
                    {req.attachmentUrl && (
                      <a href={req.attachmentUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-blue-700 hover:underline">
                        Xem minh chứng
                      </a>
                    )}
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                        Ngày nộp: {new Date(req.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                      {req.reviewedAt && (
                        <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                          Xử lý: {new Date(req.reviewedAt).toLocaleDateString("vi-VN")} {req.advisorNote && ` - ${req.advisorNote}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AcademicRequest;

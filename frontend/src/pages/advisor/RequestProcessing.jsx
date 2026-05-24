import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle, Clock, MessageSquare, Search, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import advisorService from "../../services/advisorService";
import ConfirmDialog from "../../components/ConfirmDialog";

const STATUS_CFG = {
  PENDING:  { label: "Chờ xử lý",   color: "#f59e0b", bg: "#fef3c7", icon: Clock },
  APPROVED: { label: "Đã duyệt",    color: "#10b981", bg: "#d1fae5", icon: CheckCircle2 },
  REJECTED: { label: "Từ chối",     color: "#ef4444", bg: "#fee2e2", icon: XCircle },
};

export function RequestProcessing() {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [filter, setFilter] = useState("PENDING");
  const [reviewing, setReviewing] = useState(null);
  const [decisionTarget, setDecisionTarget] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const data = await advisorService.getAdvisorRequests(filter === "ALL" ? "" : filter);
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setLoadError(true);
      showToast("error", "Lỗi", "Không thể tải danh sách yêu cầu học vụ");
    } finally {
      setLoading(false);
    }
  }, [filter, showToast]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const filtered = useMemo(() => requests.filter((r) => {
    const matchS = r.studentName?.toLowerCase().includes(deferredSearch.toLowerCase()) ||
                   r.studentCode?.toLowerCase().includes(deferredSearch.toLowerCase()) ||
                   r.title?.toLowerCase().includes(deferredSearch.toLowerCase());
    return matchS;
  }), [deferredSearch, requests]);

  const openDecision = (request, isApproved) => {
    if (!note.trim() && !isApproved) {
      showToast("warning", "Cần ghi chú", "Vui lòng nhập lý do từ chối.");
      return;
    }
    setDecisionTarget({ request, approved: isApproved });
  };

  const decide = async () => {
    if (!decisionTarget) return;
    const { request, approved } = decisionTarget;
    try {
      setSubmitting(true);
      await advisorService.decideAcademicRequest(request.id, approved, note.trim());
      
      showToast(
        approved ? "success" : "info",
        approved ? "Đã duyệt yêu cầu" : "Đã từ chối yêu cầu",
        `${request.title} — ${request.studentName}`
      );
      
      setReviewing(null);
      setDecisionTarget(null);
      setNote("");
      await fetchRequests();
    } catch {
      showToast("error", "Lỗi", "Không thể xử lý yêu cầu");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 style={{ color: "#1e293b" }}>Xử lý Yêu cầu Học vụ</h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 2 }}>
          Duyệt hoặc từ chối các đơn yêu cầu học vụ của sinh viên
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "PENDING",  label: "Chờ xử lý" },
          { key: "APPROVED", label: "Đã duyệt" },
          { key: "REJECTED", label: "Từ chối" },
          { key: "ALL",      label: "Tất cả" },
        ].map(({ key, label }) => {
          const cfg = STATUS_CFG[key] ?? { color: "#64748b", bg: "#f1f5f9" };
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: "7px 16px", borderRadius: 10, fontSize: "0.82rem",
                backgroundColor: filter === key ? (key === "ALL" ? "#1a3461" : cfg.bg) : "#fff",
                color: filter === key ? (key === "ALL" ? "#fff" : cfg.color) : "#64748b",
                border: `1px solid ${filter === key ? (key === "ALL" ? "#1a3461" : cfg.color) : "#e2e8f0"}`,
                cursor: "pointer", fontWeight: filter === key ? 600 : 400,
              }}
            >
              {label}
            </button>
          );
        })}
        <div style={{ position: "relative", marginLeft: "auto" }}>
          <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input
            placeholder="Tìm đơn, sinh viên…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "0.82rem", outline: "none", width: 220 }}
          />
        </div>
      </div>

      {/* Requests list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : loadError ? (
          <div className="rounded-2xl p-10 text-center" style={{ backgroundColor: "#fff", border: "1px solid #fee2e2" }}>
            <AlertTriangle size={32} color="#ef4444" style={{ margin: "0 auto 10px" }} />
            <p className="text-sm font-semibold text-slate-800">Không thể tải danh sách yêu cầu</p>
            <button onClick={fetchRequests} className="mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold">
              <RefreshCw size={14} /> Tải lại
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
            <CheckCircle2 size={32} color="#cbd5e1" style={{ margin: "0 auto 10px" }} />
            <p style={{ color: "#94a3b8" }}>Không có yêu cầu nào {filter === "PENDING" ? "đang chờ xử lý" : ""}.</p>
          </div>
        ) : filtered.map((req) => {
          const cfg  = STATUS_CFG[req.status] || STATUS_CFG.PENDING;
          const Icon = cfg.icon || Clock;
          const isR  = reviewing === req.id;
          return (
            <div
              key={req.id}
              className="rounded-2xl p-5"
              style={{ backgroundColor: "#fff", border: `1px solid ${isR ? "#f59e0b" : "#e2e8f0"}` }}
            >
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex items-start gap-3">
                  <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={17} color={cfg.color} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p style={{ fontWeight: 700, fontSize: "0.92rem", color: "#1e293b" }}>{req.type}</p>
                    </div>
                    <p style={{ fontSize: "0.72rem", color: "#64748b", marginTop: 2 }}>
                      {req.studentName} · <span style={{ fontFamily: "monospace" }}>{req.studentCode}</span>
                    </p>
                    <p style={{ fontSize: "0.8rem", fontWeight: "600", color: "#1e293b", marginTop: 4 }}>{req.title}</p>
                    <p style={{ fontSize: "0.8rem", color: "#475569", marginTop: 2, lineHeight: 1.5 }}>{req.content}</p>
                    {req.advisorNote && (
                      <div className="mt-2 p-2 bg-slate-50 border rounded text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Ghi chú của Cố vấn: </span>{req.advisorNote}
                      </div>
                    )}
                    <p style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: 4 }}>Ngày tạo: {new Date(req.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, padding: "3px 10px", borderRadius: 9999, backgroundColor: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </span>
                  {req.status === "PENDING" && (
                    <button
                      onClick={() => { setReviewing(isR ? null : req.id); setNote(""); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                      style={{ backgroundColor: "#fef3c7", color: "#92400e", border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}
                    >
                      <MessageSquare size={12} /> {isR ? "Thu gọn" : "Xử lý"}
                    </button>
                  )}
                </div>
              </div>

              {/* Review panel */}
              {isR && (
                <div className="mt-4 pt-4 space-y-3" style={{ borderTop: "1px solid #f1f5f9" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#334155", display: "block", marginBottom: 5 }}>
                      Ghi chú / Lý do xử lý
                    </label>
                    <textarea
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Nhập ghi chú hoặc lý do duyệt/từ chối…"
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "0.82rem", outline: "none", resize: "none" }}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => openDecision(req, true)}
                      disabled={submitting}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl disabled:opacity-50"
                      style={{ backgroundColor: "#065f46", color: "white", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
                    >
                      <CheckCircle2 size={15} /> Duyệt
                    </button>
                    <button
                      onClick={() => openDecision(req, false)}
                      disabled={submitting}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl disabled:opacity-50"
                      style={{ backgroundColor: "#fee2e2", color: "#ef4444", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
                    >
                      <XCircle size={15} /> Từ chối
                    </button>
                    <button
                      onClick={() => setReviewing(null)}
                      disabled={submitting}
                      className="px-4 py-2.5 rounded-xl disabled:opacity-50"
                      style={{ border: "1px solid #e2e8f0", background: "none", cursor: "pointer", fontSize: "0.85rem" }}
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!decisionTarget}
        title={decisionTarget?.approved ? "Duyệt yêu cầu học vụ?" : "Từ chối yêu cầu học vụ?"}
        description={decisionTarget ? `${decisionTarget.request.studentCode} - ${decisionTarget.request.studentName}: ${decisionTarget.request.title}` : ""}
        confirmLabel={decisionTarget?.approved ? "Duyệt yêu cầu" : "Từ chối yêu cầu"}
        variant={decisionTarget?.approved ? "success" : "danger"}
        loading={submitting}
        onCancel={() => setDecisionTarget(null)}
        onConfirm={decide}
      />
    </div>
  );
}

export default RequestProcessing;

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Search, XCircle } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import adminGradeService from "../../services/adminGradeService";

const STATUS_OPTIONS = ["", "PENDING", "APPROVED", "REJECTED"];

export function GradeUnlockRequests() {
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("PENDING");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [notes, setNotes] = useState({});
  const { showToast } = useToast();

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminGradeService.getGradeUnlockRequests(status || undefined);
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast("error", "Lỗi", error.message || "Không thể tải yêu cầu mở khóa điểm");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [showToast, status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRequests();
  }, [loadRequests]);

  async function decide(requestId, approved) {
    try {
      setProcessingId(requestId);
      await adminGradeService.decideGradeUnlockRequest(
        requestId,
        approved,
        notes[requestId] || (approved ? "Đồng ý mở khóa điểm" : "Từ chối yêu cầu")
      );
      showToast("success", "Đã xử lý", approved ? "Đã duyệt mở khóa điểm" : "Đã từ chối yêu cầu");
      await loadRequests();
    } catch (error) {
      showToast("error", "Lỗi", error.message || "Không thể xử lý yêu cầu");
    } finally {
      setProcessingId(null);
    }
  }

  const filtered = useMemo(() => {
    const keyword = search.toLowerCase();
    return requests.filter((item) =>
      `${item.lecturerCode || ""} ${item.lecturerName || ""} ${item.reason || ""} ${item.status || ""}`
        .toLowerCase()
        .includes(keyword)
    );
  }, [requests, search]);

  return (
    <div className="space-y-5">
      <div>
        <h1 style={{ color: "#1e293b" }}>Duyệt mở khóa điểm</h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 2 }}>
          Xem lý do của giảng viên, duyệt hoặc từ chối yêu cầu chỉnh sửa điểm đã publish
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
        <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm giảng viên, lý do..."
              className="pl-8 pr-3 py-2 border rounded-lg text-sm outline-none"
              style={{ width: 260 }}
            />
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white">
            {STATUS_OPTIONS.map((option) => (
              <option key={option || "ALL"} value={option}>
                {option || "Tất cả trạng thái"}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-green-600" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: 900 }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  {["Giảng viên", "Enrollment", "Lý do", "Trạng thái", "Ghi chú duyệt", "Thao tác"].map((header) => (
                    <th key={header} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-sm text-slate-500">Không có yêu cầu nào</td>
                  </tr>
                ) : filtered.map((item) => {
                  const pending = item.status === "PENDING";
                  return (
                    <tr key={item.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-slate-800">{item.lecturerName || "N/A"}</p>
                        <p className="text-xs text-slate-500">{item.lecturerCode || "N/A"}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">#{item.enrollmentId}</td>
                      <td className="px-4 py-3 text-sm text-slate-700" style={{ maxWidth: 320 }}>{item.reason || "Không có lý do"}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-lg text-xs font-bold" style={statusStyle(item.status)}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {pending ? (
                          <input
                            value={notes[item.id] || ""}
                            onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))}
                            placeholder="Ghi chú cho giảng viên"
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                        ) : (
                          <span className="text-sm text-slate-600">{item.reviewerNote || "—"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {pending ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => decide(item.id, true)}
                              disabled={processingId === item.id}
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-60"
                              style={{ backgroundColor: "#047857" }}
                            >
                              <CheckCircle2 size={13} /> Duyệt
                            </button>
                            <button
                              onClick={() => decide(item.id, false)}
                              disabled={processingId === item.id}
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-60"
                              style={{ backgroundColor: "#dc2626" }}
                            >
                              <XCircle size={13} /> Từ chối
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">Đã xử lý</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function statusStyle(status) {
  if (status === "APPROVED") return { color: "#047857", backgroundColor: "#d1fae5" };
  if (status === "REJECTED") return { color: "#dc2626", backgroundColor: "#fee2e2" };
  return { color: "#b45309", backgroundColor: "#fef3c7" };
}

export default GradeUnlockRequests;

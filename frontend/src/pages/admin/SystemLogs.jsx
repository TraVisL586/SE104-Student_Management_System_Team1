import React, { useEffect, useState } from "react";
import { Search, Activity, AlertTriangle, Info, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import adminAuditLogService from "../../services/adminAuditLogService";

const LEVEL_CONFIG = {
  info:    { label: "INFO",    icon: Info,          bg: "#eff6ff", color: "#2563eb",  border: "#bfdbfe" },
  success: { label: "SUCCESS", icon: CheckCircle2,  bg: "#f0fdf4", color: "#10b981",  border: "#bbf7d0" },
  warning: { label: "WARNING", icon: AlertTriangle, bg: "#fffbeb", color: "#f59e0b",  border: "#fde68a" },
  error:   { label: "ERROR",   icon: XCircle,       bg: "#fef2f2", color: "#ef4444",  border: "#fecaca" },
};

const inferLevel = (log) => {
  const text = `${log.action || ""} ${log.details || ""}`.toLowerCase();
  if (text.includes("error") || text.includes("lỗi") || text.includes("failed")) return "error";
  if (text.includes("warning") || text.includes("cảnh báo")) return "warning";
  if (text.includes("create") || text.includes("tạo") || text.includes("update") || text.includes("cập nhật") || text.includes("xóa")) return "success";
  return "info";
};

const formatTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN");
};

export function SystemLogs() {
  const [search,   setSearch]   = useState("");
  const [level,    setLevel]    = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await adminAuditLogService.getAuditLogs();
      setLogs(Array.isArray(data) ? data.map((log) => ({
        id: log.id,
        time: formatTime(log.createdAt),
        level: inferLevel(log),
        actor: log.actorUsername || "System",
        action: log.action || "Hoạt động hệ thống",
        detail: log.details || `${log.targetType || "Target"} #${log.targetId || "—"}`,
      })) : []);
    } catch (error) {
      showToast("error", "Lỗi", error.message || "Không thể tải nhật ký hệ thống");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter((l) => {
    const matchS = l.action.toLowerCase().includes(search.toLowerCase()) || l.actor.toLowerCase().includes(search.toLowerCase());
    const matchL = level === "all" || l.level === level;
    return matchS && matchL;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 style={{ color: "#1e293b" }}>Nhật ký Hệ thống</h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 2 }}>
          Theo dõi toàn bộ hoạt động và sự kiện trong hệ thống
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(LEVEL_CONFIG).map(([key, cfg]) => {
          const count = logs.filter((l) => l.level === key).length;
          const Icon = cfg.icon;
          return (
            <button
              key={key}
              onClick={() => setLevel(level === key ? "all" : key)}
              className="rounded-xl p-3 text-left"
              style={{ backgroundColor: level === key ? cfg.bg : "#fff", border: `1px solid ${level === key ? cfg.color : "#e2e8f0"}`, cursor: "pointer" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} color={cfg.color} />
                <span style={{ fontSize: "0.65rem", fontWeight: 700, color: cfg.color, textTransform: "uppercase" }}>{cfg.label}</span>
              </div>
              <p style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1e293b" }}>{count}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
        <div className="flex items-center justify-between px-5 py-4 flex-wrap gap-3" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b" }}>
            <Activity size={16} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
            Nhật ký hệ thống ({filtered.length})
          </p>
          <div style={{ position: "relative" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input
              placeholder="Tìm hoạt động, người dùng…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "0.82rem", outline: "none", width: 220 }}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : (
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#f8fafc" }}>
              {["Thời gian", "Mức độ", "Người thực hiện", "Hoạt động", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3" style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => {
              const cfg  = LEVEL_CONFIG[log.level];
              const Icon = cfg.icon;
              const isExp = expanded === log.id;
              return (
                <React.Fragment key={log.id}>
                  <tr
                    style={{ borderTop: "1px solid #f1f5f9", cursor: "pointer" }}
                    onClick={() => setExpanded(isExp ? null : log.id)}
                  >
                    <td className="px-4 py-3" style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "#64748b", whiteSpace: "nowrap" }}>{log.time}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 w-fit px-2 py-1 rounded-lg" style={{ backgroundColor: cfg.bg, color: cfg.color, fontSize: "0.65rem", fontWeight: 700 }}>
                        <Icon size={11} /> {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: "0.78rem", color: "#475569" }}>{log.actor}</td>
                    <td className="px-4 py-3" style={{ fontSize: "0.85rem", color: "#1e293b", fontWeight: 500 }}>{log.action}</td>
                    <td className="px-4 py-3" style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{isExp ? "▲" : "▼"}</td>
                  </tr>
                  {isExp && (
                    <tr style={{ backgroundColor: cfg.bg }}>
                      <td colSpan={5} className="px-4 py-3">
                        <p style={{ fontSize: "0.78rem", color: "#334155" }}>
                          <strong>Chi tiết:</strong> {log.detail}
                        </p>
                        <p style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: 4 }}>Log ID: {log.id}</p>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}

export default SystemLogs;

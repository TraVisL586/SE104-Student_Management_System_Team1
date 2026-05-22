import { useState, useEffect } from "react";
import { Loader2, Bell, Check, Info } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { useRole } from "../../context/RoleContext";
import studentService from "../../services/studentService";

export function Notifications() {
  const { user } = useRole();
  const role = user?.role || "PUBLIC";
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterUnread, setFilterUnread] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, [filterUnread, role]);

  const fetchNotifications = async () => {
    if (role !== "STUDENT") {
      setNotifications([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await studentService.getMyNotifications(filterUnread ? true : undefined);
      setNotifications(data);
    } catch (error) {
      showToast("error", "Lỗi", "Không thể tải thông báo");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await studentService.markNotificationAsRead(id);
      fetchNotifications();
    } catch (error) {
      showToast("error", "Lỗi", "Không thể đánh dấu đã đọc");
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: "#1e293b" }}>Thông báo</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 2 }}>
            Tin tức và cập nhật từ hệ thống
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={filterUnread}
              onChange={(e) => setFilterUnread(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-700">Chỉ hiển thị chưa đọc</span>
          </label>
        </div>
      </div>

      <div className="rounded-2xl" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
        {notifications.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-500 text-sm">Không có thông báo nào</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => handleMarkAsRead(notif.id, notif.read)}
                className={`flex gap-4 p-5 transition-colors cursor-pointer hover:bg-slate-50 ${!notif.read ? 'bg-blue-50/50' : ''}`}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: notif.read ? "#f1f5f9" : "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Bell size={18} color={notif.read ? "#64748b" : "#2563eb"} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-4">
                    <p style={{ fontWeight: notif.read ? 500 : 700, fontSize: "0.95rem", color: "#1e293b" }}>
                      {notif.title}
                    </p>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap" }}>
                      {new Date(notif.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: notif.read ? "#64748b" : "#334155", marginTop: 4, lineHeight: 1.5 }}>
                    {notif.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;

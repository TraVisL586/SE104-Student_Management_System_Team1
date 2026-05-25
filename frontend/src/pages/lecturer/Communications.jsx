import { useState, useEffect } from "react";
import { MessageSquare, Send, Users, Bell, Loader2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import lecturerService from "../../services/lecturerService";

export function Communications() {
  const [classes, setClasses] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });
  const { showToast } = useToast();

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedSection) {
      fetchAnnouncements(selectedSection);
    }
  }, [selectedSection]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const ttData = await lecturerService.getMyTimetable();
      const uniqueClasses = [];
      const seen = new Set();
      ttData.forEach(item => {
        if (!seen.has(item.courseSectionId)) {
          seen.add(item.courseSectionId);
          uniqueClasses.push({
            id: item.courseSectionId,
            code: item.courseSectionCode || item.courseCode,
            name: item.courseName,
            semesterCode: item.semesterCode,
          });
        }
      });
      setClasses(uniqueClasses);
      if (uniqueClasses.length > 0) {
        setSelectedSection(uniqueClasses[0].id);
      }
    } catch (error) {
      showToast("error", "Lỗi", "Không thể tải danh sách lớp");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async (sectionId) => {
    try {
      setLoadingHistory(true);
      const data = await lecturerService.getAnnouncements(sectionId);
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (error) {
      setAnnouncements([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      showToast("warning", "Thiếu thông tin", "Vui lòng điền đầy đủ Tiêu đề và Nội dung.");
      return;
    }
    if (!selectedSection) {
      showToast("warning", "Chưa chọn lớp", "Vui lòng chọn lớp học phần.");
      return;
    }

    try {
      setSubmitting(true);
      await lecturerService.createAnnouncement(selectedSection, {
        title: form.title,
        content: form.content,
      });
      const cls = classes.find(c => c.id === selectedSection);
      showToast("success", "Đã gửi thông báo!", `Gửi tới: ${cls?.code} · ${form.title}`);
      setForm({ title: "", content: "" });
      fetchAnnouncements(selectedSection);
    } catch (error) {
      showToast("error", "Lỗi", error.message || "Không thể gửi thông báo");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 style={{ color: "#1e293b" }}>Thông báo & Liên lạc</h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 2 }}>
          Gửi thông báo và liên lạc với sinh viên trong lớp học phần
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-purple-600" size={32} />
        </div>
      ) : classes.length === 0 ? (
        <div className="p-4 bg-white rounded-xl border text-slate-500 text-sm">
          Bạn chưa được phân công lớp nào.
        </div>
      ) : (
        <>
          {/* Class selector */}
          <div>
            <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Chọn lớp học phần</p>
            <div className="flex gap-2 flex-wrap">
              {classes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedSection(c.id)}
                  style={{
                    padding: "7px 14px", borderRadius: 10, fontSize: "0.8rem",
                    backgroundColor: selectedSection === c.id ? "#4c1d95" : "#fff",
                    color: selectedSection === c.id ? "#fff" : "#334155",
                    border: `1px solid ${selectedSection === c.id ? "#4c1d95" : "#e2e8f0"}`,
                    cursor: "pointer",
                  }}
                >
                  {c.code} — {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Compose */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
              <div className="flex items-center gap-2 mb-5">
                <MessageSquare size={18} color="#8b5cf6" />
                <p style={{ fontWeight: 700, fontSize: "1rem", color: "#1e293b" }}>Soạn thông báo mới</p>
              </div>
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>
                    Gửi tới
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border text-sm text-slate-600">
                    <Users size={14} />
                    {classes.find(c => c.id === selectedSection)?.code} — {classes.find(c => c.id === selectedSection)?.name}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>
                    Tiêu đề <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Nhập tiêu đề thông báo…"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "0.85rem", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>
                    Nội dung <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <textarea
                    rows={5}
                    value={form.content}
                    onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                    placeholder="Nội dung thông báo…"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "0.85rem", outline: "none", resize: "vertical" }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl disabled:opacity-50"
                  style={{ backgroundColor: "#4c1d95", color: "white", border: "none", cursor: "pointer", fontSize: "0.88rem", fontWeight: 600 }}
                >
                  {submitting ? <Loader2 className="animate-spin" size={15} /> : <Send size={15} />} Gửi thông báo
                </button>
              </form>
            </div>

            {/* History */}
            <div className="rounded-2xl" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
              <div className="px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
                <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b" }}>Lịch sử gửi</p>
              </div>
              {loadingHistory ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-purple-600" size={24} />
                </div>
              ) : announcements.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-slate-500">
                  Chưa có thông báo nào cho lớp này
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "#f1f5f9" }}>
                  {announcements.map((h, i) => (
                    <div key={h.id || i} className="flex items-start gap-3 px-5 py-4">
                      <div style={{
                        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                        backgroundColor: "#ede9fe",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Bell size={15} color="#8b5cf6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }} className="truncate">{h.title}</p>
                        <p style={{ fontSize: "0.72rem", color: "#64748b", marginTop: 2 }}>{h.content?.substring(0, 100)}{h.content?.length > 100 ? "…" : ""}</p>
                        <p style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: 4 }}>
                          {h.createdAt ? new Date(h.createdAt).toLocaleDateString("vi-VN") : "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Communications;
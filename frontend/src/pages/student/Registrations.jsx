import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, BookOpen, Plus, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import courseRegistrationService from "../../services/courseRegistrationService";

const MAX_TC = 24;
const SEARCH_DEBOUNCE_MS = 400;
const ACTIVE_STATUSES = new Set(["ENROLLED", "WAITLISTED"]);

export function Registrations() {
  const [searchParams] = useSearchParams();
  const searchParam = searchParams.get("search") || "";
  const [search, setSearch] = useState(searchParam);
  const initialSearchRef = useRef(searchParam);
  const [cart, setCart] = useState([]);
  const [khoa, setKhoa] = useState("Tất cả");
  const [openSections, setOpenSections] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSections, setLoadingSections] = useState(false);
  const [sectionError, setSectionError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(15);
  const { showToast } = useToast();
  const initializedRef = useRef(false);

  const KHOAS = ["Tất cả"];

  const cartTC = useMemo(() => cart.reduce((s, c) => s + (c.credits || 0), 0), [cart]);

  const activeRegistrations = useMemo(
    () => registrations.filter((r) => ACTIVE_STATUSES.has(r.status)),
    [registrations],
  );

  const activeSemesterId = useMemo(
    () => cart[0]?.semesterId || openSections[0]?.semesterId || activeRegistrations[0]?.semesterId || null,
    [activeRegistrations, cart, openSections],
  );

  const enrolledTC = useMemo(
    () =>
      activeRegistrations
        .filter((r) => !activeSemesterId || r.semesterId === activeSemesterId)
        .reduce((s, r) => s + (r.credits || 0), 0),
    [activeRegistrations, activeSemesterId],
  );

  const totalTC = enrolledTC + cartTC;

  const registeredCourseIds = useMemo(
    () => new Set(activeRegistrations.map((r) => r.courseId)),
    [activeRegistrations],
  );

  const registeredSectionIds = useMemo(
    () => new Set(activeRegistrations.map((r) => r.courseSectionId)),
    [activeRegistrations],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return openSections.filter((section) => {
      const isEnrolled = registeredCourseIds.has(section.courseId) || registeredSectionIds.has(section.id);
      if (isEnrolled) return false;
      const matchesKeyword =
        !term ||
        section.courseName?.toLowerCase().includes(term) ||
        section.courseCode?.toLowerCase().includes(term) ||
        section.code?.toLowerCase().includes(term);
      const matchesKhoa = khoa === "Tất cả";
      return matchesKeyword && matchesKhoa;
    });
  }, [openSections, search, khoa, registeredCourseIds, registeredSectionIds]);

  const semesterLabel = useMemo(() => {
    const found = openSections.find((s) => s.semesterId === activeSemesterId) || openSections[0];
    if (found?.semesterName && found?.semesterCode) return `${found.semesterName} — ${found.semesterCode}`;
    if (found?.semesterName) return found.semesterName;
    if (found?.semesterCode) return found.semesterCode;
    return "Các học kỳ đang mở";
  }, [activeSemesterId, openSections]);

  const loadRegistrations = useCallback(async () => {
    try {
      const data = await courseRegistrationService.getMyRegistrations();
      setRegistrations(Array.isArray(data) ? data : []);
    } catch (err) {
      setRegistrations([]);
      const message = err?.data?.message || err?.message || "Không thể tải danh sách đăng ký.";
      showToast("error", "Không thể tải đăng ký", message);
    }
  }, [showToast]);

  const loadSections = useCallback(async (keyword = "") => {
    setLoadingSections(true);
    setSectionError("");
    try {
      const data = await courseRegistrationService.getOpenSections({
        keyword: keyword.trim() || undefined,
      });
      setOpenSections(Array.isArray(data) ? data : []);
    } catch (err) {
      setOpenSections([]);
      const message = err?.data?.message || err?.message || "Không thể tải lớp học phần.";
      setSectionError(message);
    } finally {
      setLoadingSections(false);
    }
  }, []);

  useEffect(() => {
    setSearch(searchParam);
    setVisibleCount(15);
  }, [searchParam, khoa]);

  useEffect(() => {
    let active = true;
    const init = async () => {
      setLoading(true);
      await Promise.all([loadRegistrations(), loadSections(initialSearchRef.current)]);
      if (active) setLoading(false);
    };
    init();
    return () => {
      active = false;
    };
  }, [loadRegistrations, loadSections]);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }
    const handle = setTimeout(() => {
      loadSections(search);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [search, loadSections]);

  function getAvailableSeats(section) {
    if (Number.isFinite(section.availableSeats)) return section.availableSeats;
    const capacity = section.capacity || 0;
    const enrolled = section.enrolledCount || 0;
    return Math.max(0, capacity - enrolled);
  }

  function addToCart(section) {
    if (registeredCourseIds.has(section.courseId) || registeredSectionIds.has(section.id)) {
      showToast("warning", "Đã đăng ký", `Bạn đã đăng ký môn ${section.courseName} rồi.`);
      return;
    }
    if (cart.some((c) => c.courseId === section.courseId)) {
      showToast("warning", "Đã chọn", `${section.courseName} đã được chọn trước đó.`);
      return;
    }
    if (cart.length > 0 && cart[0].semesterId && section.semesterId && cart[0].semesterId !== section.semesterId) {
      showToast("warning", "Khác học kỳ", "Vui lòng xác nhận đăng ký từng học kỳ riêng.");
      return;
    }
    if (totalTC + (section.credits || 0) > MAX_TC) {
      showToast(
        "error",
        "Vượt giới hạn tín chỉ (BR-2)",
        `Đăng ký thêm ${section.credits || 0} TC sẽ vượt mức tối đa ${MAX_TC} TC trong học kỳ.`,
      );
      return;
    }
    if (getAvailableSeats(section) <= 0) {
      showToast("error", "Lớp đã đầy", `${section.courseName} không còn chỗ trống.`);
      return;
    }
    setCart((prev) => [...prev, section]);
    showToast("success", "Đã thêm môn học", `${section.courseName} (${section.credits || 0} TC)`);
  }

  function removeFromCart(sectionId) {
    setCart((prev) => prev.filter((c) => c.id !== sectionId));
  }

  async function submitRegistration() {
    if (cart.length === 0) {
      showToast("warning", "Danh mục đăng ký trống", "Vui lòng chọn ít nhất một môn học.");
      return;
    }

    setSubmitting(true);
    for (const section of cart) {
      try {
        await courseRegistrationService.registerSection(section.id);
      } catch (err) {
        const message = err?.data?.message || err?.message || "Đăng ký thất bại.";
        showToast("error", "Đăng ký thất bại", `${section.courseName}: ${message}`);
        await Promise.all([loadRegistrations(), loadSections(search)]);
        setSubmitting(false);
        return;
      }
    }

    showToast("success", "Đăng ký thành công!", `Đã đăng ký ${cart.length} môn học (${cartTC} TC).`);
    setCart([]);
    await Promise.all([loadRegistrations(), loadSections(search)]);
    setSubmitting(false);
  }

  const showLoading = loading || loadingSections;

  return (
    <div className="space-y-5">
      <div>
        <h1 style={{ color: "#1e293b" }}>Đăng ký Môn học</h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 2 }}>
          {semesterLabel} · Đã đăng ký: {enrolledTC} TC · Tối đa: {MAX_TC} TC (BR-2)
        </p>
      </div>

      {/* Credit meter */}
      <div className="rounded-2xl p-4" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
        <div className="flex items-center justify-between mb-2">
          <p style={{ fontSize: "0.82rem", color: "#334155", fontWeight: 600 }}>
            Tín chỉ học kỳ: <span style={{ color: totalTC > MAX_TC ? "#ef4444" : "#2563eb" }}>{totalTC}</span> / {MAX_TC}
          </p>
          <span style={{ fontSize: "0.72rem", color: totalTC > 20 ? "#f59e0b" : "#10b981", fontWeight: 600 }}>
            {totalTC > MAX_TC ? "⚠ Vượt giới hạn!" : `Còn ${MAX_TC - totalTC} TC`}
          </span>
        </div>
        <div style={{ height: 8, backgroundColor: "#e2e8f0", borderRadius: 9999, overflow: "hidden" }}>
          <div style={{
            width: `${Math.min((totalTC / MAX_TC) * 100, 100)}%`,
            height: "100%",
            backgroundColor: totalTC > MAX_TC ? "#ef4444" : totalTC > 20 ? "#f59e0b" : "#2563eb",
            borderRadius: 9999, transition: "width 0.3s",
          }} />
        </div>
        <div className="flex justify-between mt-1">
          <p style={{ fontSize: "0.65rem", color: "#94a3b8" }}>Đang học: {enrolledTC} TC</p>
          <p style={{ fontSize: "0.65rem", color: "#94a3b8" }}>Giỏ: +{cartTC} TC</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Course catalog */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap gap-3">
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                placeholder="Tìm mã hoặc tên môn học…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9, borderRadius: 12, border: "1px solid #e2e8f0", fontSize: "0.82rem", outline: "none" }}
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {KHOAS.map((k) => (
                <button
                  key={k}
                  onClick={() => setKhoa(k)}
                  style={{
                    padding: "6px 12px", borderRadius: 9999, fontSize: "0.75rem",
                    backgroundColor: khoa === k ? "#1a3461" : "#f1f5f9",
                    color: khoa === k ? "#fff" : "#475569",
                    border: "none", cursor: "pointer", fontWeight: khoa === k ? 600 : 400,
                  }}
                >
                  {k}
                </button>
              ))}
            </div>
            {loadingSections && (
              <span style={{ fontSize: "0.72rem", color: "#94a3b8", alignSelf: "center" }}>Đang tải...</span>
            )}
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
            <table className="w-full" style={{ backgroundColor: "#fff" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  {["Mã MH", "Tên môn học", "TC", "Lịch học", "Giảng viên", "Chỗ trống", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3" style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sectionError && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center" style={{ fontSize: "0.8rem", color: "#ef4444" }}>
                      {sectionError}
                      <div style={{ marginTop: 8 }}>
                        <button
                          onClick={() => loadSections(search)}
                          style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "0.75rem" }}
                        >
                          Thử lại
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                {!sectionError && showLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center" style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                )}
                {!sectionError && !showLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center" style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                      Không có lớp học phần đang mở.
                    </td>
                  </tr>
                )}
                {filtered.slice(0, visibleCount).map((section) => {
                  const inCartCourse = cart.some((x) => x.courseId === section.courseId);
                  const seatsLeft = getAvailableSeats(section);
                  const full = seatsLeft <= 0;
                  return (
                    <tr key={section.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <td className="px-4 py-3" style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#2563eb", fontWeight: 600 }}>
                        {section.courseCode || section.code}
                      </td>
                      <td className="px-4 py-3">
                        <p style={{ fontSize: "0.82rem", color: "#1e293b", fontWeight: 500 }}>{section.courseName}</p>
                        {section.code && (
                          <p style={{ fontSize: "0.68rem", color: "#94a3b8" }}>Lớp: {section.code}</p>
                        )}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: "0.78rem", color: "#475569" }}>{section.credits}</td>
                      <td className="px-4 py-3" style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {section.schedules && section.schedules.length > 0 ? (
                          <div className="space-y-1">
                            {section.schedules.map((s, idx) => (
                              <div key={idx} style={{ whiteSpace: "nowrap" }}>
                                {s.dayOfWeek === 8 ? "CN" : `T${s.dayOfWeek}`}: {s.startTime.substring(0, 5)} - {s.endTime.substring(0, 5)}
                                <br />
                                <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>Phòng: {s.roomCode}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          "Chưa xếp lịch"
                        )}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: "0.75rem", color: "#64748b" }}>{section.lecturerName || "Chưa có"}</td>
                      <td className="px-4 py-3">
                        <span style={{ fontSize: "0.72rem", color: full ? "#ef4444" : "#10b981", fontWeight: 600 }}>
                          {full ? "Hết chỗ" : `${seatsLeft} chỗ`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {inCartCourse ? (
                          <span style={{ fontSize: "0.7rem", color: "#8b5cf6", fontWeight: 600 }}>✓ Trong giỏ</span>
                        ) : (
                          <button
                            onClick={() => addToCart(section)}
                            disabled={full || submitting}
                            style={{
                              display: "flex", alignItems: "center", gap: 4,
                              padding: "4px 10px", borderRadius: 8,
                              backgroundColor: full || submitting ? "#f1f5f9" : "#dbeafe",
                              color: full || submitting ? "#94a3b8" : "#2563eb",
                              border: "none", cursor: full || submitting ? "not-allowed" : "pointer",
                              fontSize: "0.75rem", fontWeight: 600,
                            }}
                          >
                            <Plus size={12} /> Thêm
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {visibleCount < filtered.length && (
                  <tr>
                    <td colSpan={7} className="px-4 py-4 text-center">
                      <button
                        onClick={() => setVisibleCount((prev) => prev + 15)}
                        className="px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        Hiển thị thêm {Math.min(15, filtered.length - visibleCount)} môn
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar: Cart & Registered Courses */}
        <div 
          className="space-y-5"
          style={{ 
            alignSelf: "start", 
            position: "sticky", 
            top: "24px",
            maxHeight: "calc(100vh - 48px)",
            overflowY: "auto",
            paddingRight: "8px"
          }}
        >
          {/* Cart */}
          <div className="rounded-2xl shadow-sm" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b" }}>Giỏ Đăng ký</p>
              <p style={{ fontSize: "0.72rem", color: "#64748b" }}>{cart.length} môn · {cartTC} TC</p>
            </div>
            {cart.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <BookOpen size={28} color="#cbd5e1" style={{ margin: "0 auto 8px" }} />
                <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Chưa chọn môn học nào</p>
              </div>
            ) : (
              <div>
                {cart.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <div>
                      <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1e293b" }}>{c.courseName}</p>
                      <p style={{ fontSize: "0.7rem", color: "#64748b" }}>{c.courseCode || c.code} · {c.credits} TC</p>
                      {c.schedules && c.schedules.length > 0 && (
                        <p style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 2 }}>
                          {c.schedules.map(s => `${s.dayOfWeek === 8 ? 'CN' : 'T' + s.dayOfWeek} (${s.startTime.substring(0,5)}-${s.endTime.substring(0,5)})`).join(', ')}
                        </p>
                      )}
                    </div>
                    <button onClick={() => removeFromCart(c.id)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                      <Trash2 size={14} color="#ef4444" />
                    </button>
                  </div>
                ))}
                <div className="px-4 py-4">
                  {totalTC > MAX_TC && (
                    <div className="flex items-center gap-2 p-3 rounded-xl mb-3" style={{ backgroundColor: "#fef2f2" }}>
                      <AlertTriangle size={14} color="#ef4444" />
                      <p style={{ fontSize: "0.75rem", color: "#991b1b" }}>Vượt giới hạn {MAX_TC} TC!</p>
                    </div>
                  )}
                  <button
                    onClick={submitRegistration}
                    disabled={totalTC > MAX_TC || submitting || cart.length === 0}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl"
                    style={{
                      backgroundColor: totalTC > MAX_TC || submitting || cart.length === 0 ? "#e2e8f0" : "#1a3461",
                      color: totalTC > MAX_TC || submitting || cart.length === 0 ? "#94a3b8" : "white",
                      border: "none", cursor: totalTC > MAX_TC || submitting || cart.length === 0 ? "not-allowed" : "pointer",
                      fontSize: "0.85rem", fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={16} />
                    {submitting ? "Đang đăng ký..." : "Xác nhận Đăng ký"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Registered Courses */}
          <div className="rounded-2xl shadow-sm" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b" }}>Đã đăng ký</p>
              <p style={{ fontSize: "0.72rem", color: "#10b981", fontWeight: 600 }}>{activeRegistrations.length} môn · {enrolledTC} TC</p>
            </div>
            {activeRegistrations.length === 0 ? (
              <div style={{ padding: "24px 20px", textAlign: "center" }}>
                <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Bạn chưa đăng ký môn nào.</p>
              </div>
            ) : (
              <div>
                {activeRegistrations.map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-4 py-2" style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                      <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#1e293b" }}>{r.courseName}</p>
                      <p style={{ fontSize: "0.68rem", color: "#64748b", marginTop: 1 }}>
                        {r.courseCode} · Lớp: {r.courseSectionCode || r.sectionCode} · {r.credits} TC
                      </p>
                    </div>
                    <div style={{ fontSize: "0.68rem", color: r.status === "WAITLISTED" ? "#f59e0b" : "#10b981", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {r.status === "WAITLISTED" ? "Đang chờ" : "Thành công"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Registrations;

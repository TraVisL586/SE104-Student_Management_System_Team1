import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronDown, ChevronRight, FolderOpen, Link2, Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import adminCatalogService from "../../services/adminCatalogService";

const degreeLabel = (value) => value || "Chưa phân loại";

export function CurriculumMgmt() {
  const [programs, setPrograms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [expanded, setExpanded] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [prerequisiteId, setPrerequisiteId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [programData, courseData] = await Promise.all([
        adminCatalogService.getPrograms(),
        adminCatalogService.getCourses(),
      ]);
      const safePrograms = Array.isArray(programData) ? programData : [];
      const safeCourses = Array.isArray(courseData) ? courseData : [];
      setPrograms(safePrograms);
      setCourses(safeCourses);
      setSelectedProgramId((current) => current || String(safePrograms[0]?.id || ""));
    } catch (error) {
      showToast("error", "Lỗi", error.message || "Không thể tải dữ liệu chương trình");
    } finally {
      setLoading(false);
    }
  };

  const selectedProgram = programs.find((p) => String(p.id) === String(selectedProgramId));

  const programCourses = useMemo(() => {
    if (!selectedProgram) return [];
    return courses.filter((course) => course.departmentId === selectedProgram.departmentId);
  }, [courses, selectedProgram]);

  const groupedCourses = useMemo(() => {
    const groups = new Map();
    programCourses.forEach((course) => {
      const key = `${course.departmentCode || "KHOA"} - ${course.departmentName || "Chưa có khoa"}`;
      const list = groups.get(key) || [];
      list.push(course);
      groups.set(key, list);
    });
    return Array.from(groups.entries());
  }, [programCourses]);

  const openCourse = (course) => {
    setSelectedCourse(course);
    setPrerequisiteId("");
  };

  const addPrerequisite = async (event) => {
    event.preventDefault();
    if (!selectedCourse || !prerequisiteId) return;
    try {
      setSubmitting(true);
      await adminCatalogService.addCoursePrerequisite(selectedCourse.id, Number(prerequisiteId));
      showToast("success", "Thành công", "Đã thêm môn tiên quyết");
      await fetchData();
      setSelectedCourse(null);
    } catch (error) {
      showToast("error", "Lỗi", error.message || "Không thể thêm môn tiên quyết");
    } finally {
      setSubmitting(false);
    }
  };

  const removePrerequisite = async (courseId, prerequisiteCourseId) => {
    try {
      setSubmitting(true);
      await adminCatalogService.removeCoursePrerequisite(courseId, prerequisiteCourseId);
      showToast("success", "Thành công", "Đã xóa môn tiên quyết");
      await fetchData();
    } catch (error) {
      showToast("error", "Lỗi", error.message || "Không thể xóa môn tiên quyết");
    } finally {
      setSubmitting(false);
    }
  };

  function toggleGroup(group) {
    setExpanded((current) =>
      current.includes(group) ? current.filter((item) => item !== group) : [...current, group]
    );
  }

  useEffect(() => {
    if (groupedCourses.length && expanded.length === 0) {
      setExpanded([groupedCourses[0][0]]);
    }
  }, [expanded.length, groupedCourses]);

  return (
    <div className="space-y-5">
      <div>
        <h1 style={{ color: "#1e293b" }}>Quản lý Chương trình Đào tạo</h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 2 }}>
          Dữ liệu chương trình, môn học và môn tiên quyết từ backend
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-emerald-600" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          <div className="rounded-2xl" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
            <div className="px-4 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
              <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1e293b" }}>Chương trình ĐT</p>
            </div>
            <div className="p-2">
              {programs.map((program) => (
                <button
                  key={program.id}
                  onClick={() => setSelectedProgramId(String(program.id))}
                  className="w-full flex items-start gap-2.5 px-3 py-3 rounded-xl text-left"
                  style={{
                    backgroundColor: String(selectedProgramId) === String(program.id) ? "#f0fdf4" : "transparent",
                    border: `1px solid ${String(selectedProgramId) === String(program.id) ? "#10b981" : "transparent"}`,
                    cursor: "pointer",
                    marginBottom: 2,
                  }}
                >
                  <FolderOpen size={16} color={String(selectedProgramId) === String(program.id) ? "#10b981" : "#94a3b8"} style={{ marginTop: 1, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#334155" }}>{program.name}</p>
                    <p style={{ fontSize: "0.68rem", color: "#94a3b8" }}>{program.code} · {program.departmentName || "—"}</p>
                    <span style={{ fontSize: "0.62rem", fontWeight: 600, padding: "1px 7px", borderRadius: 9999, marginTop: 3, display: "inline-block", backgroundColor: "#d1fae5", color: "#10b981" }}>
                      {degreeLabel(program.degreeLevel)}
                    </span>
                  </div>
                </button>
              ))}
              {programs.length === 0 && <p className="text-sm text-slate-500 p-3">Chưa có chương trình đào tạo.</p>}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-3">
            {selectedProgram ? (
              <>
                <div className="rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
                  <div>
                    <h2 style={{ color: "#1e293b" }}>{selectedProgram.name}</h2>
                    <p style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 2 }}>
                      {selectedProgram.departmentName || "Chưa có khoa"} · {selectedProgram.durationYears || "—"} năm · {programCourses.length} môn thuộc khoa
                    </p>
                  </div>
                </div>

                {groupedCourses.length === 0 ? (
                  <div className="rounded-2xl p-10 text-center" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
                    <BookOpen size={32} color="#cbd5e1" style={{ margin: "0 auto 10px" }} />
                    <p style={{ color: "#94a3b8", fontSize: "0.88rem" }}>Chưa có môn học nào thuộc khoa của chương trình này.</p>
                  </div>
                ) : (
                  groupedCourses.map(([group, groupCourses]) => {
                    const isOpen = expanded.includes(group);
                    return (
                      <div key={group} className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
                        <button
                          onClick={() => toggleGroup(group)}
                          className="w-full flex items-center justify-between px-5 py-4"
                          style={{ background: "none", border: "none", cursor: "pointer" }}
                        >
                          <div className="flex items-center gap-3">
                            {isOpen ? <ChevronDown size={16} color="#10b981" /> : <ChevronRight size={16} color="#94a3b8" />}
                            <p style={{ fontWeight: 700, fontSize: "0.92rem", color: "#1e293b" }}>{group}</p>
                            <span style={{ fontSize: "0.72rem", color: "#64748b" }}>{groupCourses.length} môn</span>
                          </div>
                        </button>

                        {isOpen && (
                          <div className="overflow-x-auto" style={{ borderTop: "1px solid #f1f5f9" }}>
                            <table className="w-full">
                              <thead>
                                <tr style={{ backgroundColor: "#f8fafc" }}>
                                  {["Mã MH", "Tên môn học", "Tín chỉ", "Tiên quyết", ""].map((h) => (
                                    <th key={h} className="text-left px-4 py-2.5" style={{ fontSize: "0.62rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {groupCourses.map((course) => (
                                  <tr key={course.id} style={{ borderTop: "1px solid #f8fafc" }}>
                                    <td className="px-4 py-2.5" style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#10b981", fontWeight: 600 }}>{course.code}</td>
                                    <td className="px-4 py-2.5" style={{ fontSize: "0.82rem", color: "#1e293b" }}>{course.name}</td>
                                    <td className="px-4 py-2.5" style={{ fontSize: "0.82rem", color: "#475569", fontWeight: 600 }}>{course.credits}</td>
                                    <td className="px-4 py-2.5">
                                      <div className="flex flex-wrap gap-1.5">
                                        {(course.prerequisites || []).length === 0 ? (
                                          <span className="text-xs text-slate-400">Không có</span>
                                        ) : (
                                          course.prerequisites.map((pre) => (
                                            <button
                                              key={pre.id}
                                              onClick={() => removePrerequisite(course.id, pre.id)}
                                              disabled={submitting}
                                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700"
                                              title="Xóa môn tiên quyết"
                                            >
                                              {pre.code} <Trash2 size={11} />
                                            </button>
                                          ))
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-2.5">
                                      <button onClick={() => openCourse(course)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700">
                                        <Plus size={12} /> Tiên quyết
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </>
            ) : (
              <div className="rounded-2xl p-10 text-center" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
                <p style={{ color: "#94a3b8", fontSize: "0.88rem" }}>Chọn một chương trình để xem chi tiết.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedCourse && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 24, maxWidth: 460, width: "100%" }}>
            <div className="flex items-center gap-2 mb-4">
              <Link2 size={17} color="#059669" />
              <h2 className="text-lg font-bold">Thêm môn tiên quyết</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">{selectedCourse.code} - {selectedCourse.name}</p>
            <form onSubmit={addPrerequisite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Môn tiên quyết *</label>
                <select required value={prerequisiteId} onChange={(e) => setPrerequisiteId(e.target.value)} className="w-full p-2 border rounded-lg text-sm">
                  <option value="">Chọn môn học</option>
                  {courses
                    .filter((course) => course.id !== selectedCourse.id && !(selectedCourse.prerequisites || []).some((pre) => pre.id === course.id))
                    .map((course) => <option key={course.id} value={course.id}>{course.code} - {course.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button type="button" onClick={() => setSelectedCourse(null)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CurriculumMgmt;

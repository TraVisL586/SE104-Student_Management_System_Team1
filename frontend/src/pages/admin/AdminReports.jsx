import { useCallback, useEffect, useState } from "react";
import { BarChart3, Download, Loader2, PieChart as PieIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useToast } from "../../context/ToastContext";
import adminReportService from "../../services/adminReportService";
import adminSchedulingService from "../../services/adminSchedulingService";

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

function saveArrayBuffer(buffer, filename) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState("");
  const [semesters, setSemesters] = useState([]);
  const [semesterId, setSemesterId] = useState("");
  const [fillRates, setFillRates] = useState([]);
  const [gradeProgress, setGradeProgress] = useState([]);
  const [studentStatus, setStudentStatus] = useState([]);
  const [tuitionSummary, setTuitionSummary] = useState([]);
  const [gradeStatus, setGradeStatus] = useState([]);
  const { showToast } = useToast();

  const loadSemesters = useCallback(async () => {
    try {
      const data = await adminSchedulingService.getSemesters();
      setSemesters(Array.isArray(data) ? data : []);
    } catch {
      setSemesters([]);
    }
  }, []);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const selectedSemester = semesterId || undefined;
      const [fill, grade, status, tuition, gradeState] = await Promise.all([
        adminReportService.getClassFillRates(selectedSemester),
        adminReportService.getGradeProgress(selectedSemester),
        adminReportService.getStudentStatusSummary(),
        adminReportService.getTuitionSummary(selectedSemester),
        adminReportService.getGradeStatusSummary(),
      ]);
      setFillRates(Array.isArray(fill) ? fill : []);
      setGradeProgress(Array.isArray(grade) ? grade : []);
      setStudentStatus(Array.isArray(status) ? status : []);
      setTuitionSummary(Array.isArray(tuition) ? tuition : []);
      setGradeStatus(Array.isArray(gradeState) ? gradeState : []);
    } catch (error) {
      showToast("error", "Lỗi", error.message || "Không thể tải báo cáo");
    } finally {
      setLoading(false);
    }
  }, [semesterId, showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSemesters();
  }, [loadSemesters]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadReports();
  }, [loadReports]);

  async function exportXlsx(type) {
    try {
      setExporting(type);
      const workbook = await buildWorkbook(type, {
        fillRates,
        gradeProgress,
        studentStatus,
        tuitionSummary,
        gradeStatus,
      });
      const buffer = await workbook.xlsx.writeBuffer();
      saveArrayBuffer(buffer, `${type}-report.xlsx`);
      showToast("success", "Đã export", "File XLSX đã được tạo");
    } catch (error) {
      showToast("error", "Lỗi export", error.message || "Không thể export XLSX");
    } finally {
      setExporting("");
    }
  }

  const fillChart = fillRates.slice(0, 10).map((item) => ({
    code: item.courseSectionCode || item.code,
    enrolled: item.enrolledCount || 0,
    capacity: item.capacity || 0,
    fillRate: Number(item.fillRatePercent || 0),
  }));

  const gradeChart = gradeProgress.slice(0, 10).map((item) => ({
    code: item.courseSectionCode || item.code,
    published: item.publishedGrades || 0,
    draft: item.draftGrades || 0,
    missing: item.missingGrades || 0,
  }));

  const studentPie = studentStatus
    .map((item) => ({ name: item.status, value: item.studentCount || item.count || 0 }))
    .filter((item) => item.value > 0);

  const gradePie = gradeStatus
    .map((item) => ({ name: item.status, value: item.gradeCount || item.count || 0 }))
    .filter((item) => item.value > 0);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 style={{ color: "#1e293b" }}>Báo cáo & Thống kê</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 2 }}>
            Theo dõi tỷ lệ lấp đầy lớp, tiến độ nhập điểm, trạng thái sinh viên và công nợ
          </p>
        </div>
        <select
          value={semesterId}
          onChange={(event) => setSemesterId(event.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-white"
        >
          <option value="">Tất cả học kỳ</option>
          {semesters.map((semester) => (
            <option key={semester.id} value={semester.id}>
              {semester.code} - {semester.name}
            </option>
          ))}
        </select>
      </div>

      <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ReportCard title="Tỷ lệ lấp đầy lớp học phần" onExport={() => exportXlsx("class-fill-rates")} busy={exporting === "class-fill-rates"}>
              {loading ? <InlineLoading /> : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={fillChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="code" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="enrolled" name="Đã đăng ký" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="capacity" name="Sức chứa" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ReportCard>

            <ReportCard title="Tiến độ nhập điểm" onExport={() => exportXlsx("grade-progress")} busy={exporting === "grade-progress"}>
              {loading ? <InlineLoading /> : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={gradeChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="code" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="published" name="Đã publish" stackId="grade" fill="#2563eb" />
                    <Bar dataKey="draft" name="Nháp" stackId="grade" fill="#f59e0b" />
                    <Bar dataKey="missing" name="Chưa nhập" stackId="grade" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ReportCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <PieCard title="Trạng thái sinh viên" data={studentPie} loading={loading} />
            <PieCard title="Trạng thái điểm" data={gradePie} loading={loading} />
            <ReportCard title="Tổng hợp công nợ" onExport={() => exportXlsx("tuition-summary")} busy={exporting === "tuition-summary"}>
              {loading ? <InlineLoading /> : (
                <div className="space-y-2">
                  {tuitionSummary.map((item) => (
                    <div key={item.status} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{item.status}</p>
                        <p className="text-xs text-slate-500">{item.recordCount || 0} khoản học phí</p>
                      </div>
                      <p className="text-sm font-bold text-slate-900">
                        {Number(item.outstandingAmount || 0).toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ReportCard>
          </div>
      </>
    </div>
  );
}

function ReportCard({ title, children, onExport, busy }) {
  return (
    <section className="rounded-2xl p-5" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} color="#10b981" />
          <p className="font-bold text-slate-800">{title}</p>
        </div>
        {onExport && (
          <button
            onClick={onExport}
            disabled={busy}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: "#047857" }}
          >
            {busy ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
            XLSX
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function PieCard({ title, data, loading }) {
  return (
    <section className="rounded-2xl p-5" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
      <div className="flex items-center gap-2 mb-4">
        <PieIcon size={16} color="#2563eb" />
        <p className="font-bold text-slate-800">{title}</p>
      </div>
      {loading ? (
        <InlineLoading />
      ) : data.length ? (
        <ResponsiveContainer width="100%" height={230}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2}>
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: "0.72rem" }} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-slate-500 text-center py-16">Chưa có dữ liệu</p>
      )}
    </section>
  );
}

function InlineLoading() {
  return (
    <div className="flex items-center justify-center py-16 text-slate-500">
      <Loader2 className="animate-spin mr-2" size={18} />
      <span className="text-sm">Đang tải dữ liệu...</span>
    </div>
  );
}

async function buildWorkbook(type, data) {
  const ExcelJSModule = await import("exceljs");
  const ExcelJS = ExcelJSModule.default || ExcelJSModule;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SE104 Student Management System";
  workbook.created = new Date();

  if (type === "class-fill-rates") {
    addSheet(workbook, "Fill Rates", [
      { header: "Mã lớp", key: "courseSectionCode", width: 16 },
      { header: "Mã môn", key: "courseCode", width: 14 },
      { header: "Tên môn", key: "courseName", width: 34 },
      { header: "Giảng viên", key: "lecturerName", width: 26 },
      { header: "Học kỳ", key: "semesterCode", width: 14 },
      { header: "Sức chứa", key: "capacity", width: 12, numFmt: "0" },
      { header: "Đã đăng ký", key: "enrolledCount", width: 14, numFmt: "0" },
      { header: "Còn trống", key: "availableSeats", width: 12, numFmt: "0" },
      { header: "Tỷ lệ lấp đầy", key: "fillRatePercent", width: 16, numFmt: "0.00" },
    ], data.fillRates);
  }

  if (type === "grade-progress") {
    addSheet(workbook, "Grade Progress", [
      { header: "Mã lớp", key: "courseSectionCode", width: 16 },
      { header: "Mã môn", key: "courseCode", width: 14 },
      { header: "Tên môn", key: "courseName", width: 34 },
      { header: "Giảng viên", key: "lecturerName", width: 26 },
      { header: "Học kỳ", key: "semesterCode", width: 14 },
      { header: "Tổng SV", key: "totalStudents", width: 12, numFmt: "0" },
      { header: "Nháp", key: "draftGrades", width: 12, numFmt: "0" },
      { header: "Đã publish", key: "publishedGrades", width: 14, numFmt: "0" },
      { header: "Chưa nhập", key: "missingGrades", width: 14, numFmt: "0" },
      { header: "Tỷ lệ publish", key: "publishRatePercent", width: 16, numFmt: "0.00" },
    ], data.gradeProgress);
  }

  if (type === "tuition-summary") {
    addSheet(workbook, "Tuition Summary", [
      { header: "Trạng thái", key: "status", width: 16 },
      { header: "Số khoản", key: "recordCount", width: 12, numFmt: "0" },
      { header: "Tổng tiền", key: "totalAmount", width: 18, numFmt: "#,##0" },
      { header: "Đã đóng", key: "paidAmount", width: 18, numFmt: "#,##0" },
      { header: "Còn nợ", key: "outstandingAmount", width: 18, numFmt: "#,##0" },
    ], data.tuitionSummary);
  }

  return workbook;
}

function addSheet(workbook, name, columns, rows) {
  const worksheet = workbook.addWorksheet(name, {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  worksheet.columns = columns;
  worksheet.addRows(rows.map((row) => ({ ...row })));

  const header = worksheet.getRow(1);
  header.height = 22;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF047857" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin", color: { argb: "FFE2E8F0" } },
      bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      left: { style: "thin", color: { argb: "FFE2E8F0" } },
      right: { style: "thin", color: { argb: "FFE2E8F0" } },
    };
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFF1F5F9" } },
      };
    });
  });

  columns.forEach((column, index) => {
    if (column.numFmt) {
      worksheet.getColumn(index + 1).numFmt = column.numFmt;
    }
  });

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };
}

export default AdminReports;

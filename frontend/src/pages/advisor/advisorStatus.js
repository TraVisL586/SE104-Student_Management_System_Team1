export const ACADEMIC_STATUS = {
  STUDYING: { label: "Đang học", color: "#10b981", bg: "#d1fae5", tone: "normal" },
  ON_LEAVE: { label: "Tạm nghỉ", color: "#f59e0b", bg: "#fef3c7", tone: "watch" },
  SUSPENDED: { label: "Đình chỉ", color: "#dc2626", bg: "#fee2e2", tone: "risk" },
  GRADUATED: { label: "Đã tốt nghiệp", color: "#2563eb", bg: "#dbeafe", tone: "normal" },
};

export function getAcademicStatusConfig(status) {
  return ACADEMIC_STATUS[status] || {
    label: status || "Không rõ",
    color: "#64748b",
    bg: "#f1f5f9",
    tone: "unknown",
  };
}

export function getStudentDisplayName(student) {
  return student?.fullName || student?.studentName || "Sinh viên";
}

export function isAtRiskStatus(status) {
  return status === "ON_LEAVE" || status === "SUSPENDED";
}

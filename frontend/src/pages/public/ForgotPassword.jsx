import { Link } from "react-router-dom";
import { ArrowLeft, GraduationCap, Info } from "lucide-react";

function ForgotPassword() {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1a3461 60%, #1e3a8a 100%)" }}
    >
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div className="mb-8 text-center">
          <div style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(37,99,235,0.4)" }}>
            <GraduationCap size={30} color="white" />
          </div>
          <h1 style={{ color: "white", fontSize: "1.5rem", fontWeight: 800 }}>EduPortal</h1>
          <p style={{ color: "#93c5fd", fontSize: "0.85rem", marginTop: 4 }}>Hệ thống Quản lý Sinh viên</p>
        </div>

        <div style={{ backgroundColor: "#fff", borderRadius: 24, padding: 32, boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
          <h2 style={{ color: "#1e293b", fontSize: "1.2rem", fontWeight: 700, marginBottom: 4 }}>
            Quên mật khẩu
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.82rem", marginBottom: 24 }}>
            Hệ thống hiện chưa hỗ trợ đặt lại mật khẩu trực tuyến.
          </p>

          <div className="flex items-start gap-3 rounded-xl p-4" style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
            <Info size={18} color="#2563eb" style={{ marginTop: 2, flexShrink: 0 }} />
            <p style={{ color: "#1e40af", fontSize: "0.88rem", lineHeight: 1.6 }}>
              Vui lòng liên hệ phòng công tác sinh viên để được giải quyết!
            </p>
          </div>

          <Link to="/login" className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-blue-700 hover:underline">
            <ArrowLeft size={14} /> Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;

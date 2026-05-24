import { useNavigate } from "react-router";
import { GraduationCap, Home, ArrowLeft } from "lucide-react";

export function NotFound() {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/", { replace: true });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1a3461 100%)" }}
    >
      <div className="text-center max-w-md">
        <div style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: "rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <GraduationCap size={32} color="#60a5fa" />
        </div>
        <h1 style={{ fontSize: "5rem", fontWeight: 900, color: "#60a5fa", lineHeight: 1, marginBottom: 8 }}>404</h1>
        <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "white", marginBottom: 8 }}>Trang không tồn tại</p>
        <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: 32, lineHeight: 1.6 }}>
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa. Vui lòng kiểm tra lại đường dẫn.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={goBack}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl"
            style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontSize: "0.88rem" }}
          >
            <ArrowLeft size={15} /> Quay lại
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl"
            style={{ backgroundColor: "#2563eb", color: "white", border: "none", cursor: "pointer", fontSize: "0.88rem", fontWeight: 600 }}
          >
            <Home size={15} /> Trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;

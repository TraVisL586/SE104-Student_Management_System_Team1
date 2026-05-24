import { useNavigate } from "react-router";
import { ShieldOff, Home, LogIn } from "lucide-react";

export function Unauthorized() {
  const navigate = useNavigate();
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #3b0764 0%, #4c1d95 100%)" }}
    >
      <div className="text-center max-w-md">
        <div style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: "rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <ShieldOff size={32} color="#f87171" />
        </div>
        <h1 style={{ fontSize: "5rem", fontWeight: 900, color: "#f87171", lineHeight: 1, marginBottom: 8 }}>403</h1>
        <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "white", marginBottom: 8 }}>Không có quyền truy cập</p>
        <p style={{ fontSize: "0.9rem", color: "#c4b5fd", marginBottom: 32, lineHeight: 1.6 }}>
          Bạn không có quyền truy cập vào trang này. Vui lòng đăng nhập với tài khoản có quyền hạn phù hợp.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl"
            style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontSize: "0.88rem" }}
          >
            <Home size={15} /> Trang chủ
          </button>
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl"
            style={{ backgroundColor: "#7c3aed", color: "white", border: "none", cursor: "pointer", fontSize: "0.88rem", fontWeight: 600 }}
          >
            <LogIn size={15} /> Đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
}

export default Unauthorized;

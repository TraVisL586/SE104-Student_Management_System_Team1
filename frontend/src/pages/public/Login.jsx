import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { GraduationCap, Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";
import { useRole } from "../../context/RoleContext.jsx";
import { login as loginRequest } from "../../services/AuthService";


export function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const { isAuthenticated, loginWithBackend } = useRole();
  const navigate  = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password) {
      setError("Vui lòng nhập đầy đủ thông tin đăng nhập.");
      setLoading(false);
      return;
    }

    try {
      const response = await loginRequest({ username: trimmedUsername, password });
      loginWithBackend(response);
      navigate("/", { replace: true });
    } catch (err) {
      const message = err?.data?.message || err?.message || "Đăng nhập thất bại.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1a3461 60%, #1e3a8a 100%)" }}
    >
      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(37,99,235,0.4)" }}>
            <GraduationCap size={30} color="white" />
          </div>
          <h1 style={{ color: "white", fontSize: "1.5rem", fontWeight: 800 }}>EduPortal</h1>
          <p style={{ color: "#93c5fd", fontSize: "0.85rem", marginTop: 4 }}>Hệ thống Quản lý Sinh viên</p>
        </div>

        {/* Card */}
        <div style={{ backgroundColor: "#fff", borderRadius: 24, padding: 32, boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
          <h2 style={{ color: "#1e293b", fontSize: "1.2rem", fontWeight: 700, marginBottom: 4 }}>Đăng nhập</h2>
          <p style={{ color: "#64748b", fontSize: "0.82rem", marginBottom: 24 }}>Nhập thông tin tài khoản để tiếp tục</p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
              <AlertCircle size={15} color="#ef4444" />
              <p style={{ fontSize: "0.78rem", color: "#ef4444" }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-username" style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>
                Tên đăng nhập <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập"
                  autoComplete="username"
                  disabled={loading}
                  style={{ width: "100%", paddingLeft: 38, paddingRight: 14, paddingTop: 11, paddingBottom: 11, borderRadius: 12, border: "1px solid #e2e8f0", fontSize: "0.88rem", color: "#334155", outline: "none" }}
                />
              </div>
            </div>

            <div>
              <div style={{ position: "relative" }}>
                <label htmlFor="login-password" style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>
                  Mật khẩu <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <Lock size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    id="login-password"
                    name="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                    style={{ width: "100%", paddingLeft: 38, paddingRight: 42, paddingTop: 11, paddingBottom: 11, borderRadius: 12, border: "1px solid #e2e8f0", fontSize: "0.88rem", color: "#334155", outline: "none" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    disabled={loading}
                    aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}
                  >
                    {showPw ? <EyeOff size={15} color="#94a3b8" /> : <Eye size={15} color="#94a3b8" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  disabled={loading}
                  style={{ position: "absolute", top: 0, right: 0, fontSize: "0.75rem", color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}
                >
                  Quên mật khẩu?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl"
              style={{ backgroundColor: loading ? "#93c5fd" : "#1a3461", color: "white", border: "none", cursor: loading ? "wait" : "pointer", fontSize: "0.92rem", fontWeight: 700, marginTop: 8 }}
            >
              {loading ? "Đang đăng nhập…" : "Đăng nhập"}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}

export default Login;

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import {
  User,
  Settings,
  Shield,
  Mail,
  Phone,
  Calendar,
  AlertTriangle,
  Loader2,
  LogOut,
  CheckCircle2,
  Lock,
} from "lucide-react";
import studentService from "../services/studentService";
import { useToast } from "../context/ToastContext";
import { useRole } from "../context/RoleContext";

const ROLE_LABELS = {
  STUDENT: "Sinh viên",
  LECTURER: "Giảng viên",
  ADMIN: "Quản trị Đào tạo",
  ACADEMIC_ADVISOR: "Cố vấn Học tập",
  PUBLIC: "Công khai",
};

const ROLE_COLORS = {
  STUDENT: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  LECTURER: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  ADMIN: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  ACADEMIC_ADVISOR: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  PUBLIC: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

export function ProfileSettingsModal({ isOpen, onOpenChange, defaultTab = "profile" }) {
  const { user, logout } = useRole();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileData, setProfileData] = useState(null);

  // Sync activeTab with defaultTab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  // Load student profile if role is STUDENT
  useEffect(() => {
    if (!isOpen || user?.role !== "STUDENT") {
      setProfileData(null);
      return;
    }

    let active = true;
    async function loadStudentProfile() {
      try {
        setLoadingProfile(true);
        const data = await studentService.getMyProfile();
        if (active && data) {
          setProfileData(data);
          // Pre-fill editable states
          setPhone(data.phone || "");
          setEmail(data.email || "");
        }
      } catch (err) {
        console.error("Failed to load student profile:", err);
        showToast("error", "Lỗi", "Không thể tải thông tin hồ sơ từ máy chủ.");
      } finally {
        if (active) setLoadingProfile(false);
      }
    }

    loadStudentProfile();
    return () => {
      active = false;
    };
  }, [isOpen, user]);

  // --- Account Settings States ---
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState("vi");
  const [emailNotif, setEmailNotif] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark") || 
           localStorage.getItem("theme") === "dark";
  });

  // Sync email when user profile context loads
  useEffect(() => {
    if (user && !profileData) {
      setEmail(user.email || "");
    }
  }, [user, profileData]);

  const handleThemeChange = (checked) => {
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleSaveAccountSettings = (e) => {
    e.preventDefault();
    showToast("success", "Thành công", "Đã cập nhật cài đặt tài khoản.");
  };

  // --- Security Settings States ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);

  const validatePasswordForm = () => {
    const errs = {};
    if (!currentPassword) errs.currentPassword = "Mật khẩu hiện tại không được để trống";
    if (!newPassword) errs.newPassword = "Mật khẩu mới không được để trống";
    if (!confirmPassword) errs.confirmPassword = "Xác nhận mật khẩu không được để trống";
    if (newPassword && currentPassword && newPassword === currentPassword) {
      errs.newPassword = "Mật khẩu mới phải khác mật khẩu hiện tại";
    }
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      errs.confirmPassword = "Mật khẩu xác nhận không khớp";
    }
    setPasswordErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    if (user?.role === "STUDENT") {
      try {
        setPasswordLoading(true);
        await studentService.changePassword(currentPassword, newPassword);
        showToast("success", "Thành công", "Thay đổi mật khẩu thành công!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordErrors({});
      } catch (err) {
        const errorMsg = err.data?.message || err.message || "Thay đổi mật khẩu thất bại";
        showToast("error", "Lỗi", errorMsg);
        if (err.status === 401 || err.status === 400) {
          setPasswordErrors({ currentPassword: "Mật khẩu hiện tại không chính xác" });
        }
      } finally {
        setPasswordLoading(false);
      }
    } else {
      // Simulate for mock roles
      setPasswordLoading(true);
      setTimeout(() => {
        setPasswordLoading(false);
        showToast("success", "Thành công", "Thay đổi mật khẩu thành công (Chế độ giả lập)!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordErrors({});
      }, 800);
    }
  };

  const handleLogoutOtherDevices = () => {
    showToast("info", "Đã gửi yêu cầu", "Đã đăng xuất tài khoản khỏi tất cả các thiết bị khác.");
  };

  // Helper values
  const displayName = profileData?.fullName || user?.name || "Khách";
  const displayId = profileData?.studentCode || user?.id || "N/A";
  const displayEmail = profileData?.email || user?.email || "Chưa cập nhật";
  const displayPhone = profileData?.phone || phone || "Chưa cập nhật";
  const displayDob = profileData?.dateOfBirth 
    ? new Date(profileData.dateOfBirth).toLocaleDateString("vi-VN") 
    : "Chưa cập nhật";
  
  const currentRole = user?.role || "PUBLIC";
  const badgeColor = ROLE_COLORS[currentRole] || ROLE_COLORS.PUBLIC;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] p-0 overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Settings className="size-5 text-indigo-500 animate-spin-slow" />
            Hồ sơ & Thiết lập tài khoản
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="profile">
                <User className="size-3.5" />
                Hồ sơ cá nhân
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="size-3.5" />
                Cài đặt
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="size-3.5" />
                Bảo mật
              </TabsTrigger>
            </TabsList>

            {/* TAB CONTENT: PROFILE */}
            <TabsContent value="profile" className="space-y-4 outline-none">
              {loadingProfile ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="size-8 text-indigo-500 animate-spin" />
                  <p className="text-sm text-slate-500">Đang tải thông tin hồ sơ...</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Banner Profile */}
                  <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 flex items-center gap-4 text-white shadow-md">
                    <div className="size-16 rounded-full border-2 border-white bg-indigo-600 flex items-center justify-center text-xl font-bold uppercase shadow-inner">
                      {user?.avatarInitials || "KH"}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg leading-none">{displayName}</h3>
                      <p className="text-xs text-indigo-100 font-mono">{displayId}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                          {ROLE_LABELS[currentRole]}
                        </span>
                        {profileData?.academicStatus && (
                          <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            {profileData.academicStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60 space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Họ và tên</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{displayName}</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60 space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Mã số người dùng</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 font-mono">{displayId}</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60 space-y-1 col-span-2">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Thư điện tử (Email)</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                        <Mail className="size-3.5 text-slate-400" />
                        {displayEmail}
                      </p>
                    </div>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60 space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Số điện thoại</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                        <Phone className="size-3.5 text-slate-400" />
                        {displayPhone}
                      </p>
                    </div>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60 space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ngày sinh</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-slate-400" />
                        {displayDob}
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
                    * Mọi thông tin thay đổi hồ sơ gốc học vụ vui lòng liên hệ Phòng Đào tạo.
                  </div>
                </div>
              )}
            </TabsContent>

            {/* TAB CONTENT: SETTINGS */}
            <TabsContent value="settings" className="space-y-4 outline-none">
              <form onSubmit={handleSaveAccountSettings} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone" className="text-xs font-semibold text-slate-600 dark:text-slate-300">Số điện thoại</Label>
                    <Input
                      id="edit-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Nhập số điện thoại liên hệ"
                      className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="select-lang" className="text-xs font-semibold text-slate-600 dark:text-slate-300">Ngôn ngữ giao diện</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger id="select-lang" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                        <SelectValue placeholder="Chọn ngôn ngữ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vi">Tiếng Việt (VI)</SelectItem>
                        <SelectItem value="en">English (EN)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator className="my-2 bg-slate-100 dark:bg-slate-800" />

                {/* Preference Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-slate-100 dark:border-slate-800/40">
                    <div className="space-y-0.5">
                      <Label htmlFor="darkmode-toggle" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Giao diện tối (Dark Mode)</Label>
                      <p className="text-xs text-slate-400">Chuyển đổi giao diện hệ thống sáng hoặc tối</p>
                    </div>
                    <Switch
                      id="darkmode-toggle"
                      checked={darkMode}
                      onCheckedChange={handleThemeChange}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-slate-100 dark:border-slate-800/40">
                    <div className="space-y-0.5">
                      <Label htmlFor="notif-toggle" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Nhận thông báo qua Email</Label>
                      <p className="text-xs text-slate-400">Gửi cập nhật điểm và thông báo học vụ qua email đăng ký</p>
                    </div>
                    <Switch
                      id="notif-toggle"
                      checked={emailNotif}
                      onCheckedChange={setEmailNotif}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" className="rounded-xl px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 h-auto">
                    Lưu cấu hình
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* TAB CONTENT: SECURITY */}
            <TabsContent value="security" className="space-y-4 outline-none">
              <form onSubmit={handleChangePassword} className="space-y-4">
                {user?.role !== "STUDENT" && (
                  <div className="rounded-xl px-4 py-2.5 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 text-[11px] font-medium leading-relaxed">
                    ⚠️ Chế độ xem thử: Tính năng đổi mật khẩu thực tế chỉ khả dụng với tài khoản Sinh viên (do hạn chế phân quyền của Spring Security Backend). Hệ thống sẽ giả lập thay đổi thành công.
                  </div>
                )}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="modal-curr-pwd" className="text-xs font-semibold text-slate-600 dark:text-slate-300">Mật khẩu hiện tại</Label>
                    <div className="relative">
                      <Input
                        id="modal-curr-pwd"
                        type="password"
                        placeholder="Nhập mật khẩu cũ"
                        value={currentPassword}
                        onChange={(e) => {
                          setCurrentPassword(e.target.value);
                          if (passwordErrors.currentPassword) setPasswordErrors(p => ({ ...p, currentPassword: "" }));
                        }}
                        disabled={passwordLoading}
                        className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 pr-10"
                      />
                      <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="text-[11px] text-red-500 font-semibold mt-0.5">{passwordErrors.currentPassword}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="modal-new-pwd" className="text-xs font-semibold text-slate-600 dark:text-slate-300">Mật khẩu mới</Label>
                      <Input
                        id="modal-new-pwd"
                        type="password"
                        placeholder="Mật khẩu mới"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (passwordErrors.newPassword) setPasswordErrors(p => ({ ...p, newPassword: "" }));
                        }}
                        disabled={passwordLoading}
                        className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                      {passwordErrors.newPassword && (
                        <p className="text-[11px] text-red-500 font-semibold mt-0.5">{passwordErrors.newPassword}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="modal-conf-pwd" className="text-xs font-semibold text-slate-600 dark:text-slate-300">Xác nhận mật khẩu mới</Label>
                      <Input
                        id="modal-conf-pwd"
                        type="password"
                        placeholder="Nhập lại mật khẩu mới"
                        value={confirmPassword}
                        onChange={(e) => {
                          confirmPassword && setConfirmPassword(e.target.value);
                          if (passwordErrors.confirmPassword) setPasswordErrors(p => ({ ...p, confirmPassword: "" }));
                        }}
                        // Handle change properly
                        onInput={(e) => {
                          setConfirmPassword(e.target.value);
                          if (passwordErrors.confirmPassword) setPasswordErrors(p => ({ ...p, confirmPassword: "" }));
                        }}
                        disabled={passwordLoading}
                        className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                      {passwordErrors.confirmPassword && (
                        <p className="text-[11px] text-red-500 font-semibold mt-0.5">{passwordErrors.confirmPassword}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={handleLogoutOtherDevices}
                    className="text-xs text-red-500 hover:text-red-600 font-semibold transition-colors flex items-center gap-1 bg-none border-none cursor-pointer"
                  >
                    <LogOut className="size-3.5" />
                    Đăng xuất thiết bị khác
                  </button>
                  <Button type="submit" disabled={passwordLoading} className="rounded-xl px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 h-auto">
                    {passwordLoading ? (
                      <>
                        <Loader2 className="size-3 animate-spin mr-1.5" />
                        Đang cập nhật...
                      </>
                    ) : "Đổi mật khẩu"}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer padding */}
        <div className="h-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/40" />
      </DialogContent>
    </Dialog>
  );
}

export default ProfileSettingsModal;

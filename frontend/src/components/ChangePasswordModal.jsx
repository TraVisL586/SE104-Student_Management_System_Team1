import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Shield, Lock, Loader2 } from 'lucide-react';
import studentService from '../services/studentService';
import { useToast } from '../context/ToastContext';

export function ChangePasswordModal({ trigger }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const { showToast } = useToast();

  const validateForm = () => {
    const newErrors = {};

    if (!currentPassword) {
      newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    }

    if (!newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
    }

    if (newPassword && currentPassword && newPassword === currentPassword) {
      newErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
    }

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await studentService.changePassword(currentPassword, newPassword);
      showToast('success', 'Thành công', 'Đã đổi mật khẩu');
      setOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
    } catch (err) {
      const errorMsg = err.message || 'Không thể đổi mật khẩu';
      showToast('error', 'Lỗi', errorMsg);
      if (err.status === 401) {
        setErrors({ currentPassword: 'Mật khẩu hiện tại không đúng' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="rounded-xl">
            Đổi mật khẩu
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-2xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="size-5 text-indigo-500" />
            Đổi mật khẩu
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm mt-1.5">
            Nhập mật khẩu hiện tại và mật khẩu mới.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current-password" className="text-xs font-semibold text-slate-600">Mật khẩu hiện tại</Label>
            <div className="relative">
              <Input
                id="current-password"
                type="password"
                placeholder="Nhập mật khẩu hiện tại"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (errors.currentPassword) {
                    setErrors({ ...errors, currentPassword: '' });
                  }
                }}
                disabled={loading}
                className="rounded-xl border-slate-200 bg-white text-slate-900 pr-10"
              />
              <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            </div>
            {errors.currentPassword && (
              <p className="text-[11px] text-red-500 font-semibold mt-0.5">{errors.currentPassword}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-xs font-semibold text-slate-600">Mật khẩu mới</Label>
            <div className="relative">
              <Input
                id="new-password"
                type="password"
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errors.newPassword) {
                    setErrors({ ...errors, newPassword: '' });
                  }
                }}
                disabled={loading}
                className="rounded-xl border-slate-200 bg-white text-slate-900 pr-10"
              />
              <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            </div>
            {errors.newPassword && (
              <p className="text-[11px] text-red-500 font-semibold mt-0.5">{errors.newPassword}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password" className="text-xs font-semibold text-slate-600">Xác nhận mật khẩu</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) {
                    setErrors({ ...errors, confirmPassword: '' });
                  }
                }}
                disabled={loading}
                className="rounded-xl border-slate-200 bg-white text-slate-900 pr-10"
              />
              <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            </div>
            {errors.confirmPassword && (
              <p className="text-[11px] text-red-500 font-semibold mt-0.5">{errors.confirmPassword}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="rounded-xl text-xs font-semibold"
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5">
              {loading ? (
                <>
                  <Loader2 className="size-3 animate-spin mr-1.5" />
                  Đang cập nhật...
                </>
              ) : 'Đổi mật khẩu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ChangePasswordModal;

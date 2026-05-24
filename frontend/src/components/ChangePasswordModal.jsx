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
          <Button variant="outline" size="sm">
            Đổi mật khẩu
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Đổi mật khẩu</DialogTitle>
          <DialogDescription>
            Nhập mật khẩu hiện tại và mật khẩu mới.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
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
            />
            {errors.currentPassword && (
              <p className="text-sm text-red-500">{errors.currentPassword}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">Mật khẩu mới</Label>
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
            />
            {errors.newPassword && (
              <p className="text-sm text-red-500">{errors.newPassword}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
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
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang đổi...' : 'Đổi mật khẩu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ChangePasswordModal;

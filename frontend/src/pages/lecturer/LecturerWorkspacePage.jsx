import FeatureLandingLayout from '../../shared/layouts/FeatureLandingLayout';

function LecturerWorkspacePage() {
  return (
    <FeatureLandingLayout
      title="Giảng viên"
      subtitle="Khu vực nhập điểm và vận hành lớp học"
      description="Dành cho các nghiệp vụ nhập điểm, điểm danh, gửi thông báo lớp và xem danh sách sinh viên trong lớp phụ trách."
      actions={[
        { label: 'Nhập điểm', to: '/lecturer/grades' },
        { label: 'Điểm danh', to: '/lecturer/attendance', variant: 'secondary' },
      ]}
      highlights={[
        { badge: 'UC-7', title: 'Nhập điểm', description: 'Nhập điểm giữa kỳ/cuối kỳ và chốt điểm theo quy tắc khóa sửa.' },
        { badge: 'UC-8', title: 'Điểm danh', description: 'Điểm danh theo ngày với danh sách có mặt/vắng mặt.' },
        { badge: 'UC-9', title: 'Trao đổi lớp học', description: 'Gửi thông báo tới sinh viên trong lớp qua email hoặc thời gian thực.' },
      ]}
    />
  );
}

export default LecturerWorkspacePage;

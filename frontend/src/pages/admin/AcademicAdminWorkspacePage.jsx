import FeatureLandingLayout from '../../shared/layouts/FeatureLandingLayout';

function AcademicAdminWorkspacePage() {
  return (
    <FeatureLandingLayout
      title="Quản trị học vụ"
      subtitle="Khu vực quản trị học vụ"
      description="Điểm vào cho các nghiệp vụ mở lớp, sắp xếp lịch học, quản lý chương trình đào tạo, công nợ, tài khoản và báo cáo thống kê."
      actions={[
        { label: 'Mở lớp học phần', to: '/admin/courses' },
        { label: 'Xem báo cáo', to: '/admin/reports', variant: 'secondary' },
      ]}
      highlights={[
        { badge: 'UC-10', title: 'Mở lớp học phần', description: 'Tạo lớp, kiểm tra trùng lịch và sức chứa trước khi công bố.' },
        { badge: 'UC-17', title: 'Tài khoản người dùng', description: 'Tạo tài khoản và gán vai trò cho sinh viên, giảng viên.' },
        { badge: 'UC-19', title: 'Báo cáo', description: 'Xem biểu đồ và xuất dữ liệu cho quản trị.' },
      ]}
    />
  );
}

export default AcademicAdminWorkspacePage;

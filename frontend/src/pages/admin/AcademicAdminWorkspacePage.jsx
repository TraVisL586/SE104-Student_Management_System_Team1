import FeatureLandingLayout from '../../shared/layouts/FeatureLandingLayout';

function AcademicAdminWorkspacePage() {
  return (
    <FeatureLandingLayout
      title="Academic Admin"
      subtitle="Khu vực quản trị học vụ"
      description="Điểm vào cho các nghiệp vụ mở lớp, sắp xếp lịch học, quản lý chương trình đào tạo, công nợ, tài khoản và báo cáo thống kê."
      actions={[
        { label: 'Mở lớp học phần', to: '/admin/courses' },
        { label: 'Xem báo cáo', to: '/admin/reports', variant: 'secondary' },
      ]}
      highlights={[
        { badge: 'UC-10', title: 'Open Course Sections', description: 'Tạo lớp, kiểm tra trùng lịch và sức chứa trước khi publish.' },
        { badge: 'UC-17', title: 'User Accounts', description: 'Tạo tài khoản và gán role cho sinh viên, giảng viên.' },
        { badge: 'UC-19', title: 'Reports', description: 'Xem biểu đồ và export dữ liệu cho quản trị.' },
      ]}
    />
  );
}

export default AcademicAdminWorkspacePage;

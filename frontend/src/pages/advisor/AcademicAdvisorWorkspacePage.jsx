import FeatureLandingLayout from '../../shared/layouts/FeatureLandingLayout';

function AcademicAdvisorWorkspacePage() {
  return (
    <FeatureLandingLayout
      title="Cố vấn học tập"
      subtitle="Khu vực cố vấn học tập"
      description="Xem hồ sơ sinh viên được quản lý, theo dõi thống kê học tập và xử lý các yêu cầu học vụ từ sinh viên."
      actions={[
        { label: 'Xem sinh viên', to: '/advisor/students' },
        { label: 'Xử lý yêu cầu', to: '/advisor/requests', variant: 'secondary' },
      ]}
      highlights={[
        { badge: 'UC-14', title: 'Xem hồ sơ sinh viên', description: 'Thống kê GPA, số tín chỉ đã đạt và các môn đang rớt.' },
        { badge: 'UC-15', title: 'Xử lý yêu cầu', description: 'Duyệt hoặc từ chối yêu cầu học vụ và gửi kết quả tự động.' },
      ]}
    />
  );
}

export default AcademicAdvisorWorkspacePage;

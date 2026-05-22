import apiClient from './apiClient';

export async function getMyProfile() {
  return apiClient.get('/api/student/me');
}

export async function changePassword(currentPassword, newPassword) {
  return apiClient.put('/api/student/change-password', {
    oldPassword: currentPassword,
    newPassword,
  });
}

export async function getMyGrades() {
  return apiClient.get('/api/student/grades');
}

export async function getMyTimetable() {
  return apiClient.get('/api/student/timetable');
}

export async function getMyAttendance(courseSectionId) {
  const query = courseSectionId ? `?courseSectionId=${courseSectionId}` : '';
  return apiClient.get(`/api/student/attendance${query}`);
}

export async function getMyNotifications(isRead) {
  const query = isRead !== undefined ? `?isRead=${isRead}` : '';
  return apiClient.get(`/api/student/notifications${query}`);
}

export async function markNotificationAsRead(notificationId) {
  return apiClient.patch(`/api/student/notifications/${notificationId}/read`);
}

export async function markAllNotificationsAsRead() {
  return apiClient.patch('/api/student/notifications/read-all');
}

export default {
  getMyProfile,
  changePassword,
  getMyGrades,
  getMyTimetable,
  getMyAttendance,
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};

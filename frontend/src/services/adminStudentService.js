import apiClient from './apiClient';

export async function getAllStudents() {
  return apiClient.get('/api/admin/students');
}

export async function createStudent(data) {
  return apiClient.post('/api/admin/students', data);
}

export async function updateStudent(id, data) {
  return apiClient.put(`/api/admin/students/${id}`, data);
}

export async function deleteStudent(id) {
  return apiClient.del(`/api/admin/students/${id}`);
}

export async function updateStudentStatus(id, academicStatus) {
  return apiClient.patch(`/api/admin/students/${id}/academic-status`, {
    academicStatus
  });
}

export async function getAdvisorAssignments() {
  return apiClient.get('/api/admin/advisor-students');
}

export async function assignAdvisor(studentId, advisorId) {
  return apiClient.post('/api/admin/advisor-students', {
    studentId,
    advisorId
  });
}

export async function unassignAdvisor(studentId, advisorId) {
  return apiClient.del(`/api/admin/advisors/${advisorId}/students/${studentId}`);
}

export default {
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  updateStudentStatus,
  getAdvisorAssignments,
  assignAdvisor,
  unassignAdvisor,
};

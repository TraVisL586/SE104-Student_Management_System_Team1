import apiClient from './apiClient';

// Departments
export async function getDepartments() {
  return apiClient.get('/api/admin/catalog/departments');
}

export async function createDepartment(data) {
  return apiClient.post('/api/admin/catalog/departments', data);
}

export async function updateDepartment(id, data) {
  return apiClient.put(`/api/admin/catalog/departments/${id}`, data);
}

export async function deleteDepartment(id) {
  return apiClient.del(`/api/admin/catalog/departments/${id}`);
}

// Programs
export async function getPrograms() {
  return apiClient.get('/api/admin/catalog/programs');
}

export async function createProgram(data) {
  return apiClient.post('/api/admin/catalog/programs', data);
}

export async function updateProgram(id, data) {
  return apiClient.put(`/api/admin/catalog/programs/${id}`, data);
}

export async function deleteProgram(id) {
  return apiClient.del(`/api/admin/catalog/programs/${id}`);
}

// Courses
export async function getCourses() {
  return apiClient.get('/api/admin/catalog/courses');
}

export async function createCourse(data) {
  return apiClient.post('/api/admin/catalog/courses', data);
}

export async function updateCourse(id, data) {
  return apiClient.put(`/api/admin/catalog/courses/${id}`, data);
}

export async function deleteCourse(id) {
  return apiClient.del(`/api/admin/catalog/courses/${id}`);
}

export async function getCoursePrerequisites(courseId) {
  return apiClient.get(`/api/admin/catalog/courses/${courseId}/prerequisites`);
}

export async function addCoursePrerequisite(courseId, prerequisiteCourseId) {
  return apiClient.post(`/api/admin/catalog/courses/${courseId}/prerequisites`, {
    prerequisiteCourseId,
  });
}

export async function removeCoursePrerequisite(courseId, prerequisiteId) {
  return apiClient.del(`/api/admin/catalog/courses/${courseId}/prerequisites/${prerequisiteId}`);
}

export default {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getCoursePrerequisites,
  addCoursePrerequisite,
  removeCoursePrerequisite,
};

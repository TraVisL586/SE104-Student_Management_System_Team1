import apiClient from './apiClient';

export async function getStudentStatusSummary() {
  return apiClient.get('/api/admin/reports/student-status-summary');
}

export async function getClassFillRates(semesterId) {
  const query = semesterId ? `?semesterId=${semesterId}` : '';
  return apiClient.get(`/api/admin/reports/class-fill-rates${query}`);
}

export async function exportClassFillRatesCsv(semesterId) {
  const query = semesterId ? `?semesterId=${semesterId}` : '';
  return apiClient.getBlob(`/api/admin/reports/class-fill-rates/export${query}`);
}

export async function getGradeProgress(semesterId) {
  const query = semesterId ? `?semesterId=${semesterId}` : '';
  return apiClient.get(`/api/admin/reports/grade-progress${query}`);
}

export async function exportGradeProgressCsv(semesterId) {
  const query = semesterId ? `?semesterId=${semesterId}` : '';
  return apiClient.getBlob(`/api/admin/reports/grade-progress/export${query}`);
}

export async function getTuitionSummary(semesterId) {
  const query = semesterId ? `?semesterId=${semesterId}` : '';
  return apiClient.get(`/api/admin/reports/tuition-summary${query}`);
}

export async function exportTuitionSummaryCsv(semesterId) {
  const query = semesterId ? `?semesterId=${semesterId}` : '';
  return apiClient.getBlob(`/api/admin/reports/tuition-summary/export${query}`);
}

export async function getGradeStatusSummary() {
  return apiClient.get('/api/admin/reports/grade-status-summary');
}

export default {
  getStudentStatusSummary,
  getClassFillRates,
  exportClassFillRatesCsv,
  getGradeProgress,
  exportGradeProgressCsv,
  getTuitionSummary,
  exportTuitionSummaryCsv,
  getGradeStatusSummary,
};

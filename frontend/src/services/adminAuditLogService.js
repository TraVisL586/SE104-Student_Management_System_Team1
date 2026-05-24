import apiClient from './apiClient';

export async function getAuditLogs() {
  return apiClient.get('/api/admin/audit-logs');
}

export default {
  getAuditLogs,
};

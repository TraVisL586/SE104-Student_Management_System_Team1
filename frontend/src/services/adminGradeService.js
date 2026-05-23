import apiClient from './apiClient';

export async function getGradeUnlockRequests(status) {
  const query = status ? `?status=${status}` : '';
  return apiClient.get(`/api/admin/grade-unlock-requests${query}`);
}

export async function decideGradeUnlockRequest(requestId, approved, reviewerNote) {
  return apiClient.patch(`/api/admin/grade-unlock-requests/${requestId}/decision`, {
    approved,
    reviewerNote,
  });
}

export default {
  getGradeUnlockRequests,
  decideGradeUnlockRequest,
};

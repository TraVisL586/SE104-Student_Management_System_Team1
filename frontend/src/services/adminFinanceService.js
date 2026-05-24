import apiClient from './apiClient';

export async function getTuitionRecords() {
  return apiClient.get('/api/admin/tuition-records');
}

export async function createTuitionRecord(data) {
  return apiClient.post('/api/admin/tuition-records', data);
}

export async function updateTuitionRecord(id, data) {
  return apiClient.put(`/api/admin/tuition-records/${id}`, data);
}

export async function addTuitionPayment(id, amount, note) {
  return apiClient.patch(`/api/admin/tuition-records/${id}/payments`, {
    amount,
    note,
  });
}

export async function deleteTuitionRecord(id) {
  return apiClient.del(`/api/admin/tuition-records/${id}`);
}

export async function getPayments() {
  return apiClient.get('/api/admin/payments');
}

export default {
  getTuitionRecords,
  createTuitionRecord,
  updateTuitionRecord,
  addTuitionPayment,
  deleteTuitionRecord,
  getPayments,
};

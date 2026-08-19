import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://sms-backend-r0tn.onrender.com',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function requestAdminOtp(email) {
  const { data } = await api.post('/admin/api/request-otp', { email });
  return data;
}

export async function verifyAdminOtp(session_id, code) {
  const { data } = await api.post('/admin/api/verify-otp', { session_id, code });
  return data;
}

export async function getStats() {
  const { data } = await api.get('/admin/api/_stats');
  return data;
}

export async function getSchools() {
  const { data } = await api.get('/admin/api/schools');
  return data;
}

export async function getSchoolDetails(schoolId, year) {
  const { data } = await api.get(`/admin/api/schools/${schoolId}/details`, { params: { year } });
  return data;
}

export async function setupSchool(body) {
  const { data } = await api.post('/admin/api/schools/setup', body);
  return data;
}

export async function deleteSchool(schoolId) {
  const { data } = await api.delete(`/admin/api/schools/${schoolId}`);
  return data;
}

export async function getRevenue() {
  const { data } = await api.get('/admin/api/revenue');
  return data;
}

export async function getRevenueBySalesRep() {
  const { data } = await api.get('/admin/api/revenue/sales-reps');
  return data;
}

export async function getPremiumRevenueByRep() {
  const { data } = await api.get('/admin/api/revenue/premium-by-sales-rep');
  return data;
}

export async function getSalesReps() {
  const { data } = await api.get('/admin/api/sales-reps');
  return data;
}

export async function getAppSettings() {
  const { data } = await api.get('/admin/api/settings');
  return data;
}

export async function updateAppSettings(settings) {
  const { data } = await api.post('/admin/api/settings', { settings });
  return data;
}

export async function getFees(schoolId) {
  const { data } = await api.get('/admin/api/fees', { params: { school_id: schoolId } });
  return data;
}

export async function createFee(body) {
  const { data } = await api.post('/admin/api/fees', body);
  return data;
}

export async function deleteFee(feeId) {
  const { data } = await api.delete(`/admin/api/fees/${feeId}`);
  return data;
}

export default api;
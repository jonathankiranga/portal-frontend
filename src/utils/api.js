import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://sms-backend-r0tn.onrender.com',
  timeout: 60000,
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
  const { data } = await api.post('/admin/api/schools/setup', body, { timeout: 120000 });
  return data;
}

export async function deleteSchool(schoolId) {
  const { data } = await api.delete(`/admin/api/schools/${schoolId}`);
  return data;
}

export async function getSchoolMpesa(schoolId) {
  const { data } = await api.get(`/admin/api/schools/${schoolId}/mpesa`, { timeout: 30000 });
  return data;
}

export async function updateSchoolMpesa(schoolId, body) {
  const { data } = await api.put(`/admin/api/schools/${schoolId}/mpesa`, body, { timeout: 30000 });
  return data;
}

export async function getRevenue(year) {
  const { data } = await api.get('/admin/api/revenue', { params: { year } });
  return data;
}

export async function getRevenueBySalesRep(year) {
  const { data } = await api.get('/admin/api/revenue/sales-reps', { params: { year } });
  return data;
}

export async function getPremiumRevenueByRep(year) {
  const { data } = await api.get('/admin/api/revenue/premium-by-sales-rep', { params: { year } });
  return data;
}

export async function getSalesReps() {
  const { data } = await api.get('/admin/api/sales-reps');
  return data;
}

export async function createSalesRep(body) {
  const { data } = await api.post('/admin/api/sales-reps', body, { timeout: 30000 });
  return data;
}

export async function updateSalesRep(repId, body) {
  const { data } = await api.put(`/admin/api/sales-reps/${repId}`, body, { timeout: 30000 });
  return data;
}

export async function deleteSalesRep(repId) {
  const { data } = await api.delete(`/admin/api/sales-reps/${repId}`);
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

// Classes
export async function addClass(schoolId, body) {
  const { data } = await api.post(`/admin/api/schools/${schoolId}/classes`, body, { timeout: 30000 });
  return data;
}

export async function updateClass(classId, body) {
  const { data } = await api.put(`/admin/api/classes/${classId}`, body, { timeout: 30000 });
  return data;
}

export async function deleteClass(classId) {
  const { data } = await api.delete(`/admin/api/classes/${classId}`, { timeout: 60000 });
  return data;
}

// Learning areas
export async function addLearningArea(schoolId, body) {
  const { data } = await api.post(`/admin/api/schools/${schoolId}/learning-areas`, body, { timeout: 30000 });
  return data;
}

export async function updateLearningArea(areaId, body) {
  const { data } = await api.put(`/admin/api/learning-areas/${areaId}`, body, { timeout: 30000 });
  return data;
}

export async function deleteLearningArea(areaId) {
  const { data } = await api.delete(`/admin/api/learning-areas/${areaId}`, { timeout: 30000 });
  return data;
}

// Sub-learning-areas
export async function addSubArea(body) {
  const { data } = await api.post('/admin/api/sub-learning-areas', body, { timeout: 30000 });
  return data;
}

export async function updateSubArea(subId, body) {
  const { data } = await api.put(`/admin/api/sub-learning-areas/${subId}`, body, { timeout: 30000 });
  return data;
}

export async function deleteSubArea(subId) {
  const { data } = await api.delete(`/admin/api/sub-learning-areas/${subId}`, { timeout: 30000 });
  return data;
}

// Teachers
export async function addTeacher(schoolId, body) {
  const { data } = await api.post(`/admin/api/teachers`, { ...body, school_id: schoolId }, { timeout: 30000 });
  return data;
}

export async function updateTeacher(teacherId, body) {
  const { data } = await api.put(`/admin/api/teachers/${teacherId}`, body, { timeout: 30000 });
  return data;
}

export async function deleteTeacher(teacherId) {
  const { data } = await api.delete(`/admin/api/teachers/${teacherId}`, { timeout: 30000 });
  return data;
}

export default api;
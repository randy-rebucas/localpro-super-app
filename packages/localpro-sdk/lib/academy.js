// Academy API module for LocalPro SDK
// Provides methods for interacting with the Academy endpoints

class AcademyAPI {
  constructor(client) {
    this.client = client;
  }

  // Courses
  getCourses(params) {
    return this.client.get('/academy/courses', { params });
  }
  getCourse(id) {
    return this.client.get(`/academy/courses/${id}`);
  }
  createCourse(data) {
    return this.client.post('/academy/courses', data);
  }
  updateCourse(id, data) {
    return this.client.put(`/academy/courses/${id}`, data);
  }
  patchCourse(id, data) {
    return this.client.patch(`/academy/courses/${id}`, data);
  }
  deleteCourse(id) {
    return this.client.delete(`/academy/courses/${id}`);
  }
  uploadCourseThumbnail(id, formData) {
    return this.client.post(`/academy/courses/${id}/thumbnail`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  }
  uploadCourseVideo(id, formData) {
    return this.client.post(`/academy/courses/${id}/videos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  }
  deleteCourseVideo(id, videoId) {
    return this.client.delete(`/academy/courses/${id}/videos/${videoId}`);
  }

  // Categories
  listCategories() {
    return this.client.get('/academy/categories');
  }
  createCategory(data) {
    return this.client.post('/academy/categories', data);
  }
  updateCategory(id, data) {
    return this.client.put(`/academy/categories/${id}`, data);
  }
  deleteCategory(id) {
    return this.client.delete(`/academy/categories/${id}`);
  }

  // Certifications
  listCertifications() {
    return this.client.get('/academy/certifications');
  }
  createCertification(data) {
    return this.client.post('/academy/certifications', data);
  }
  updateCertification(id, data) {
    return this.client.put(`/academy/certifications/${id}`, data);
  }
  deleteCertification(id) {
    return this.client.delete(`/academy/certifications/${id}`);
  }

  // Enrollments
  enrollInCourse(id) {
    return this.client.post(`/academy/courses/${id}/enroll`);
  }
  listEnrollments() {
    return this.client.get('/academy/enrollments');
  }
  updateEnrollmentStatus(id, data) {
    return this.client.put(`/academy/enrollments/${id}/status`, data);
  }
  deleteEnrollment(id) {
    return this.client.delete(`/academy/enrollments/${id}`);
  }

  // Progress
  updateCourseProgress(id, data) {
    return this.client.put(`/academy/courses/${id}/progress`, data);
  }

  // Reviews
  addCourseReview(id, data) {
    return this.client.post(`/academy/courses/${id}/reviews`, data);
  }

  // Favorites
  favoriteCourse(id) {
    return this.client.post(`/academy/courses/${id}/favorite`);
  }
  unfavoriteCourse(id) {
    return this.client.delete(`/academy/courses/${id}/favorite`);
  }
  getMyCourses() {
    return this.client.get('/academy/my-courses');
  }
  getMyCreatedCourses() {
    return this.client.get('/academy/my-created-courses');
  }
  getMyFavoriteCourses() {
    return this.client.get('/academy/my-favorite-courses');
  }

  // Featured & Statistics
  getFeaturedCourses() {
    return this.client.get('/academy/featured');
  }
  getCourseStatistics() {
    return this.client.get('/academy/statistics');
  }
}

module.exports = AcademyAPI;

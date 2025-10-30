# Academy Usage Examples

## Overview

This document provides practical examples of how to use the Academy API in various scenarios. These examples demonstrate common patterns and best practices for implementing course management, enrollment, and certification functionality in your application.

## Frontend Integration

### React Hook for Course Management

```javascript
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useAcademy = () => {
  const [courses, setCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getStoredToken = async () => {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  };

  // Get all courses with filtering
  const getCourses = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(`https://api.localpro.com/api/academy/courses?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      const data = await response.json();
      setCourses(data.data);
      setError(null);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get single course details
  const getCourse = useCallback(async (courseId) => {
    try {
      setLoading(true);
      const response = await fetch(`https://api.localpro.com/api/academy/courses/${courseId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch course');
      }
      
      const data = await response.json();
      setError(null);
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new course
  const createCourse = useCallback(async (courseData) => {
    try {
      setLoading(true);
      const token = await getStoredToken();
      
      const response = await fetch('https://api.localpro.com/api/academy/courses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(courseData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create course');
      }
      
      const data = await response.json();
      setError(null);
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Enroll in course
  const enrollInCourse = useCallback(async (courseId) => {
    try {
      setLoading(true);
      const token = await getStoredToken();
      
      const response = await fetch(`https://api.localpro.com/api/academy/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to enroll in course');
      }
      
      const data = await response.json();
      setError(null);
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update course progress
  const updateProgress = useCallback(async (courseId, progress, completedLessons) => {
    try {
      setLoading(true);
      const token = await getStoredToken();
      
      const response = await fetch(`https://api.localpro.com/api/academy/courses/${courseId}/progress`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ progress, completedLessons })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update progress');
      }
      
      const data = await response.json();
      setError(null);
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get my enrolled courses
  const getMyCourses = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const token = await getStoredToken();
      const queryParams = new URLSearchParams(filters);
      
      const response = await fetch(`https://api.localpro.com/api/academy/my-courses?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch my courses');
      }
      
      const data = await response.json();
      setMyCourses(data.data);
      setError(null);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add course review
  const addReview = useCallback(async (courseId, rating, comment) => {
    try {
      setLoading(true);
      const token = await getStoredToken();
      
      const response = await fetch(`https://api.localpro.com/api/academy/courses/${courseId}/reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating, comment })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add review');
      }
      
      const data = await response.json();
      setError(null);
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    courses,
    myCourses,
    loading,
    error,
    getCourses,
    getCourse,
    createCourse,
    enrollInCourse,
    updateProgress,
    getMyCourses,
    addReview
  };
};

export default useAcademy;
```

### Course Browser Component

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Picker } from 'react-native';
import useAcademy from '../hooks/useAcademy';

const CourseBrowser = () => {
  const { courses, loading, error, getCourses } = useAcademy();
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    level: '',
    page: 1,
    limit: 10
  });

  useEffect(() => {
    loadCourses();
  }, [filters]);

  const loadCourses = async () => {
    try {
      await getCourses(filters);
    } catch (err) {
      console.error('Failed to load courses:', err);
    }
  };

  const handleSearch = (text) => {
    setFilters(prev => ({ ...prev, search: text, page: 1 }));
  };

  const handleCategoryChange = (category) => {
    setFilters(prev => ({ ...prev, category, page: 1 }));
  };

  const handleLevelChange = (level) => {
    setFilters(prev => ({ ...prev, level, page: 1 }));
  };

  const renderCourse = ({ item }) => (
    <TouchableOpacity style={styles.courseCard}>
      <View style={styles.courseHeader}>
        <Text style={styles.courseTitle}>{item.title}</Text>
        <Text style={styles.courseCategory}>{item.category}</Text>
      </View>
      
      <Text style={styles.courseDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.courseInfo}>
        <Text style={styles.courseLevel}>{item.level}</Text>
        <Text style={styles.courseDuration}>{item.duration.hours}h</Text>
        <Text style={styles.coursePrice}>${item.pricing.regularPrice}</Text>
      </View>
      
      <View style={styles.courseFooter}>
        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>⭐ {item.rating.average}</Text>
          <Text style={styles.ratingCount}>({item.rating.count})</Text>
        </View>
        <Text style={styles.enrollmentCount}>
          {item.enrollment.current} enrolled
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading courses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Browse Courses</Text>
      
      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search courses..."
          value={filters.search}
          onChangeText={handleSearch}
        />
        
        <Picker
          selectedValue={filters.category}
          onValueChange={handleCategoryChange}
          style={styles.picker}
        >
          <Picker.Item label="All Categories" value="" />
          <Picker.Item label="Cleaning" value="cleaning" />
          <Picker.Item label="Plumbing" value="plumbing" />
          <Picker.Item label="Electrical" value="electrical" />
          <Picker.Item label="Business" value="business" />
        </Picker>
        
        <Picker
          selectedValue={filters.level}
          onValueChange={handleLevelChange}
          style={styles.picker}
        >
          <Picker.Item label="All Levels" value="" />
          <Picker.Item label="Beginner" value="beginner" />
          <Picker.Item label="Intermediate" value="intermediate" />
          <Picker.Item label="Advanced" value="advanced" />
          <Picker.Item label="Expert" value="expert" />
        </Picker>
      </View>

      {error && (
        <Text style={styles.errorText}>Error: {error}</Text>
      )}

      <FlatList
        data={courses}
        renderItem={renderCourse}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={loadCourses}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  filtersContainer: {
    marginBottom: 20
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: 'white'
  },
  picker: {
    height: 50,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10
  },
  courseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10
  },
  courseCategory: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: 'capitalize'
  },
  courseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20
  },
  courseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  courseLevel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize'
  },
  courseDuration: {
    fontSize: 12,
    color: '#666'
  },
  coursePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF'
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  rating: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 4
  },
  ratingCount: {
    fontSize: 12,
    color: '#666'
  },
  enrollmentCount: {
    fontSize: 12,
    color: '#666'
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20
  }
});

export default CourseBrowser;
```

### Course Detail Component

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import useAcademy from '../hooks/useAcademy';

const CourseDetail = ({ route, navigation }) => {
  const { courseId } = route.params;
  const { getCourse, enrollInCourse, updateProgress, addReview } = useAcademy();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      const courseData = await getCourse(courseId);
      setCourse(courseData);
      
      // Check if user is enrolled
      if (courseData.enrollment) {
        setEnrolled(true);
        setProgress(courseData.enrollment.progress || 0);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      await enrollInCourse(courseId);
      setEnrolled(true);
      Alert.alert('Success', 'Successfully enrolled in course!');
    } catch (err) {
      Alert.alert('Error', 'Failed to enroll in course');
    }
  };

  const handleProgressUpdate = async (lessonId) => {
    try {
      const newProgress = Math.min(100, progress + 10);
      await updateProgress(courseId, newProgress, [lessonId]);
      setProgress(newProgress);
      
      if (newProgress === 100) {
        Alert.alert('Congratulations!', 'You have completed the course!');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update progress');
    }
  };

  const handleAddReview = async () => {
    Alert.prompt(
      'Add Review',
      'Rate this course (1-5)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async (rating) => {
            try {
              const numRating = parseInt(rating);
              if (numRating >= 1 && numRating <= 5) {
                await addReview(courseId, numRating, 'Great course!');
                Alert.alert('Success', 'Review added successfully!');
              } else {
                Alert.alert('Error', 'Rating must be between 1 and 5');
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to add review');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading course details...</Text>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.container}>
        <Text>Course not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{course.title}</Text>
        <Text style={styles.category}>{course.category}</Text>
        <Text style={styles.level}>{course.level}</Text>
      </View>

      <Text style={styles.description}>{course.description}</Text>

      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Duration</Text>
          <Text style={styles.infoValue}>{course.duration.hours} hours</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Price</Text>
          <Text style={styles.infoValue}>${course.pricing.regularPrice}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Rating</Text>
          <Text style={styles.infoValue}>⭐ {course.rating.average} ({course.rating.count})</Text>
        </View>
      </View>

      {enrolled && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>Progress</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}% Complete</Text>
        </View>
      )}

      <View style={styles.curriculumContainer}>
        <Text style={styles.sectionTitle}>Curriculum</Text>
        {course.curriculum.map((module, moduleIndex) => (
          <View key={moduleIndex} style={styles.moduleContainer}>
            <Text style={styles.moduleTitle}>{module.module}</Text>
            {module.lessons.map((lesson, lessonIndex) => (
              <TouchableOpacity
                key={lessonIndex}
                style={styles.lessonItem}
                onPress={() => enrolled && handleProgressUpdate(`${moduleIndex}-${lessonIndex}`)}
              >
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <Text style={styles.lessonDuration}>{lesson.duration} min</Text>
                {lesson.isFree && (
                  <Text style={styles.freeLabel}>FREE</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.actionsContainer}>
        {!enrolled ? (
          <TouchableOpacity style={styles.enrollButton} onPress={handleEnroll}>
            <Text style={styles.enrollButtonText}>Enroll Now</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.reviewButton} onPress={handleAddReview}>
            <Text style={styles.reviewButtonText}>Add Review</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  header: {
    marginBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8
  },
  category: {
    fontSize: 14,
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
    textTransform: 'capitalize'
  },
  level: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize'
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    color: '#333'
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20
  },
  infoItem: {
    alignItems: 'center'
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  progressContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  },
  curriculumContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16
  },
  moduleContainer: {
    marginBottom: 16
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333'
  },
  lessonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 4
  },
  lessonTitle: {
    fontSize: 14,
    flex: 1,
    marginRight: 8
  },
  lessonDuration: {
    fontSize: 12,
    color: '#666',
    marginRight: 8
  },
  freeLabel: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: 'bold',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  actionsContainer: {
    marginBottom: 20
  },
  enrollButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  enrollButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  reviewButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  reviewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default CourseDetail;
```

## Backend Integration

### Academy Service Class

```javascript
class AcademyService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  // Course Management Methods
  async getCourses(filters = {}) {
    const response = await this.apiClient.get('/api/academy/courses', { params: filters });
    return response.data;
  }

  async getCourse(courseId) {
    const response = await this.apiClient.get(`/api/academy/courses/${courseId}`);
    return response.data;
  }

  async createCourse(courseData) {
    const response = await this.apiClient.post('/api/academy/courses', courseData);
    return response.data;
  }

  async updateCourse(courseId, courseData) {
    const response = await this.apiClient.put(`/api/academy/courses/${courseId}`, courseData);
    return response.data;
  }

  async deleteCourse(courseId) {
    const response = await this.apiClient.delete(`/api/academy/courses/${courseId}`);
    return response.data;
  }

  // Content Management Methods
  async uploadThumbnail(courseId, thumbnailFile) {
    const formData = new FormData();
    formData.append('thumbnail', thumbnailFile);
    
    const response = await this.apiClient.post(
      `/api/academy/courses/${courseId}/thumbnail`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  }

  async uploadVideo(courseId, videoFile, title, duration) {
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('title', title);
    formData.append('duration', duration);
    
    const response = await this.apiClient.post(
      `/api/academy/courses/${courseId}/videos`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  }

  async deleteVideo(courseId, videoId) {
    const response = await this.apiClient.delete(`/api/academy/courses/${courseId}/videos/${videoId}`);
    return response.data;
  }

  // Enrollment Methods
  async enrollInCourse(courseId) {
    const response = await this.apiClient.post(`/api/academy/courses/${courseId}/enroll`);
    return response.data;
  }

  async updateProgress(courseId, progress, completedLessons) {
    const response = await this.apiClient.put(`/api/academy/courses/${courseId}/progress`, {
      progress,
      completedLessons
    });
    return response.data;
  }

  // Review Methods
  async addReview(courseId, rating, comment) {
    const response = await this.apiClient.post(`/api/academy/courses/${courseId}/reviews`, {
      rating,
      comment
    });
    return response.data;
  }

  // User-specific Methods
  async getMyCourses(filters = {}) {
    const response = await this.apiClient.get('/api/academy/my-courses', { params: filters });
    return response.data;
  }

  async getMyCreatedCourses(filters = {}) {
    const response = await this.apiClient.get('/api/academy/my-created-courses', { params: filters });
    return response.data;
  }

  // Public Methods
  async getCategories() {
    const response = await this.apiClient.get('/api/academy/categories');
    return response.data;
  }

  async getFeaturedCourses(limit = 10) {
    const response = await this.apiClient.get('/api/academy/featured', { params: { limit } });
    return response.data;
  }

  // Admin Methods
  async getStatistics() {
    const response = await this.apiClient.get('/api/academy/statistics');
    return response.data;
  }
}

export default AcademyService;
```

### Academy Controller Implementation

```javascript
import AcademyService from '../services/AcademyService';
import { validationResult } from 'express-validator';

class AcademyController {
  constructor() {
    this.academyService = new AcademyService();
  }

  // Course Controllers
  async getCourses(req, res) {
    try {
      const filters = req.query;
      const result = await this.academyService.getCourses(filters);
      res.json(result);
    } catch (error) {
      console.error('Get courses error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get courses'
      });
    }
  }

  async getCourse(req, res) {
    try {
      const { id } = req.params;
      const result = await this.academyService.getCourse(id);
      res.json(result);
    } catch (error) {
      console.error('Get course error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get course'
      });
    }
  }

  async createCourse(req, res) {
    try {
      const courseData = req.body;
      
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const result = await this.academyService.createCourse(courseData);
      res.status(201).json(result);
    } catch (error) {
      console.error('Create course error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create course'
      });
    }
  }

  async updateCourse(req, res) {
    try {
      const { id } = req.params;
      const courseData = req.body;
      
      const result = await this.academyService.updateCourse(id, courseData);
      res.json(result);
    } catch (error) {
      console.error('Update course error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update course'
      });
    }
  }

  async deleteCourse(req, res) {
    try {
      const { id } = req.params;
      const result = await this.academyService.deleteCourse(id);
      res.json(result);
    } catch (error) {
      console.error('Delete course error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete course'
      });
    }
  }

  // Content Management Controllers
  async uploadThumbnail(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const { id } = req.params;
      const result = await this.academyService.uploadThumbnail(id, req.file);
      res.json(result);
    } catch (error) {
      console.error('Upload thumbnail error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload thumbnail'
      });
    }
  }

  async uploadVideo(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const { id } = req.params;
      const { title, duration } = req.body;
      
      const result = await this.academyService.uploadVideo(id, req.file, title, duration);
      res.json(result);
    } catch (error) {
      console.error('Upload video error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload video'
      });
    }
  }

  async deleteVideo(req, res) {
    try {
      const { id, videoId } = req.params;
      const result = await this.academyService.deleteVideo(id, videoId);
      res.json(result);
    } catch (error) {
      console.error('Delete video error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete video'
      });
    }
  }

  // Enrollment Controllers
  async enrollInCourse(req, res) {
    try {
      const { id } = req.params;
      const result = await this.academyService.enrollInCourse(id);
      res.status(201).json(result);
    } catch (error) {
      console.error('Enroll in course error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to enroll in course'
      });
    }
  }

  async updateProgress(req, res) {
    try {
      const { id } = req.params;
      const { progress, completedLessons } = req.body;
      
      const result = await this.academyService.updateProgress(id, progress, completedLessons);
      res.json(result);
    } catch (error) {
      console.error('Update progress error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update progress'
      });
    }
  }

  // Review Controllers
  async addReview(req, res) {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      
      const result = await this.academyService.addReview(id, rating, comment);
      res.status(201).json(result);
    } catch (error) {
      console.error('Add review error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add review'
      });
    }
  }

  // User-specific Controllers
  async getMyCourses(req, res) {
    try {
      const filters = req.query;
      const result = await this.academyService.getMyCourses(filters);
      res.json(result);
    } catch (error) {
      console.error('Get my courses error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get my courses'
      });
    }
  }

  async getMyCreatedCourses(req, res) {
    try {
      const filters = req.query;
      const result = await this.academyService.getMyCreatedCourses(filters);
      res.json(result);
    } catch (error) {
      console.error('Get my created courses error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get my created courses'
      });
    }
  }

  // Public Controllers
  async getCategories(req, res) {
    try {
      const result = await this.academyService.getCategories();
      res.json(result);
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get categories'
      });
    }
  }

  async getFeaturedCourses(req, res) {
    try {
      const { limit } = req.query;
      const result = await this.academyService.getFeaturedCourses(limit);
      res.json(result);
    } catch (error) {
      console.error('Get featured courses error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get featured courses'
      });
    }
  }

  // Admin Controllers
  async getStatistics(req, res) {
    try {
      const result = await this.academyService.getStatistics();
      res.json(result);
    } catch (error) {
      console.error('Get statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get statistics'
      });
    }
  }
}

export default AcademyController;
```

## Testing Examples

### Unit Tests

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CourseBrowser from '../CourseBrowser';
import useAcademy from '../hooks/useAcademy';

// Mock the hook
jest.mock('../hooks/useAcademy');

describe('CourseBrowser', () => {
  const mockCourses = [
    {
      _id: '1',
      title: 'Professional Cleaning Techniques',
      description: 'Learn advanced cleaning methods',
      category: 'cleaning',
      level: 'intermediate',
      duration: { hours: 8 },
      pricing: { regularPrice: 99.99 },
      rating: { average: 4.8, count: 15 },
      enrollment: { current: 25 }
    }
  ];

  beforeEach(() => {
    useAcademy.mockReturnValue({
      courses: mockCourses,
      loading: false,
      error: null,
      getCourses: jest.fn()
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders course list', () => {
    render(<CourseBrowser />);
    
    expect(screen.getByText('Professional Cleaning Techniques')).toBeInTheDocument();
    expect(screen.getByText('Learn advanced cleaning methods')).toBeInTheDocument();
    expect(screen.getByText('cleaning')).toBeInTheDocument();
    expect(screen.getByText('intermediate')).toBeInTheDocument();
  });

  it('filters courses by search term', async () => {
    const mockGetCourses = jest.fn();
    useAcademy.mockReturnValue({
      courses: mockCourses,
      loading: false,
      error: null,
      getCourses: mockGetCourses
    });

    render(<CourseBrowser />);
    
    const searchInput = screen.getByPlaceholderText('Search courses...');
    fireEvent.change(searchInput, { target: { value: 'cleaning' } });
    
    await waitFor(() => {
      expect(mockGetCourses).toHaveBeenCalledWith({
        search: 'cleaning',
        category: '',
        level: '',
        page: 1,
        limit: 10
      });
    });
  });

  it('filters courses by category', async () => {
    const mockGetCourses = jest.fn();
    useAcademy.mockReturnValue({
      courses: mockCourses,
      loading: false,
      error: null,
      getCourses: mockGetCourses
    });

    render(<CourseBrowser />);
    
    const categoryPicker = screen.getByDisplayValue('All Categories');
    fireEvent.change(categoryPicker, { target: { value: 'cleaning' } });
    
    await waitFor(() => {
      expect(mockGetCourses).toHaveBeenCalledWith({
        search: '',
        category: 'cleaning',
        level: '',
        page: 1,
        limit: 10
      });
    });
  });
});
```

### Integration Tests

```javascript
import request from 'supertest';
import app from '../app';
import { Course, Enrollment } from '../models/Academy';
import User from '../models/User';

describe('Academy API Integration', () => {
  let testInstructor;
  let testStudent;
  let testCourse;

  beforeAll(async () => {
    // Setup test users
    testInstructor = await User.create({
      phoneNumber: '+1234567890',
      firstName: 'John',
      lastName: 'Doe',
      role: 'instructor'
    });

    testStudent = await User.create({
      phoneNumber: '+1987654321',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'client'
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await Course.deleteMany({});
    await Enrollment.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/academy/courses', () => {
    it('should create a new course', async () => {
      const courseData = {
        title: 'Test Course',
        description: 'Test course description',
        category: 'cleaning',
        level: 'beginner',
        duration: { hours: 4 },
        pricing: { regularPrice: 49.99 }
      };

      const response = await request(app)
        .post('/api/academy/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(courseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Course');
      expect(response.body.data.instructor).toBe(testInstructor._id.toString());
    });
  });

  describe('POST /api/academy/courses/:id/enroll', () => {
    beforeEach(async () => {
      testCourse = await Course.create({
        title: 'Test Course',
        description: 'Test course description',
        category: 'cleaning',
        level: 'beginner',
        instructor: testInstructor._id,
        duration: { hours: 4 },
        pricing: { regularPrice: 49.99 }
      });
    });

    it('should enroll student in course', async () => {
      const response = await request(app)
        .post(`/api/academy/courses/${testCourse._id}/enroll`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Successfully enrolled in course');
    });

    it('should prevent duplicate enrollment', async () => {
      // First enrollment
      await request(app)
        .post(`/api/academy/courses/${testCourse._id}/enroll`)
        .set('Authorization', `Bearer ${studentToken}`);

      // Second enrollment should fail
      const response = await request(app)
        .post(`/api/academy/courses/${testCourse._id}/enroll`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You are already enrolled in this course');
    });
  });
});
```

## Performance Optimization

### Caching Strategy

```javascript
import { useQuery, useMutation, useQueryClient } from 'react-query';

const useAcademyWithCache = () => {
  const queryClient = useQueryClient();

  const { data: courses, isLoading, error } = useQuery(
    'courses',
    async () => {
      const response = await fetch('/api/academy/courses');
      if (!response.ok) throw new Error('Failed to fetch courses');
      return response.json();
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: 1000
    }
  );

  const enrollMutation = useMutation(
    async (courseId) => {
      const response = await fetch(`/api/academy/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to enroll');
      return response.json();
    },
    {
      onSuccess: (data, courseId) => {
        // Update cache with new enrollment
        queryClient.setQueryData('courses', (oldData) => ({
          ...oldData,
          data: oldData.data.map(course => 
            course._id === courseId 
              ? { ...course, enrollment: { ...course.enrollment, current: course.enrollment.current + 1 } }
              : course
          )
        }));
      }
    }
  );

  const progressMutation = useMutation(
    async ({ courseId, progress, completedLessons }) => {
      const response = await fetch(`/api/academy/courses/${courseId}/progress`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ progress, completedLessons })
      });
      if (!response.ok) throw new Error('Failed to update progress');
      return response.json();
    },
    {
      onSuccess: (data, variables) => {
        // Update cache with new progress
        queryClient.setQueryData('myCourses', (oldData) => ({
          ...oldData,
          data: oldData.data.map(course => 
            course._id === variables.courseId 
              ? { ...course, enrollment: { ...course.enrollment, progress: variables.progress } }
              : course
          )
        }));
      }
    }
  );

  return {
    courses: courses?.data,
    loading: isLoading,
    error,
    enrollInCourse: enrollMutation.mutate,
    updateProgress: progressMutation.mutate,
    isEnrolling: enrollMutation.isLoading,
    isUpdatingProgress: progressMutation.isLoading
  };
};

export default useAcademyWithCache;
```

These examples demonstrate comprehensive usage patterns for the Academy API across different platforms and scenarios. They show how to implement course management, enrollment, and progress tracking functionality with proper error handling, validation, and performance optimization.

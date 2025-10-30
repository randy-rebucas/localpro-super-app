# Courses Usage Examples

## Overview

This document provides practical examples of how to use the Courses API endpoints in real-world scenarios. Examples include common patterns, error handling, and best practices for the academy system.

## 🚀 Getting Started

### Basic Setup

```javascript
// API Base URL
const API_BASE = 'http://localhost:5000/api/academy';

// Authentication header
const authHeader = {
  'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
  'Content-Type': 'application/json'
};
```

## 📚 Course Management Examples

### 1. Browse Available Courses

```javascript
// Get all cleaning courses
async function getCleaningCourses() {
  try {
    const response = await fetch(`${API_BASE}/courses?category=cleaning&page=1&limit=10`, {
      method: 'GET',
      headers: authHeader
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Courses found:', data.data);
      console.log('Total pages:', data.pages);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
}
```

### 2. Search Courses

```javascript
// Search courses by keyword
async function searchCourses(searchTerm) {
  try {
    const response = await fetch(`${API_BASE}/courses?search=${encodeURIComponent(searchTerm)}&page=1&limit=10`, {
      method: 'GET',
      headers: authHeader
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Search results:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error searching courses:', error);
    throw error;
  }
}

// Usage
searchCourses('professional cleaning');
```

### 3. Filter Courses by Level and Category

```javascript
// Get intermediate level courses in a specific category
async function getCoursesByLevel(category, level) {
  try {
    const queryParams = new URLSearchParams({
      category,
      level,
      page: 1,
      limit: 10
    });
    
    const response = await fetch(`${API_BASE}/courses?${queryParams}`, {
      method: 'GET',
      headers: authHeader
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`Found ${data.count} ${level} ${category} courses`);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
}

// Usage
getCoursesByLevel('cleaning', 'intermediate');
```

### 4. Create a Course

```javascript
// Create a new course
async function createCourse(courseData) {
  try {
    const response = await fetch(`${API_BASE}/courses`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify(courseData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Course created:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
}

// Example course data
const newCourse = {
  title: "Professional Cleaning Techniques",
  description: "Learn advanced cleaning techniques for professional service providers",
  category: "cleaning",
  level: "intermediate",
  duration: {
    hours: 20,
    weeks: 4
  },
  pricing: {
    regularPrice: 99,
    discountedPrice: 79,
    currency: "USD"
  },
  curriculum: [
    {
      module: "Introduction to Professional Cleaning",
      lessons: [
        {
          title: "Cleaning Fundamentals",
          description: "Basic cleaning principles and techniques",
          duration: 30,
          type: "video",
          isFree: true
        },
        {
          title: "Safety Protocols",
          description: "Important safety guidelines for cleaning professionals",
          duration: 20,
          type: "video",
          isFree: false
        }
      ]
    },
    {
      module: "Advanced Techniques",
      lessons: [
        {
          title: "Deep Cleaning Methods",
          description: "Advanced deep cleaning techniques",
          duration: 45,
          type: "video",
          isFree: false
        },
        {
          title: "Cleaning Assessment Quiz",
          description: "Test your knowledge",
          duration: 15,
          type: "quiz",
          isFree: false
        }
      ]
    }
  ],
  prerequisites: ["Basic cleaning knowledge"],
  learningOutcomes: [
    "Master advanced cleaning techniques",
    "Understand safety protocols",
    "Earn professional certification"
  ],
  certification: {
    isAvailable: true,
    name: "Certified Cleaning Professional",
    issuer: "LocalPro Academy",
    validity: 24,
    requirements: ["Complete all lessons", "Pass final exam"]
  },
  enrollment: {
    maxCapacity: 200,
    isOpen: true
  },
  schedule: {
    startDate: "2024-02-01T00:00:00Z",
    endDate: "2024-02-29T00:00:00Z",
    sessions: [
      {
        date: "2024-02-01T10:00:00Z",
        startTime: "10:00",
        endTime: "12:00",
        type: "live"
      }
    ]
  },
  tags: ["cleaning", "professional", "certification"]
};

// Create the course
createCourse(newCourse);
```

### 5. Upload Course Thumbnail

```javascript
// Upload thumbnail for a course
async function uploadCourseThumbnail(courseId, thumbnailFile) {
  try {
    const formData = new FormData();
    formData.append('thumbnail', thumbnailFile);
    
    const response = await fetch(`${API_BASE}/courses/${courseId}/thumbnail`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        // Don't set Content-Type for FormData
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Thumbnail uploaded:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    throw error;
  }
}

// Usage with file input
document.getElementById('thumbnailInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (file) {
    try {
      await uploadCourseThumbnail('courseId123', file);
      console.log('Thumbnail uploaded successfully');
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }
});
```

### 6. Upload Course Video

```javascript
// Upload video lesson for a course
async function uploadCourseVideo(courseId, videoFile, title, duration) {
  try {
    const formData = new FormData();
    formData.append('video', videoFile);
    if (title) formData.append('title', title);
    if (duration) formData.append('duration', duration.toString());
    
    const response = await fetch(`${API_BASE}/courses/${courseId}/videos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Video uploaded:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error uploading video:', error);
    throw error;
  }
}

// Usage
const videoFile = document.getElementById('videoInput').files[0];
uploadCourseVideo('courseId123', videoFile, 'Cleaning Fundamentals', 30);
```

## 📝 Enrollment Examples

### 1. Enroll in a Course

```javascript
// Enroll in a course
async function enrollInCourse(courseId) {
  try {
    const response = await fetch(`${API_BASE}/courses/${courseId}/enroll`, {
      method: 'POST',
      headers: authHeader
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Enrolled successfully:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error enrolling in course:', error);
    throw error;
  }
}

// Usage
enrollInCourse('courseId123');
```

### 2. Update Course Progress

```javascript
// Update course progress
async function updateCourseProgress(courseId, progress, completedLessons) {
  try {
    const response = await fetch(`${API_BASE}/courses/${courseId}/progress`, {
      method: 'PUT',
      headers: authHeader,
      body: JSON.stringify({
        progress,
        completedLessons
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Progress updated:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error updating progress:', error);
    throw error;
  }
}

// Usage
updateCourseProgress('courseId123', 50, [
  {
    lessonId: 'lesson-1',
    completedAt: new Date().toISOString()
  }
]);
```

### 3. Get My Enrolled Courses

```javascript
// Get courses enrolled by the user
async function getMyCourses(filters = {}) {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query string
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });
    
    const response = await fetch(`${API_BASE}/my-courses?${queryParams}`, {
      method: 'GET',
      headers: authHeader
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('My courses:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error fetching my courses:', error);
    throw error;
  }
}

// Usage examples
getMyCourses(); // Get all enrolled courses
getMyCourses({ status: 'in_progress' }); // Get courses in progress
getMyCourses({ status: 'completed' }); // Get completed courses
```

### 4. Track Lesson Completion

```javascript
// Mark a lesson as completed
async function completeLesson(courseId, lessonId) {
  try {
    // First, get current enrollment to find completed lessons
    const myCourses = await getMyCourses();
    const course = myCourses.find(c => c._id === courseId);
    
    if (!course || !course.enrollment) {
      throw new Error('You are not enrolled in this course');
    }
    
    // Add new lesson to completed lessons
    const completedLessons = [
      ...course.enrollment.progress.completedLessons,
      {
        lessonId,
        completedAt: new Date().toISOString()
      }
    ];
    
    // Calculate new progress (simplified - in real app, calculate based on total lessons)
    const totalLessons = course.curriculum.reduce((sum, module) => sum + module.lessons.length, 0);
    const newProgress = Math.min(100, Math.round((completedLessons.length / totalLessons) * 100));
    
    // Update progress
    await updateCourseProgress(courseId, newProgress, completedLessons);
    
    console.log(`Lesson ${lessonId} completed. Progress: ${newProgress}%`);
  } catch (error) {
    console.error('Error completing lesson:', error);
    throw error;
  }
}

// Usage
completeLesson('courseId123', 'lesson-1');
```

## ⭐ Review Examples

### 1. Add Course Review

```javascript
// Add a review for a completed course
async function addCourseReview(courseId, rating, comment) {
  try {
    const response = await fetch(`${API_BASE}/courses/${courseId}/reviews`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({ rating, comment })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Review added:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error adding review:', error);
    throw error;
  }
}

// Usage
addCourseReview('courseId123', 5, 'Excellent course! Very informative and well-structured.');
```

## 📊 Instructor Examples

### 1. Get My Created Courses

```javascript
// Get courses created by the instructor
async function getMyCreatedCourses() {
  try {
    const response = await fetch(`${API_BASE}/my-created-courses`, {
      method: 'GET',
      headers: authHeader
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('My created courses:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error fetching my created courses:', error);
    throw error;
  }
}
```

### 2. Update Course Enrollment Status

```javascript
// Update course to close enrollment
async function closeCourseEnrollment(courseId) {
  try {
    const response = await fetch(`${API_BASE}/courses/${courseId}`, {
      method: 'PUT',
      headers: authHeader,
      body: JSON.stringify({
        enrollment: {
          isOpen: false
        }
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Course enrollment closed');
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error closing enrollment:', error);
    throw error;
  }
}
```

## 🔍 Advanced Query Examples

### 1. Complex Course Search

```javascript
// Advanced course search with multiple filters
async function searchCourses(searchCriteria) {
  try {
    const queryParams = new URLSearchParams();
    
    // Add all search criteria
    Object.entries(searchCriteria).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const response = await fetch(`${API_BASE}/courses?${queryParams}`, {
      method: 'GET',
      headers: authHeader
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Search results:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error searching courses:', error);
    throw error;
  }
}

// Example search criteria
const searchCriteria = {
  search: 'cleaning',
  category: 'cleaning',
  level: 'intermediate',
  page: 1,
  limit: 20,
  sortBy: 'rating.average',
  sortOrder: 'desc'
};

searchCourses(searchCriteria);
```

### 2. Get Featured Courses

```javascript
// Get featured courses
async function getFeaturedCourses(limit = 10) {
  try {
    const response = await fetch(`${API_BASE}/featured?limit=${limit}`, {
      method: 'GET',
      headers: authHeader
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Featured courses:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error fetching featured courses:', error);
    throw error;
  }
}
```

## 🛠️ Error Handling Examples

### 1. Comprehensive Error Handling

```javascript
// Comprehensive error handling wrapper
async function apiCall(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }
    
    if (!data.success) {
      throw new Error(data.message || 'API call failed');
    }
    
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    
    // Handle specific error types
    if (error.message.includes('401')) {
      // Handle unauthorized - redirect to login
      window.location.href = '/login';
    } else if (error.message.includes('403')) {
      // Handle forbidden - show permission error
      alert('You do not have permission to perform this action');
    } else if (error.message.includes('404')) {
      // Handle not found - show not found error
      alert('The requested resource was not found');
    } else if (error.message.includes('409')) {
      // Handle conflict - show duplicate enrollment error
      alert('You are already enrolled in this course');
    } else {
      // Handle general errors
      alert('An error occurred. Please try again later.');
    }
    
    throw error;
  }
}

// Usage
try {
  const result = await apiCall(`${API_BASE}/courses`);
  console.log('Success:', result.data);
} catch (error) {
  // Error already handled in apiCall
}
```

## 📱 Real-World Integration Examples

### 1. Course Discovery Component

```javascript
// React component for course discovery
class CourseDiscovery extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      courses: [],
      loading: false,
      filters: {
        category: '',
        level: '',
        search: ''
      }
    };
  }
  
  async loadCourses() {
    this.setState({ loading: true });
    
    try {
      const queryParams = new URLSearchParams();
      Object.entries(this.state.filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await fetch(`${API_BASE}/courses?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        this.setState({ courses: data.data });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      alert('Failed to load courses');
    } finally {
      this.setState({ loading: false });
    }
  }
  
  handleFilterChange = (filter, value) => {
    this.setState({
      filters: { ...this.state.filters, [filter]: value }
    });
  }
  
  componentDidMount() {
    this.loadCourses();
  }
  
  render() {
    return (
      <div>
        <div className="filters">
          <select 
            value={this.state.filters.category}
            onChange={(e) => this.handleFilterChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="cleaning">Cleaning</option>
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
          </select>
          
          <select 
            value={this.state.filters.level}
            onChange={(e) => this.handleFilterChange('level', e.target.value)}
          >
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          
          <input
            type="text"
            placeholder="Search courses..."
            value={this.state.filters.search}
            onChange={(e) => this.handleFilterChange('search', e.target.value)}
          />
          
          <button onClick={this.loadCourses}>Search</button>
        </div>
        
        <div className="courses">
          {this.state.loading ? (
            <div>Loading...</div>
          ) : (
            this.state.courses.map(course => (
              <div key={course._id} className="course-card">
                <img src={course.thumbnail?.url} alt={course.title} />
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <p>Level: {course.level}</p>
                <p>Rating: {course.rating.average} ({course.rating.count} reviews)</p>
                <p>Price: ${course.pricing.discountedPrice || course.pricing.regularPrice}</p>
                <button onClick={() => this.enrollInCourse(course._id)}>
                  Enroll Now
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }
}
```

### 2. Learning Progress Dashboard

```javascript
// Learning progress dashboard component
class LearningDashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      courses: [],
      loading: false
    };
  }
  
  async loadMyCourses() {
    this.setState({ loading: true });
    
    try {
      const response = await fetch(`${API_BASE}/my-courses`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
      });
      const data = await response.json();
      
      if (data.success) {
        this.setState({ courses: data.data });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      alert('Failed to load courses');
    } finally {
      this.setState({ loading: false });
    }
  }
  
  async completeLesson(courseId, lessonId) {
    try {
      await completeLesson(courseId, lessonId);
      // Reload courses to reflect changes
      this.loadMyCourses();
    } catch (error) {
      console.error('Error completing lesson:', error);
      alert('Failed to complete lesson');
    }
  }
  
  componentDidMount() {
    this.loadMyCourses();
  }
  
  render() {
    return (
      <div>
        <h2>My Courses</h2>
        {this.state.loading ? (
          <div>Loading...</div>
        ) : (
          this.state.courses.map(course => (
            <div key={course._id} className="course-progress-card">
              <h3>{course.title}</h3>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${course.enrollment.progress}%` }}
                >
                  {course.enrollment.progress}%
                </div>
              </div>
              <p>Status: {course.enrollment.status}</p>
              <p>Completed: {course.enrollment.progress.completedLessons.length} lessons</p>
              <button onClick={() => this.viewCourse(course._id)}>
                Continue Learning
              </button>
            </div>
          ))
        )}
      </div>
    );
  }
}
```

---

*These examples demonstrate common usage patterns. For more specific scenarios and advanced features, refer to the API endpoints documentation and best practices guide.*

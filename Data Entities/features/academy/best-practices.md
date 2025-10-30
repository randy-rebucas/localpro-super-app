# Academy Best Practices

## Overview

This document outlines best practices for implementing and using the Academy feature in the LocalPro Super App. These guidelines ensure optimal performance, security, and maintainability when working with courses, enrollments, and certifications.

## Security Best Practices

### Authentication & Authorization

#### Role-Based Access Control
```javascript
// ✅ Good: Implement proper role checking
const checkCoursePermission = (user, course, action) => {
  // Admin can do everything
  if (user.role === 'admin') return true;
  
  // Instructor can manage their own courses
  if (user.role === 'instructor' && course.instructor.toString() === user._id.toString()) {
    return ['read', 'update', 'delete', 'upload_content'].includes(action);
  }
  
  // Students can only read and enroll
  if (user.role === 'client') {
    return ['read', 'enroll', 'update_progress', 'review'].includes(action);
  }
  
  return false;
};

// Usage in controller
const updateCourse = async (req, res) => {
  const course = await Course.findById(req.params.id);
  
  if (!checkCoursePermission(req.user, course, 'update')) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this course'
    });
  }
  
  // Proceed with update
};
```

#### Content Security
```javascript
// ✅ Good: Validate file uploads
const validateVideoUpload = (file) => {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  const maxSize = 500 * 1024 * 1024; // 500MB
  
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Invalid video format. Only MP4, WebM, and QuickTime are allowed.');
  }
  
  if (file.size > maxSize) {
    throw new Error('Video file too large. Maximum size is 500MB.');
  }
  
  return true;
};

// ✅ Good: Sanitize course content
const sanitizeCourseContent = (content) => {
  // Remove potentially dangerous HTML
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: []
  });
  
  return sanitized;
};
```

### Data Protection

#### Sensitive Data Handling
```javascript
// ✅ Good: Sanitize course data before sending to client
const sanitizeCourseData = (course) => {
  const sanitized = { ...course.toObject() };
  
  // Remove internal fields
  delete sanitized.internalNotes;
  delete sanitized.draftContent;
  
  // Mask sensitive instructor information
  if (sanitized.instructor && sanitized.instructor.profile) {
    delete sanitized.instructor.profile.phoneNumber;
    delete sanitized.instructor.profile.email;
  }
  
  return sanitized;
};

// ✅ Good: Use field selection in queries
const getPublicCourseData = async (courseId) => {
  return await Course.findById(courseId)
    .select('title description category level duration pricing thumbnail rating')
    .populate('instructor', 'firstName lastName profile.avatar profile.bio')
    .lean();
};
```

#### Input Validation
```javascript
// ✅ Good: Comprehensive input validation
const validateCourseInput = (data) => {
  const errors = [];
  
  // Title validation
  if (!data.title || data.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters long');
  }
  
  // Category validation
  const validCategories = ['cleaning', 'plumbing', 'electrical', 'moving', 'business', 'safety', 'certification'];
  if (!validCategories.includes(data.category)) {
    errors.push('Invalid course category');
  }
  
  // Level validation
  const validLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
  if (!validLevels.includes(data.level)) {
    errors.push('Invalid course level');
  }
  
  // Pricing validation
  if (!data.pricing || !data.pricing.regularPrice || data.pricing.regularPrice <= 0) {
    errors.push('Regular price must be greater than 0');
  }
  
  // Duration validation
  if (!data.duration || !data.duration.hours || data.duration.hours <= 0) {
    errors.push('Course duration must be specified in hours');
  }
  
  return errors;
};
```

## Performance Best Practices

### Database Optimization

#### Efficient Queries
```javascript
// ✅ Good: Use specific field selection
const getCoursesList = async (filters) => {
  return await Course.find(filters)
    .select('title description category level duration pricing thumbnail rating enrollment')
    .populate('instructor', 'firstName lastName profile.avatar')
    .lean() // Use lean() for read-only operations
    .limit(20);
};

// ❌ Bad: Selecting all fields
const getCoursesList = async (filters) => {
  return await Course.find(filters)
    .populate('instructor')
    .limit(20);
};
```

#### Proper Indexing
```javascript
// ✅ Good: Create compound indexes for common queries
courseSchema.index({ category: 1, level: 1, isActive: 1 });
courseSchema.index({ instructor: 1, isActive: 1, category: 1 });
courseSchema.index({ 'enrollment.isOpen': 1, 'enrollment.maxCapacity': 1, isActive: 1 });
courseSchema.index({ 'pricing.regularPrice': 1, category: 1, isActive: 1 });

// ✅ Good: Use text search index for search functionality
courseSchema.index({
  title: 'text',
  description: 'text',
  'learningOutcomes': 'text',
  tags: 'text'
});
```

#### Pagination
```javascript
// ✅ Good: Implement efficient pagination
const getCoursesPaginated = async (page = 1, limit = 10, filters = {}) => {
  const skip = (page - 1) * limit;
  
  const [courses, total] = await Promise.all([
    Course.find(filters)
      .select('title description category level pricing thumbnail rating')
      .populate('instructor', 'firstName lastName profile.avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Course.countDocuments(filters)
  ]);
  
  return {
    courses,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      limit
    }
  };
};
```

### Caching Strategy

#### Redis Caching
```javascript
// ✅ Good: Implement Redis caching for course data
const getCourseWithCache = async (courseId) => {
  const cacheKey = `course:${courseId}`;
  
  // Try to get from cache first
  let course = await redis.get(cacheKey);
  
  if (course) {
    return JSON.parse(course);
  }
  
  // If not in cache, get from database
  course = await Course.findById(courseId)
    .populate('instructor', 'firstName lastName profile.avatar')
    .lean();
  
  if (course) {
    // Cache for 30 minutes
    await redis.setex(cacheKey, 1800, JSON.stringify(course));
  }
  
  return course;
};

// ✅ Good: Invalidate cache on updates
const updateCourse = async (courseId, updateData) => {
  const course = await Course.findByIdAndUpdate(courseId, updateData, { new: true });
  
  // Invalidate cache
  await redis.del(`course:${courseId}`);
  
  return course;
};
```

#### Client-Side Caching
```javascript
// ✅ Good: Use React Query for client-side caching
const useCourse = (courseId) => {
  return useQuery(
    ['course', courseId],
    () => fetchCourse(courseId),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      retry: 3,
      retryDelay: 1000
    }
  );
};
```

## Error Handling Best Practices

### API Error Responses
```javascript
// ✅ Good: Consistent error response format
const handleAcademyError = (error, res) => {
  console.error('Academy API Error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid course ID format'
    });
  }
  
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Course with this title already exists'
    });
  }
  
  return res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
};
```

### Client-Side Error Handling
```javascript
// ✅ Good: Comprehensive error handling in React
const useAcademy = () => {
  const [error, setError] = useState(null);
  
  const handleApiCall = async (apiCall) => {
    try {
      setError(null);
      const result = await apiCall();
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      throw err;
    }
  };
  
  const enrollInCourse = (courseId) => {
    return handleApiCall(() => 
      fetch(`/api/academy/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
    );
  };
  
  return { enrollInCourse, error, setError };
};
```

## Data Validation Best Practices

### Server-Side Validation
```javascript
// ✅ Good: Use express-validator for request validation
const { body, validationResult } = require('express-validator');

const validateCourseCreation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Description must be between 50 and 2000 characters'),
  
  body('category')
    .isIn(['cleaning', 'plumbing', 'electrical', 'moving', 'business', 'safety', 'certification'])
    .withMessage('Invalid course category'),
  
  body('level')
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Invalid course level'),
  
  body('pricing.regularPrice')
    .isFloat({ min: 0 })
    .withMessage('Regular price must be a positive number'),
  
  body('duration.hours')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Duration must be between 1 and 1000 hours'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];
```

### Client-Side Validation
```javascript
// ✅ Good: Real-time validation in React
const useCourseForm = (initialValues) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const validate = (field, value) => {
    const rules = {
      title: (val) => val.length >= 3 ? '' : 'Title must be at least 3 characters',
      description: (val) => val.length >= 50 ? '' : 'Description must be at least 50 characters',
      category: (val) => val ? '' : 'Category is required',
      level: (val) => val ? '' : 'Level is required',
      'pricing.regularPrice': (val) => val > 0 ? '' : 'Price must be greater than 0',
      'duration.hours': (val) => val > 0 ? '' : 'Duration must be greater than 0'
    };
    
    return rules[field] ? rules[field](value) : '';
  };
  
  const handleChange = (field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    if (touched[field]) {
      setErrors(prev => ({ ...prev, [field]: validate(field, value) }));
    }
  };
  
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validate(field, values[field]) }));
  };
  
  return { values, errors, touched, handleChange, handleBlur };
};
```

## State Management Best Practices

### Redux/Context State Management
```javascript
// ✅ Good: Normalized state structure
const initialState = {
  courses: {
    byId: {},
    allIds: [],
    loading: false,
    error: null,
    pagination: {
      current: 1,
      pages: 0,
      total: 0,
      limit: 10
    }
  },
  enrollments: {
    byId: {},
    allIds: [],
    loading: false,
    error: null
  },
  currentCourse: {
    data: null,
    loading: false,
    error: null
  }
};

// ✅ Good: Action creators with proper error handling
const academyActions = {
  fetchCourses: (filters) => async (dispatch) => {
    dispatch({ type: 'FETCH_COURSES_START' });
    
    try {
      const response = await fetch(`/api/academy/courses?${new URLSearchParams(filters)}`);
      const data = await response.json();
      
      if (data.success) {
        dispatch({
          type: 'FETCH_COURSES_SUCCESS',
          payload: {
            courses: data.data,
            pagination: data.pagination
          }
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      dispatch({
        type: 'FETCH_COURSES_ERROR',
        payload: error.message
      });
    }
  }
};
```

## Testing Best Practices

### Unit Testing
```javascript
// ✅ Good: Comprehensive unit tests
describe('AcademyService', () => {
  let academyService;
  let mockApiClient;
  
  beforeEach(() => {
    mockApiClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    };
    academyService = new AcademyService(mockApiClient);
  });
  
  describe('getCourses', () => {
    it('should fetch courses with filters', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            { _id: '1', title: 'Test Course' }
          ]
        }
      };
      
      mockApiClient.get.mockResolvedValue(mockResponse);
      
      const result = await academyService.getCourses({ category: 'cleaning' });
      
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/academy/courses', {
        params: { category: 'cleaning' }
      });
      expect(result).toEqual(mockResponse.data);
    });
  });
});
```

### Integration Testing
```javascript
// ✅ Good: Integration tests with test database
describe('Academy API Integration', () => {
  let app;
  let testInstructor;
  let testCourse;
  
  beforeAll(async () => {
    app = require('../app');
    await connectTestDB();
  });
  
  afterAll(async () => {
    await disconnectTestDB();
  });
  
  beforeEach(async () => {
    testInstructor = await User.create({
      phoneNumber: '+1234567890',
      firstName: 'Test',
      lastName: 'Instructor',
      role: 'instructor'
    });
    
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
  
  afterEach(async () => {
    await Course.deleteMany({});
    await User.deleteMany({});
  });
  
  describe('POST /api/academy/courses/:id/enroll', () => {
    it('should enroll student in course', async () => {
      const response = await request(app)
        .post(`/api/academy/courses/${testCourse._id}/enroll`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Successfully enrolled in course');
    });
  });
});
```

## Content Management Best Practices

### File Upload Handling
```javascript
// ✅ Good: Secure file upload handling
const uploadCourseVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Validate file type and size
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const maxSize = 500 * 1024 * 1024; // 500MB
    
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid video format'
      });
    }
    
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File too large'
      });
    }
    
    // Upload to Cloudinary
    const uploadResult = await CloudinaryService.uploadFile(
      req.file,
      'localpro/academy/videos'
    );
    
    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload video'
      });
    }
    
    // Save to database
    const course = await Course.findById(req.params.id);
    course.videos.push({
      title: req.body.title,
      url: uploadResult.data.secure_url,
      publicId: uploadResult.data.public_id,
      duration: req.body.duration
    });
    
    await course.save();
    
    res.json({
      success: true,
      message: 'Video uploaded successfully',
      data: course.videos[course.videos.length - 1]
    });
  } catch (error) {
    console.error('Upload video error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
```

### Content Organization
```javascript
// ✅ Good: Organize course content logically
const organizeCourseContent = (curriculum) => {
  return curriculum.map((module, moduleIndex) => ({
    ...module,
    order: moduleIndex + 1,
    lessons: module.lessons.map((lesson, lessonIndex) => ({
      ...lesson,
      order: lessonIndex + 1,
      id: `${moduleIndex}-${lessonIndex}`,
      estimatedDuration: lesson.duration || 0
    }))
  }));
};
```

## Monitoring and Logging Best Practices

### Structured Logging
```javascript
// ✅ Good: Structured logging with context
const logger = require('winston');

const logCourseAction = (action, courseId, userId, details = {}) => {
  logger.info('Course action', {
    action,
    courseId,
    userId,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Usage
const enrollInCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      course: id,
      student: userId
    });
    
    if (existingEnrollment) {
      logCourseAction('enrollment_attempt_duplicate', id, userId);
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }
    
    // Create enrollment
    const enrollment = await Enrollment.create({
      course: id,
      student: userId,
      enrollmentDate: new Date()
    });
    
    logCourseAction('enrollment_success', id, userId, {
      enrollmentId: enrollment._id
    });
    
    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: enrollment
    });
  } catch (error) {
    logCourseAction('enrollment_error', req.params.id, req.user.id, {
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
```

### Performance Monitoring
```javascript
// ✅ Good: Performance monitoring for course operations
const monitorCourseOperation = (operationName) => {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const startTime = Date.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        
        const duration = Date.now() - startTime;
        logger.info('Course operation completed', {
          operation: operationName,
          duration,
          success: true
        });
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Course operation failed', {
          operation: operationName,
          duration,
          error: error.message,
          success: false
        });
        
        throw error;
      }
    };
    
    return descriptor;
  };
};

// Usage
class AcademyController {
  @monitorCourseOperation('getCourses')
  async getCourses(req, res) {
    // Implementation
  }
}
```

## Mobile App Best Practices

### Offline Support
```javascript
// ✅ Good: Implement offline support for course content
const useOfflineCourse = (courseId) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState(null);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const syncOfflineProgress = async () => {
    if (isOnline && offlineData) {
      try {
        await syncCourseProgress(offlineData);
        setOfflineData(null);
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  };
  
  useEffect(() => {
    syncOfflineProgress();
  }, [isOnline]);
  
  return { isOnline, offlineData, setOfflineData };
};
```

### Video Streaming Optimization
```javascript
// ✅ Good: Optimize video streaming for mobile
const useVideoPlayer = (videoUrl) => {
  const [quality, setQuality] = useState('auto');
  const [isBuffering, setIsBuffering] = useState(false);
  
  const getOptimalQuality = (connectionType) => {
    switch (connectionType) {
      case 'wifi':
        return '1080p';
      case '4g':
        return '720p';
      case '3g':
        return '480p';
      default:
        return '360p';
    }
  };
  
  const handleQualityChange = (newQuality) => {
    setQuality(newQuality);
    // Implement quality switching logic
  };
  
  return {
    quality,
    isBuffering,
    handleQualityChange
  };
};
```

## Security Considerations

### Rate Limiting
```javascript
// ✅ Good: Implement rate limiting for academy operations
const rateLimit = require('express-rate-limit');

const courseCreationLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 courses per hour
  message: {
    success: false,
    message: 'Too many course creation attempts, please try again later'
  }
});

const enrollmentLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 enrollments per 15 minutes
  message: {
    success: false,
    message: 'Too many enrollment attempts, please try again later'
  }
});

// Apply to routes
app.post('/api/academy/courses', courseCreationLimit);
app.post('/api/academy/courses/:id/enroll', enrollmentLimit);
```

### Content Security Policy
```javascript
// ✅ Good: Implement CSP for course content
const csp = require('helmet-csp');

app.use(csp({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
    mediaSrc: ["'self'", "https://res.cloudinary.com"],
    connectSrc: ["'self'", "https://api.localpro.com"]
  }
}));
```

These best practices ensure that your Academy feature implementation is secure, performant, and maintainable. Always consider your specific use case and requirements when implementing these patterns.

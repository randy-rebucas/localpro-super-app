# Courses Best Practices

## Overview

This document outlines best practices for developing, maintaining, and optimizing the Courses feature. It covers performance considerations, security guidelines, data management, and development patterns.

## 🚀 Performance Optimization

### Database Optimization

#### Indexing Strategy
```javascript
// Course indexes for optimal query performance
courseSchema.index({ category: 1, level: 1, isActive: 1 });
courseSchema.index({ instructor: 1, isActive: 1, category: 1 });
courseSchema.index({ 'enrollment.isOpen': 1, 'enrollment.maxCapacity': 1, isActive: 1 });
courseSchema.index({ 'pricing.regularPrice': 1, 'pricing.discountedPrice': 1, isActive: 1 });
courseSchema.index({ 'certification.isAvailable': 1, category: 1, isActive: 1 });
courseSchema.index({ createdAt: -1, isActive: 1 });

// Enrollment indexes for efficient filtering
enrollmentSchema.index({ student: 1, status: 1 });
enrollmentSchema.index({ course: 1, status: 1 });
enrollmentSchema.index({ student: 1, course: 1, status: 1 }); // Unique enrollment check
enrollmentSchema.index({ 'progress.overallProgress': 1, status: 1 });
```

#### Query Optimization
```javascript
// Use lean() for read-only operations
const courses = await Course.find(filter)
  .populate('instructor', 'firstName lastName profile.avatar')
  .select('-curriculum -enrollments') // Exclude heavy fields
  .sort(sort)
  .skip(skip)
  .limit(limit)
  .lean(); // Use lean() for better performance

// Use aggregation for complex analytics
const stats = await Course.aggregate([
  { $match: { isActive: true } },
  {
    $group: {
      _id: '$category',
      totalCourses: { $sum: 1 },
      averageRating: { $avg: '$rating.average' },
      totalEnrollments: { $sum: '$enrollment.current' }
    }
  }
]);
```

#### Caching Strategy
```javascript
// Redis caching for frequently accessed data
const redis = require('redis');
const client = redis.createClient();

// Cache course listings
async function getCachedCourses(cacheKey) {
  try {
    const cached = await client.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

async function setCachedCourses(cacheKey, data, ttl = 300) {
  try {
    await client.setex(cacheKey, ttl, JSON.stringify(data));
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

// Usage in course controller
const getCourses = async (req, res) => {
  try {
    const cacheKey = `courses:${JSON.stringify(req.query)}`;
    let courses = await getCachedCourses(cacheKey);
    
    if (!courses) {
      // Fetch from database
      courses = await Course.find(filter)
        .populate('instructor', 'firstName lastName profile.avatar')
        .lean();
      await setCachedCourses(cacheKey, courses);
    }
    
    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
```

### API Performance

#### Pagination Best Practices
```javascript
// Implement efficient pagination
const getCourses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Cap at 100
    const skip = (page - 1) * limit;
    
    // Use countDocuments for total count (more efficient than count)
    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate('instructor', 'firstName lastName profile.avatar')
        .select('-curriculum') // Exclude heavy curriculum field
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Course.countDocuments(filter)
    ]);
    
    const pagination = {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      limit
    };
    
    res.json({
      success: true,
      data: courses,
      pagination
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
```

#### Response Optimization
```javascript
// Use projection to limit returned fields
const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'firstName lastName profile.avatar profile.bio')
      .select('-enrollments') // Exclude heavy enrollment data for public view
      .lean();
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
```

## 🔒 Security Best Practices

### Authentication & Authorization

#### Role-Based Access Control
```javascript
// Middleware for role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    
    next();
  };
};

// Usage in routes
router.post('/courses', auth, authorize('instructor', 'admin'), createCourse);
router.put('/courses/:id', auth, authorize('instructor', 'admin'), updateCourse);
router.delete('/courses/:id', auth, authorize('instructor', 'admin'), deleteCourse);
```

#### Instructor Ownership Validation
```javascript
// Verify instructor owns the course
const verifyInstructorOwnership = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to perform this action'
      });
    }
    
    req.course = course;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Usage
router.put('/courses/:id', auth, authorize('instructor', 'admin'), verifyInstructorOwnership, updateCourse);
```

#### Input Validation
```javascript
// Comprehensive input validation
const validateCourse = (req, res, next) => {
  const { title, description, category, level, duration, pricing } = req.body;
  const errors = [];
  
  // Validate title
  if (!title || title.trim().length < 3) {
    errors.push({ field: 'title', message: 'Title must be at least 3 characters' });
  }
  
  // Validate description
  if (!description || description.trim().length < 20) {
    errors.push({ field: 'description', message: 'Description must be at least 20 characters' });
  }
  
  // Validate category
  const validCategories = ['cleaning', 'plumbing', 'electrical', 'moving', 'business', 'safety', 'certification'];
  if (!category || !validCategories.includes(category)) {
    errors.push({ field: 'category', message: 'Valid category is required' });
  }
  
  // Validate level
  const validLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
  if (!level || !validLevels.includes(level)) {
    errors.push({ field: 'level', message: 'Valid level is required' });
  }
  
  // Validate duration
  if (!duration || !duration.hours || duration.hours <= 0) {
    errors.push({ field: 'duration.hours', message: 'Valid duration in hours is required' });
  }
  
  // Validate pricing
  if (!pricing || !pricing.regularPrice || pricing.regularPrice <= 0) {
    errors.push({ field: 'pricing.regularPrice', message: 'Valid regular price is required' });
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  
  next();
};
```

### Content Security

#### Video Upload Validation
```javascript
// Validate video uploads
const validateVideoUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No video file uploaded'
    });
  }
  
  // Check file type
  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid video format. Allowed formats: MP4, WebM, OGG'
    });
  }
  
  // Check file size (e.g., max 500MB)
  const maxSize = 500 * 1024 * 1024; // 500MB
  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      message: 'Video file too large. Maximum size: 500MB'
    });
  }
  
  next();
};
```

#### Enrolled Student Validation
```javascript
// Verify student is enrolled before accessing course content
const verifyEnrollment = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Check if user is enrolled
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: req.params.id,
      status: { $in: ['enrolled', 'in_progress'] }
    });
    
    if (!enrollment && req.user.role !== 'admin' && course.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course to access content'
      });
    }
    
    req.enrollment = enrollment;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
```

## 📊 Data Management

### Data Consistency

#### Enrollment Management
```javascript
// Atomic enrollment creation
const enrollInCourse = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Check course availability
      const course = await Course.findById(req.params.id).session(session);
      
      if (!course.isActive || !course.enrollment.isOpen) {
        throw new Error('Course is not available for enrollment');
      }
      
      // Check enrollment capacity
      if (course.enrollment.maxCapacity && 
          course.enrollment.current >= course.enrollment.maxCapacity) {
        throw new Error('Course enrollment is full');
      }
      
      // Check if already enrolled
      const existingEnrollment = await Enrollment.findOne({
        student: req.user.id,
        course: req.params.id
      }).session(session);
      
      if (existingEnrollment) {
        throw new Error('You are already enrolled in this course');
      }
      
      // Create enrollment
      const enrollment = await Enrollment.create([{
        student: req.user.id,
        course: req.params.id,
        enrollmentDate: new Date(),
        status: 'enrolled',
        progress: {
          overallProgress: 0,
          completedLessons: []
        },
        payment: {
          status: 'pending',
          amount: course.pricing.discountedPrice || course.pricing.regularPrice,
          currency: course.pricing.currency
        }
      }], { session });
      
      // Update course enrollment count
      await Course.findByIdAndUpdate(
        req.params.id,
        { $inc: { 'enrollment.current': 1 } },
        { session }
      );
    });
    
    res.json({ success: true, message: 'Successfully enrolled in course' });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  } finally {
    await session.endSession();
  }
};
```

#### Progress Calculation
```javascript
// Automatic progress calculation
const calculateProgress = (course, enrollment) => {
  const totalLessons = course.curriculum.reduce(
    (sum, module) => sum + module.lessons.length, 
    0
  );
  
  const completedLessons = enrollment.progress.completedLessons.length;
  const progress = totalLessons > 0 
    ? Math.round((completedLessons / totalLessons) * 100)
    : 0;
  
  return Math.min(100, Math.max(0, progress));
};

// Update progress when lesson is completed
const completeLesson = async (req, res) => {
  try {
    const { lessonId } = req.body;
    
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: req.params.id
    });
    
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }
    
    // Check if lesson already completed
    const alreadyCompleted = enrollment.progress.completedLessons.some(
      lesson => lesson.lessonId === lessonId
    );
    
    if (!alreadyCompleted) {
      enrollment.progress.completedLessons.push({
        lessonId,
        completedAt: new Date()
      });
      
      // Calculate new progress
      const course = await Course.findById(req.params.id);
      enrollment.progress.overallProgress = calculateProgress(course, enrollment);
      
      // Mark as completed if progress is 100%
      if (enrollment.progress.overallProgress === 100) {
        enrollment.status = 'completed';
      }
      
      await enrollment.save();
    }
    
    res.json({
      success: true,
      data: enrollment.progress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
```

### Data Archiving

#### Soft Delete Implementation
```javascript
// Soft delete for courses
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Soft delete - set isActive to false
    course.isActive = false;
    await course.save();
    
    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
```

## 🔄 Error Handling

### Comprehensive Error Handling

#### Error Classification
```javascript
// Custom error classes
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.statusCode = 400;
  }
}

class EnrollmentError extends Error {
  constructor(message) {
    super(message);
    this.name = 'EnrollmentError';
    this.statusCode = 409;
  }
}

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Log error
  console.error(err);
  
  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new Error(message);
    error.statusCode = 404;
  }
  
  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate enrollment';
    error = new EnrollmentError(message);
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ValidationError(message);
  }
  
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

## 📱 Frontend Integration

### State Management

#### React Hooks
```javascript
// Custom hook for course management
const useCourses = (filters = {}) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(`/api/academy/courses?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        setCourses(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);
  
  return { courses, loading, error, refetch: fetchCourses };
};

// Usage in component
const CourseList = ({ filters }) => {
  const { courses, loading, error, refetch } = useCourses(filters);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {courses.map(course => (
        <CourseCard key={course._id} course={course} />
      ))}
    </div>
  );
};
```

## 🧪 Testing Best Practices

### Unit Testing

#### Course Testing
```javascript
// Jest test for course creation
describe('Course Creation', () => {
  beforeEach(async () => {
    await Course.deleteMany({});
    await User.deleteMany({});
  });
  
  it('should create a course with valid data', async () => {
    const instructor = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'instructor'
    });
    
    const courseData = {
      title: 'Test Course',
      description: 'Test Description',
      category: 'cleaning',
      level: 'beginner',
      instructor: instructor._id,
      duration: {
        hours: 10
      },
      pricing: {
        regularPrice: 99
      }
    };
    
    const course = await Course.create(courseData);
    
    expect(course.title).toBe(courseData.title);
    expect(course.instructor).toEqual(instructor._id);
    expect(course.isActive).toBe(true);
  });
  
  it('should fail with invalid category', async () => {
    const courseData = {
      title: 'Test Course',
      description: 'Test Description',
      category: 'invalid',
      level: 'beginner',
      instructor: new mongoose.Types.ObjectId(),
      duration: {
        hours: 10
      },
      pricing: {
        regularPrice: 99
      }
    };
    
    await expect(Course.create(courseData)).rejects.toThrow();
  });
});
```

## 📈 Monitoring & Analytics

### Performance Monitoring

#### Metrics Collection
```javascript
// Performance metrics middleware
const performanceMetrics = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const metrics = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString()
    };
    
    // Log to monitoring service
    console.log('Performance metrics:', metrics);
    
    // Send to monitoring service (e.g., DataDog, New Relic)
    if (process.env.MONITORING_ENABLED === 'true') {
      sendMetrics(metrics);
    }
  });
  
  next();
};

// Usage
app.use(performanceMetrics);
```

### Business Analytics

#### Course Analytics
```javascript
// Analytics aggregation
const getCourseAnalytics = async (dateRange) => {
  const { startDate, endDate } = dateRange;
  
  const analytics = await Course.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: {
          category: '$category',
          level: '$level'
        },
        count: { $sum: 1 },
        totalEnrollments: { $sum: '$enrollment.current' },
        averageRating: { $avg: '$rating.average' },
        totalRevenue: {
          $sum: {
            $multiply: [
              '$enrollment.current',
              { $ifNull: ['$pricing.discountedPrice', '$pricing.regularPrice'] }
            ]
          }
        }
      }
    }
  ]);
  
  return analytics;
};
```

---

*These best practices ensure robust, secure, and performant implementation of the Courses feature. Regular review and updates of these practices are recommended as the system evolves.*

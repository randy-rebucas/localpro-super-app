# Bookings Usage Examples

## Overview

This document provides practical examples of how to use the Bookings API endpoints in real-world scenarios. Examples include common patterns, error handling, and best practices.

## 🚀 Getting Started

### Basic Setup

```javascript
// API Base URL
const API_BASE = 'http://localhost:5000/api/marketplace';

// Authentication header
const authHeader = {
  'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
  'Content-Type': 'application/json'
};
```

## 📋 Service Management Examples

### 1. Browse Available Services

```javascript
// Get all cleaning services in New York
async function getCleaningServices() {
  try {
    const response = await fetch(`${API_BASE}/services?category=cleaning&location=New York&page=1&limit=10`, {
      method: 'GET',
      headers: authHeader
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Services found:', data.data);
      console.log('Total pages:', data.pagination.pages);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
}
```

### 2. Find Nearby Services

```javascript
// Find services within 5km of a location
async function findNearbyServices(lat, lng) {
  try {
    const response = await fetch(`${API_BASE}/services/nearby?lat=${lat}&lng=${lng}&radius=5000&category=cleaning`, {
      method: 'GET',
      headers: authHeader
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Filter services within range
      const nearbyServices = data.data.filter(service => service.isWithinRange);
      console.log('Nearby services:', nearbyServices);
      return nearbyServices;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error finding nearby services:', error);
    throw error;
  }
}

// Usage
findNearbyServices(40.7128, -74.0060);
```

### 3. Create a Service Listing

```javascript
// Create a new service listing
async function createService(serviceData) {
  try {
    const response = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify(serviceData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Service created:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error creating service:', error);
    throw error;
  }
}

// Example service data
const newService = {
  title: "Professional House Cleaning",
  description: "Complete house cleaning service with eco-friendly products",
  category: "cleaning",
  subcategory: "residential",
  pricing: {
    type: "hourly",
    basePrice: 25,
    currency: "USD"
  },
  serviceArea: ["10001", "10002", "10003"],
  availability: {
    schedule: [
      {
        day: "monday",
        startTime: "09:00",
        endTime: "17:00",
        isAvailable: true
      },
      {
        day: "tuesday",
        startTime: "09:00",
        endTime: "17:00",
        isAvailable: true
      }
    ],
    timezone: "UTC"
  },
  features: ["Eco-friendly products", "Insured", "Same-day service"],
  requirements: ["Access to all rooms", "Pets secured"],
  serviceType: "one_time",
  estimatedDuration: {
    min: 2,
    max: 4
  },
  teamSize: 2,
  equipmentProvided: true,
  materialsIncluded: true,
  warranty: {
    hasWarranty: true,
    duration: 30,
    description: "30-day satisfaction guarantee"
  },
  insurance: {
    covered: true,
    coverageAmount: 1000000
  }
};

// Create the service
createService(newService);
```

### 4. Upload Service Images

```javascript
// Upload images for a service
async function uploadServiceImages(serviceId, imageFiles) {
  try {
    const formData = new FormData();
    
    // Add multiple image files
    imageFiles.forEach((file, index) => {
      formData.append('images', file);
    });
    
    const response = await fetch(`${API_BASE}/services/${serviceId}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        // Don't set Content-Type for FormData
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Images uploaded:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
}

// Usage with file input
document.getElementById('imageInput').addEventListener('change', async (event) => {
  const files = Array.from(event.target.files);
  if (files.length > 0) {
    try {
      await uploadServiceImages('serviceId123', files);
      console.log('Images uploaded successfully');
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }
});
```

## 📅 Booking Management Examples

### 1. Create a Booking

```javascript
// Create a new booking
async function createBooking(bookingData) {
  try {
    const response = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify(bookingData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Booking created:', data.data);
      
      // Handle PayPal payment if applicable
      if (data.data.paypalApprovalUrl) {
        // Redirect to PayPal for payment approval
        window.location.href = data.data.paypalApprovalUrl;
      }
      
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

// Example booking data
const newBooking = {
  serviceId: "64a1b2c3d4e5f6789012345",
  bookingDate: "2024-01-20T14:00:00Z",
  duration: 3,
  address: {
    street: "123 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "US",
    coordinates: {
      lat: 40.7128,
      lng: -74.0060
    }
  },
  specialInstructions: "Please use eco-friendly products only",
  paymentMethod: "paypal"
};

// Create the booking
createBooking(newBooking);
```

### 2. Get User Bookings

```javascript
// Get bookings for the authenticated user
async function getUserBookings(filters = {}) {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query string
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });
    
    const response = await fetch(`${API_BASE}/bookings?${queryParams}`, {
      method: 'GET',
      headers: authHeader
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Bookings found:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
}

// Usage examples
getUserBookings(); // Get all bookings
getUserBookings({ status: 'pending' }); // Get pending bookings
getUserBookings({ type: 'client' }); // Get bookings as client
getUserBookings({ type: 'provider' }); // Get bookings as provider
```

### 3. Update Booking Status

```javascript
// Update booking status
async function updateBookingStatus(bookingId, status) {
  try {
    const response = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: authHeader,
      body: JSON.stringify({ status })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Booking status updated:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
}

// Usage examples
updateBookingStatus('bookingId123', 'confirmed');
updateBookingStatus('bookingId123', 'in_progress');
updateBookingStatus('bookingId123', 'completed');
updateBookingStatus('bookingId123', 'cancelled');
```

### 4. Upload Booking Photos

```javascript
// Upload before/after photos for a booking
async function uploadBookingPhotos(bookingId, photos, type) {
  try {
    const formData = new FormData();
    
    // Add photos
    photos.forEach((photo, index) => {
      formData.append('photos', photo);
    });
    
    // Add type (before or after)
    formData.append('type', type);
    
    const response = await fetch(`${API_BASE}/bookings/${bookingId}/photos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`${type} photos uploaded:`, data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error(`Error uploading ${type} photos:`, error);
    throw error;
  }
}

// Usage
const beforePhotos = Array.from(document.getElementById('beforePhotos').files);
const afterPhotos = Array.from(document.getElementById('afterPhotos').files);

uploadBookingPhotos('bookingId123', beforePhotos, 'before');
uploadBookingPhotos('bookingId123', afterPhotos, 'after');
```

### 5. Add a Review

```javascript
// Add a review for a completed booking
async function addReview(bookingId, reviewData) {
  try {
    const response = await fetch(`${API_BASE}/bookings/${bookingId}/review`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      },
      body: reviewData
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

// Example review data
const reviewData = new FormData();
reviewData.append('rating', '5');
reviewData.append('comment', 'Excellent service! Very professional and thorough.');
reviewData.append('categories[quality]', '5');
reviewData.append('categories[timeliness]', '5');
reviewData.append('categories[communication]', '4');
reviewData.append('categories[value]', '5');
reviewData.append('wouldRecommend', 'true');

// Add review photos if any
const reviewPhotos = Array.from(document.getElementById('reviewPhotos').files);
reviewPhotos.forEach(photo => {
  reviewData.append('photos', photo);
});

// Submit the review
addReview('bookingId123', reviewData);
```

## 💳 Payment Processing Examples

### 1. Handle PayPal Payment

```javascript
// Handle PayPal payment approval
async function approvePayPalPayment(orderId) {
  try {
    const response = await fetch(`${API_BASE}/bookings/paypal/approve`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({ orderId })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('PayPal payment approved:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error approving PayPal payment:', error);
    throw error;
  }
}

// Usage - typically called after PayPal redirect
const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get('orderId');

if (orderId) {
  approvePayPalPayment(orderId);
}
```

### 2. Get PayPal Order Details

```javascript
// Get PayPal order details
async function getPayPalOrderDetails(orderId) {
  try {
    const response = await fetch(`${API_BASE}/bookings/paypal/order/${orderId}`, {
      method: 'GET',
      headers: authHeader
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('PayPal order details:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error getting PayPal order details:', error);
    throw error;
  }
}
```

## 🔍 Advanced Query Examples

### 1. Complex Service Search

```javascript
// Advanced service search with multiple filters
async function searchServices(searchCriteria) {
  try {
    const queryParams = new URLSearchParams();
    
    // Add all search criteria
    Object.entries(searchCriteria).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const response = await fetch(`${API_BASE}/services?${queryParams}`, {
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
    console.error('Error searching services:', error);
    throw error;
  }
}

// Example search criteria
const searchCriteria = {
  category: 'cleaning',
  subcategory: 'residential',
  location: 'New York',
  minPrice: 20,
  maxPrice: 50,
  rating: 4.0,
  page: 1,
  limit: 20,
  sortBy: 'rating.average',
  sortOrder: 'desc'
};

searchServices(searchCriteria);
```

### 2. Booking Analytics

```javascript
// Get detailed booking analytics
async function getBookingAnalytics(filters = {}) {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });
    
    const response = await fetch(`${API_BASE}/my-bookings?${queryParams}`, {
      method: 'GET',
      headers: authHeader
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Booking analytics:', data.data.stats);
      return data.data.stats;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error getting booking analytics:', error);
    throw error;
  }
}

// Get analytics for different time periods
getBookingAnalytics({ dateFrom: '2024-01-01', dateTo: '2024-01-31' });
getBookingAnalytics({ status: 'completed' });
getBookingAnalytics({ type: 'provider' });
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
    } else if (error.message.includes('422')) {
      // Handle validation errors - show validation messages
      alert('Please check your input and try again');
    } else {
      // Handle general errors
      alert('An error occurred. Please try again later.');
    }
    
    throw error;
  }
}

// Usage
try {
  const result = await apiCall(`${API_BASE}/services`);
  console.log('Success:', result.data);
} catch (error) {
  // Error already handled in apiCall
}
```

### 2. Retry Logic

```javascript
// Retry logic for failed API calls
async function apiCallWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      if (response.ok && data.success) {
        return data;
      }
      
      throw new Error(data.message || `HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Usage
try {
  const result = await apiCallWithRetry(`${API_BASE}/services`);
  console.log('Success after retries:', result.data);
} catch (error) {
  console.error('Failed after all retries:', error);
}
```

## 📱 Real-World Integration Examples

### 1. Service Discovery Component

```javascript
// React component for service discovery
class ServiceDiscovery extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      services: [],
      loading: false,
      filters: {
        category: '',
        location: '',
        minPrice: '',
        maxPrice: '',
        rating: ''
      }
    };
  }
  
  async loadServices() {
    this.setState({ loading: true });
    
    try {
      const queryParams = new URLSearchParams();
      Object.entries(this.state.filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await fetch(`${API_BASE}/services?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        this.setState({ services: data.data });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error loading services:', error);
      alert('Failed to load services');
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
    this.loadServices();
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
          
          <input
            type="text"
            placeholder="Location"
            value={this.state.filters.location}
            onChange={(e) => this.handleFilterChange('location', e.target.value)}
          />
          
          <button onClick={this.loadServices}>Search</button>
        </div>
        
        <div className="services">
          {this.state.loading ? (
            <div>Loading...</div>
          ) : (
            this.state.services.map(service => (
              <div key={service._id} className="service-card">
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <p>Price: ${service.pricing.basePrice}/{service.pricing.type}</p>
                <p>Rating: {service.rating.average} ({service.rating.count} reviews)</p>
                <button onClick={() => this.bookService(service._id)}>
                  Book Now
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

### 2. Booking Management Dashboard

```javascript
// Booking management dashboard
class BookingDashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      bookings: [],
      stats: {},
      loading: false,
      filters: {
        status: '',
        type: 'all',
        dateFrom: '',
        dateTo: ''
      }
    };
  }
  
  async loadBookings() {
    this.setState({ loading: true });
    
    try {
      const queryParams = new URLSearchParams();
      Object.entries(this.state.filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await fetch(`${API_BASE}/my-bookings?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
      });
      const data = await response.json();
      
      if (data.success) {
        this.setState({ 
          bookings: data.data.bookings,
          stats: data.data.stats
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      alert('Failed to load bookings');
    } finally {
      this.setState({ loading: false });
    }
  }
  
  async updateBookingStatus(bookingId, status) {
    try {
      const response = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Reload bookings to reflect changes
        this.loadBookings();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status');
    }
  }
  
  componentDidMount() {
    this.loadBookings();
  }
  
  render() {
    return (
      <div>
        <div className="stats">
          <div>Total Bookings: {this.state.stats.totalBookings}</div>
          <div>Completed: {this.state.stats.completedBookings}</div>
          <div>Pending: {this.state.stats.pendingBookings}</div>
          <div>Total Earnings: ${this.state.stats.totalEarnings}</div>
        </div>
        
        <div className="bookings">
          {this.state.loading ? (
            <div>Loading...</div>
          ) : (
            this.state.bookings.map(booking => (
              <div key={booking._id} className="booking-card">
                <h3>{booking.service.title}</h3>
                <p>Date: {new Date(booking.bookingDate).toLocaleDateString()}</p>
                <p>Duration: {booking.duration} hours</p>
                <p>Status: {booking.status}</p>
                <p>Total: ${booking.pricing.totalAmount}</p>
                
                {booking.userRole === 'provider' && (
                  <div className="actions">
                    <button 
                      onClick={() => this.updateBookingStatus(booking._id, 'confirmed')}
                      disabled={booking.status !== 'pending'}
                    >
                      Confirm
                    </button>
                    <button 
                      onClick={() => this.updateBookingStatus(booking._id, 'in_progress')}
                      disabled={booking.status !== 'confirmed'}
                    >
                      Start
                    </button>
                    <button 
                      onClick={() => this.updateBookingStatus(booking._id, 'completed')}
                      disabled={booking.status !== 'in_progress'}
                    >
                      Complete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }
}
```

---

*These examples demonstrate common usage patterns. For more specific scenarios and advanced features, refer to the API endpoints documentation and best practices guide.*

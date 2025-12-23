# Services Usage Examples

## Overview

This document provides practical examples of how to use the Services API endpoints in real-world scenarios. Examples include common patterns, error handling, and best practices for the marketplace system.

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

## 🛠️ Service Management Examples

### 1. Browse Available Services

```javascript
// Get all cleaning services
async function getCleaningServices() {
  try {
    const response = await fetch(`${API_BASE}/services?category=cleaning&page=1&limit=10`, {
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

### 2. Search Services with Filters

```javascript
// Search services with multiple filters
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

### 3. Find Nearby Services

```javascript
// Find services within 5km of a location
async function findNearbyServices(lat, lng, radius = 5000) {
  try {
    const response = await fetch(`${API_BASE}/services/nearby?lat=${lat}&lng=${lng}&radius=${radius}&category=cleaning`, {
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
findNearbyServices(40.7128, -74.0060, 5000);
```

### 4. Create a Service Listing

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
  // Old format (still supported, automatically converted to new format)
  // serviceArea: ["10001", "10002", "10003"],
  
  // New format (recommended - supports geospatial queries)
  serviceArea: [
    {
      name: "Manhattan",
      zipCodes: ["10001", "10002", "10003"],
      cities: ["New York"],
      radius: 50 // kilometers
      // coordinates will be auto-geocoded if not provided
    }
  ],
  features: ["Eco-friendly products", "Insured", "Same-day service"],
  requirements: ["Access to water", "Parking space"],
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
  },
  emergencyService: {
    available: true,
    surcharge: 50,
    responseTime: "within 2 hours"
  }
};

// Create the service
createService(newService);
```

### 5. Upload Service Images

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

### 6. Get My Services

```javascript
// Get services created by the provider
async function getMyServices(filters = {}) {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query string
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });
    
    const response = await fetch(`${API_BASE}/my-services?${queryParams}`, {
      method: 'GET',
      headers: authHeader
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('My services:', data.data.services);
      console.log('Statistics:', data.data.stats);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error fetching my services:', error);
    throw error;
  }
}

// Usage examples
getMyServices(); // Get all services
getMyServices({ status: 'active' }); // Get active services only
getMyServices({ category: 'cleaning' }); // Get cleaning services only
```

## 📝 Booking Examples

### 1. Create a Service Booking

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
  bookingDate: "2024-02-15T10:00:00Z",
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

### 2. Handle PayPal Payment

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
      console.log('Payment approved:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error approving payment:', error);
    throw error;
  }
}

// Usage after PayPal redirect
const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get('token');
if (orderId) {
  approvePayPalPayment(orderId);
}
```

### 3. Get My Bookings

```javascript
// Get bookings for the user
async function getMyBookings(filters = {}) {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query string
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
      console.log('My bookings:', data.data.bookings);
      console.log('Statistics:', data.data.stats);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error fetching my bookings:', error);
    throw error;
  }
}

// Usage examples
getMyBookings(); // Get all bookings
getMyBookings({ status: 'pending' }); // Get pending bookings
getMyBookings({ type: 'client' }); // Get bookings as client
getMyBookings({ type: 'provider' }); // Get bookings as provider
getMyBookings({ paymentStatus: 'paid' }); // Get paid bookings
```

### 4. Update Booking Status

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
      console.log('Status updated:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error updating status:', error);
    throw error;
  }
}

// Usage
updateBookingStatus('bookingId123', 'confirmed');
updateBookingStatus('bookingId123', 'in_progress');
updateBookingStatus('bookingId123', 'completed');
```

### 5. Upload Booking Photos

```javascript
// Upload before or after photos
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
    console.error('Error uploading photos:', error);
    throw error;
  }
}

// Usage
const beforePhotos = Array.from(document.getElementById('beforePhotos').files);
uploadBookingPhotos('bookingId123', beforePhotos, 'before');

const afterPhotos = Array.from(document.getElementById('afterPhotos').files);
uploadBookingPhotos('bookingId123', afterPhotos, 'after');
```

### 6. Add Review

```javascript
// Add a review for a completed booking
async function addReview(bookingId, reviewData, photos = []) {
  try {
    const formData = new FormData();
    
    // Add review data
    formData.append('rating', reviewData.rating);
    if (reviewData.comment) formData.append('comment', reviewData.comment);
    if (reviewData.categories) formData.append('categories', JSON.stringify(reviewData.categories));
    
    // Add photos
    photos.forEach((photo, index) => {
      formData.append('photos', photo);
    });
    
    const response = await fetch(`${API_BASE}/bookings/${bookingId}/review`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      },
      body: formData
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
const reviewData = {
  rating: 5,
  comment: "Excellent service! Very professional and thorough.",
  categories: {
    quality: 5,
    timeliness: 5,
    communication: 4,
    value: 5
  }
};

const reviewPhotos = Array.from(document.getElementById('reviewPhotos').files);
addReview('bookingId123', reviewData, reviewPhotos);
```

## 🔍 Advanced Query Examples

### 1. Complex Service Search

```javascript
// Advanced service search with multiple filters
async function advancedServiceSearch(searchCriteria) {
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

// Example advanced search
const advancedSearchCriteria = {
  category: 'cleaning',
  subcategory: 'residential',
  minPrice: 20,
  maxPrice: 50,
  rating: 4.0,
  serviceType: 'one_time',
  equipmentProvided: true,
  materialsIncluded: true,
  warranty: true,
  insurance: true,
  emergencyService: true,
  page: 1,
  limit: 20,
  sortBy: 'rating.average',
  sortOrder: 'desc'
};

advancedServiceSearch(advancedSearchCriteria);
```

### 2. Location-Based Search

```javascript
// Find services near a specific location
async function findServicesNearLocation(lat, lng, radius, filters = {}) {
  try {
    const queryParams = new URLSearchParams();
    
    // Add location parameters
    queryParams.append('lat', lat);
    queryParams.append('lng', lng);
    queryParams.append('radius', radius);
    
    // Add additional filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const response = await fetch(`${API_BASE}/services/nearby?${queryParams}`, {
      method: 'GET',
      headers: authHeader
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Nearby services:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error finding nearby services:', error);
    throw error;
  }
}

// Usage
findServicesNearLocation(40.7128, -74.0060, 5000, {
  category: 'cleaning',
  minPrice: 20,
  maxPrice: 50,
  rating: 4.0
});
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
      // Handle conflict - show duplicate booking error
      alert('You already have a booking for this service');
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
        subcategory: '',
        minPrice: '',
        maxPrice: '',
        rating: '',
        location: ''
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
            type="number"
            placeholder="Min Price"
            value={this.state.filters.minPrice}
            onChange={(e) => this.handleFilterChange('minPrice', e.target.value)}
          />
          
          <input
            type="number"
            placeholder="Max Price"
            value={this.state.filters.maxPrice}
            onChange={(e) => this.handleFilterChange('maxPrice', e.target.value)}
          />
          
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
                <img src={service.images[0]?.url} alt={service.title} />
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <p>Category: {service.category}</p>
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
// Booking management dashboard component
class BookingDashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      bookings: [],
      loading: false,
      filters: {
        status: '',
        type: 'all',
        paymentStatus: ''
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
      await updateBookingStatus(bookingId, status);
      // Reload bookings to reflect changes
      this.loadBookings();
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
        <h2>My Bookings</h2>
        
        <div className="stats">
          <div>Total Bookings: {this.state.stats?.totalBookings}</div>
          <div>Pending: {this.state.stats?.pendingBookings}</div>
          <div>Completed: {this.state.stats?.completedBookings}</div>
          <div>Total Earnings: ${this.state.stats?.totalEarnings}</div>
        </div>
        
        <div className="filters">
          <select 
            value={this.state.filters.status}
            onChange={(e) => this.setState({ 
              filters: { ...this.state.filters, status: e.target.value }
            })}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <select 
            value={this.state.filters.type}
            onChange={(e) => this.setState({ 
              filters: { ...this.state.filters, type: e.target.value }
            })}
          >
            <option value="all">All Bookings</option>
            <option value="client">As Client</option>
            <option value="provider">As Provider</option>
          </select>
          
          <button onClick={this.loadBookings}>Filter</button>
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
                <p>Payment: {booking.payment.status}</p>
                <p>Role: {booking.userRole}</p>
                
                {booking.userRole === 'provider' && (
                  <div className="provider-actions">
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
                
                {booking.userRole === 'client' && booking.status === 'completed' && !booking.review && (
                  <button onClick={() => this.showReviewModal(booking._id)}>
                    Add Review
                  </button>
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

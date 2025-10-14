# LocalPro Super App - Backend API

A comprehensive Node.js backend API for the LocalPro Super App ecosystem, providing a centralized platform for local service providers, clients, and businesses.

## 🚀 Features

### Core Modules
- **🔐 Authentication**: SMS-based authentication with Twilio integration
- **🏪 Marketplace**: Service marketplace (cleaning, plumbing, electrical, moving)
- **📦 Supplies & Materials**: Product catalog with subscription kits
- **🎓 Academy**: Training courses and certification programs
- **💰 Finance**: Salary advances and micro-loans
- **🔧 Rentals**: Tool and vehicle rental platform
- **📢 Advertising**: Platform for hardware stores and suppliers
- **🏢 FacilityCare**: Janitorial, landscaping, and pest control services
- **⭐ LocalPro Plus**: Premium subscription system
- **🗺️ Google Maps**: Location services and mapping integration
- **📧 Email Service**: Multi-provider email notifications

### Key Features
- RESTful API with comprehensive endpoints
- JWT-based authentication
- Role-based access control
- Real-time SMS verification
- Advanced search and filtering
- Payment processing integration
- Subscription management
- Analytics and reporting
- File upload support
- Rate limiting and security
- **Location-based services with Google Maps**
- **Email notifications (Resend, SendGrid, SMTP)**
- **Service area validation**
- **Distance calculations and travel time**
- **Places search and autocomplete**

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + Twilio SMS
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan
- **Email Service**: Resend, SendGrid, SMTP (Nodemailer)
- **Maps & Location**: Google Maps APIs
- **File Storage**: Cloudinary

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Twilio account for SMS verification
- Google Maps API key (optional)
- Email service account (Resend, SendGrid, or SMTP)
- Git

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd localpro-super-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment setup
```bash
cp env.example .env
```

Update the `.env` file with your configuration. **For development, you only need to set the JWT_SECRET and MONGODB_URI**:

```env
# Server Configuration
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/localpro-super-app

# JWT (Required)
JWT_SECRET=your-super-secret-jwt-key-here

# Twilio Configuration (Optional for development - app will use mock SMS)
# TWILIO_ACCOUNT_SID=your-twilio-account-sid
# TWILIO_AUTH_TOKEN=your-twilio-auth-token
# TWILIO_VERIFY_SERVICE_SID=your-twilio-verify-service-sid
# TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Email Service Configuration (Optional)
# Option 1: Resend (Recommended - Modern API)
# RESEND_API_KEY=re_xxxxxxxxx
# FROM_EMAIL=noreply@yourdomain.com

# Option 2: SendGrid (API-based)
# SENDGRID_API_KEY=your-sendgrid-api-key

# Option 3: SMTP (SMTP-based)
# SMTP_HOST=smtp.hostinger.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@yourdomain.com
# SMTP_PASS=your-email-password

# Email Settings
EMAIL_SERVICE=resend

# Google Maps Configuration (Optional)
# GOOGLE_MAPS_API_KEY=your-google-maps-api-key
# GOOGLE_MAPS_GEOCODING_API_KEY=your-google-maps-geocoding-api-key
# GOOGLE_MAPS_PLACES_API_KEY=your-google-maps-places-api-key
# GOOGLE_MAPS_DISTANCE_MATRIX_API_KEY=your-google-maps-distance-matrix-api-key
```

**Note**: The app includes development mode support for Twilio. If Twilio credentials are not provided, the app will:
- Generate mock verification codes (displayed in console)
- Accept any 6-digit code for verification
- Log SMS messages instead of sending them

### 4. Start the development server
```bash
npm run dev
```

The API will be available at `http://localhost:4000`

### 5. Quick Development Setup

If you want to get started quickly without setting up external services:

1. **Create a minimal `.env` file**:
```bash
echo "JWT_SECRET=localpro-dev-secret-key-12345" > .env
echo "MONGODB_URI=mongodb://localhost:27017/localpro-super-app" >> .env
echo "NODE_ENV=development" >> .env
echo "PORT=4000" >> .env
```

2. **Start MongoDB** (if not already running):
```bash
# On Windows (if MongoDB is installed as a service)
net start MongoDB

# On macOS with Homebrew
brew services start mongodb-community

# On Linux
sudo systemctl start mongod
```

3. **Test the API**:
```bash
# Health check
curl http://localhost:4000/health

# Send verification code (will use mock SMS)
curl -X POST http://localhost:4000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'

# Verify code (use any 6-digit code like "123456")
curl -X POST http://localhost:4000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890", "code": "123456", "firstName": "John", "lastName": "Doe"}'

# Test Google Maps geocoding (requires API key)
curl -X POST http://localhost:4000/api/maps/geocode \
  -H "Content-Type: application/json" \
  -d '{"address": "New York, NY"}'
```

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/send-code          # Send verification code
POST /api/auth/verify-code        # Verify code and login/register
GET  /api/auth/me                 # Get current user
PUT  /api/auth/profile            # Update user profile
POST /api/auth/logout             # Logout user
```

### Marketplace Endpoints
```
GET    /api/marketplace/services           # Get all services
GET    /api/marketplace/services/nearby    # Get nearby services with distance
GET    /api/marketplace/services/:id       # Get single service
POST   /api/marketplace/services           # Create service (Provider)
PUT    /api/marketplace/services/:id       # Update service (Provider)
DELETE /api/marketplace/services/:id       # Delete service (Provider)
POST   /api/marketplace/bookings           # Create booking
GET    /api/marketplace/bookings           # Get user bookings
PUT    /api/marketplace/bookings/:id/status # Update booking status
POST   /api/marketplace/bookings/:id/review # Add review
```

### Supplies & Materials Endpoints
```
GET  /api/supplies/products                # Get all products
GET  /api/supplies/products/:id            # Get single product
POST /api/supplies/products                # Create product (Supplier)
GET  /api/supplies/subscription-kits       # Get subscription kits
POST /api/supplies/orders                  # Create order
GET  /api/supplies/orders                  # Get user orders
POST /api/supplies/subscribe               # Subscribe to kit
```

### Academy Endpoints
```
GET  /api/academy/courses                  # Get all courses
GET  /api/academy/courses/:id              # Get single course
POST /api/academy/courses                  # Create course (Instructor)
POST /api/academy/enroll                   # Enroll in course
GET  /api/academy/enrollments              # Get user enrollments
GET  /api/academy/certifications           # Get certifications
```

### Finance Endpoints
```
POST /api/finance/loans/apply              # Apply for loan
GET  /api/finance/loans                    # Get user loans
POST /api/finance/salary-advance/apply     # Apply for salary advance
GET  /api/finance/salary-advances          # Get user salary advances
GET  /api/finance/transactions             # Get user transactions
```

### Rentals Endpoints
```
GET  /api/rentals/items                    # Get rental items
GET  /api/rentals/items/:id                # Get single rental item
POST /api/rentals/items                    # Create rental item
POST /api/rentals/book                     # Create rental booking
GET  /api/rentals                          # Get user rentals
PUT  /api/rentals/:id/status               # Update rental status
```

### Advertising Endpoints
```
GET  /api/ads/active                       # Get active ads
POST /api/ads/impression                   # Record ad impression
POST /api/ads/advertisers/register         # Register as advertiser
POST /api/ads/campaigns                    # Create ad campaign
GET  /api/ads/campaigns                    # Get advertiser campaigns
GET  /api/ads/campaigns/:id/analytics      # Get campaign analytics
```

### FacilityCare Endpoints
```
GET  /api/facility-care/services           # Get facility care services
POST /api/facility-care/services           # Create service (Provider)
POST /api/facility-care/contracts          # Create contract
GET  /api/facility-care/contracts          # Get user contracts
POST /api/facility-care/subscribe          # Create subscription
GET  /api/facility-care/subscriptions      # Get user subscriptions
```

### LocalPro Plus Endpoints
```
GET  /api/localpro-plus/plans              # Get subscription plans
POST /api/localpro-plus/subscribe          # Subscribe to plan
GET  /api/localpro-plus/subscription       # Get user subscription
PUT  /api/localpro-plus/subscription/cancel # Cancel subscription
GET  /api/localpro-plus/payments           # Get user payments
POST /api/localpro-plus/usage              # Record feature usage
```

### Google Maps & Location Endpoints
```
POST /api/maps/geocode                     # Convert address to coordinates
POST /api/maps/reverse-geocode             # Convert coordinates to address
POST /api/maps/places/search               # Search for places
GET  /api/maps/places/:placeId             # Get place details
POST /api/maps/distance                    # Calculate distance between points
POST /api/maps/nearby                      # Find nearby places
POST /api/maps/validate-service-area       # Validate service area coverage
POST /api/maps/analyze-coverage            # Analyze service coverage (Protected)
GET  /api/maps/test                        # Test API connection (Admin)
```

## 🗄️ Database Models

### Core Models
- **User**: User profiles with roles and preferences
- **Service**: Marketplace services with pricing and availability
- **Booking**: Service bookings with status tracking
- **Product**: Supplies and materials catalog
- **Order**: Product orders and subscriptions
- **Course**: Training courses and curriculum
- **Enrollment**: Course enrollments and progress
- **Loan**: Loan applications and management
- **RentalItem**: Tools and vehicles for rent
- **Rental**: Rental bookings and transactions
- **AdCampaign**: Advertising campaigns
- **Contract**: Facility care contracts
- **Subscription**: LocalPro Plus subscriptions

## 🆕 New Features

### 📧 Email Service Integration
- **Multi-provider support**: Resend, SendGrid, and SMTP
- **Automatic email notifications**: Welcome emails, booking confirmations, order confirmations, loan approvals
- **Easy configuration**: Switch between providers via environment variables
- **Fallback handling**: Graceful degradation when email service fails

### 🗺️ Google Maps Integration
- **Geocoding**: Convert addresses to coordinates and vice versa
- **Places Search**: Find and search for local businesses
- **Distance Calculations**: Real-time distance and travel time estimates
- **Service Area Validation**: Verify if locations are within service coverage
- **Location-based Search**: Find services within specified radius
- **Coverage Analysis**: Analyze service provider coverage areas

### 🔧 Enhanced Controllers
- **Marketplace**: Location-based service search with distance calculations
- **Rentals**: Enhanced location filtering and distance calculations
- **Supplies**: Email notifications for orders and subscriptions
- **Finance**: Email notifications for loan approvals
- **Authentication**: Welcome emails for new users

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (client, provider, admin, supplier, instructor)
- Rate limiting (100 requests per 15 minutes)
- Input validation with Joi
- CORS protection
- Helmet security headers
- Phone number verification via SMS
- Password-free authentication

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests with coverage
npm run test:coverage
```

## 📦 Deployment

### Environment Variables
Ensure all required environment variables are set in production:

```env
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-production-jwt-secret
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
# ... other production variables
```

### Docker Deployment
```bash
# Build Docker image
docker build -t localpro-super-app .

# Run container
docker run -p 5000:5000 --env-file .env localpro-super-app
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@localpro.com or join our Slack channel.

## 🗺️ Roadmap

- [x] Google Maps integration
- [x] Email service integration
- [x] Location-based services
- [x] Service area validation
- [x] Distance calculations
- [ ] Mobile app integration
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Payment gateway integration
- [ ] AI-powered recommendations
- [ ] Blockchain integration for contracts
- [ ] IoT device integration

# Cloudinary Integration Setup Guide

This guide will help you set up Cloudinary for file storage in the LocalPro Super App.

## Prerequisites

1. A Cloudinary account (sign up at [cloudinary.com](https://cloudinary.com))
2. Node.js and npm installed
3. The LocalPro Super App project set up

## Step 1: Create a Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com) and sign up for a free account
2. After signing up, you'll be taken to your dashboard
3. Note down your Cloud Name, API Key, and API Secret from the dashboard

## Step 2: Configure Environment Variables

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp env.example .env
   ```

2. Add your Cloudinary credentials to the `.env` file:
   ```env
   # File Upload - Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   ```

   Replace the placeholder values with your actual Cloudinary credentials.

## Step 3: Install Dependencies

The required dependencies are already installed:
- `cloudinary` - Main Cloudinary SDK
- `multer` - File upload middleware
- `multer-storage-cloudinary` - Cloudinary storage for Multer

## Step 4: Test the Integration

Run the test script to verify your configuration:

```bash
node test-cloudinary.js
```

If the test passes, you're ready to use Cloudinary!

## Step 5: Available File Upload Endpoints

### User Profile
- `POST /api/auth/upload-avatar` - Upload profile avatar
- `POST /api/auth/upload-portfolio` - Upload portfolio images

### Marketplace
- `POST /api/marketplace/services/:id/images` - Upload service images
- `POST /api/marketplace/bookings/:id/photos` - Upload booking photos
- `POST /api/marketplace/bookings/:id/review` - Upload review photos

### Academy
- `POST /api/academy/courses/:id/thumbnail` - Upload course thumbnail
- `POST /api/academy/courses/:id/content` - Upload course content

## File Upload Usage Examples

### Upload Profile Avatar (Frontend)
```javascript
const formData = new FormData();
formData.append('avatar', fileInput.files[0]);

fetch('/api/auth/upload-avatar', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('Avatar uploaded:', data);
});
```

### Upload Service Images (Frontend)
```javascript
const formData = new FormData();
files.forEach(file => {
  formData.append('images', file);
});

fetch(`/api/marketplace/services/${serviceId}/images`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('Images uploaded:', data);
});
```

## File Storage Structure

Files are organized in Cloudinary with the following folder structure:

```
localpro/
├── users/
│   ├── profiles/          # User profile avatars
│   └── portfolio/         # User portfolio images
├── marketplace/
│   ├── services/          # Service images
│   ├── bookings/          # Booking photos
│   └── reviews/           # Review photos
├── academy/
│   ├── thumbnails/        # Course thumbnails
│   └── courses/           # Course content
├── rentals/               # Rental item images
├── supplies/              # Supply product images
├── ads/                   # Advertisement images
├── trust-verification/    # Verification documents
├── communication/         # Communication attachments
├── finance/               # Finance documents
├── analytics/             # Analytics reports
└── plus/                  # LocalPro Plus content
```

## File Types and Limits

### Supported File Types
- **Images**: JPG, JPEG, PNG, GIF
- **Documents**: PDF, DOC, DOCX
- **Videos**: MP4 (for LocalPro Plus content)
- **Audio**: MP3 (for LocalPro Plus content)

### File Size Limits
- Maximum file size: 10MB
- Maximum files per upload: 5 files

## Image Optimization

Cloudinary automatically optimizes images with:
- Auto quality adjustment
- Auto format selection (WebP, AVIF when supported)
- Responsive image generation
- Thumbnail generation

## Security Features

- File type validation
- File size limits
- User authorization checks
- Automatic cleanup of old files when replaced

## Error Handling

The integration includes comprehensive error handling:
- Invalid file types
- File size exceeded
- Upload failures
- Authorization errors
- Network issues

## Monitoring and Analytics

Cloudinary provides:
- Upload statistics
- Bandwidth usage
- Storage usage
- Performance metrics

Access these in your Cloudinary dashboard.

## Troubleshooting

### Common Issues

1. **"Must supply cloud_name" error**
   - Check your `.env` file has the correct Cloudinary credentials
   - Ensure the environment variables are loaded properly

2. **Upload failures**
   - Check file size (must be under 10MB)
   - Verify file type is supported
   - Check your Cloudinary account limits

3. **Authorization errors**
   - Ensure user is logged in and has proper permissions
   - Check JWT token is valid

### Getting Help

- Check Cloudinary documentation: [cloudinary.com/documentation](https://cloudinary.com/documentation)
- Review the test script output for specific error messages
- Check server logs for detailed error information

## Cost Considerations

Cloudinary offers a generous free tier:
- 25 GB storage
- 25 GB bandwidth per month
- 25,000 transformations per month

For production use, consider upgrading to a paid plan based on your needs.

## Next Steps

1. Set up your Cloudinary account and configure credentials
2. Test the integration using the provided test script
3. Implement file uploads in your frontend application
4. Monitor usage and optimize as needed
5. Consider implementing additional features like:
   - Image cropping and editing
   - Video processing
   - Advanced transformations
   - CDN optimization

# Changelog

All notable changes to the LocalPro SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-31

### Added
- Initial release of LocalPro SDK
- Base HTTP client with API key authentication
- Escrow API module with full CRUD operations:
  - Create escrow with payment hold
  - Get escrow details
  - List escrows with filtering
  - Capture payment
  - Refund payment
  - Upload proof of work
  - Initiate disputes
  - Request payouts
  - Get transaction history
  - Get payout details
- Comprehensive error handling with custom error classes
- TypeScript-ready error types
- Example usage files
- Complete documentation

### Features
- API key and secret authentication
- Automatic error handling and type conversion
- Request/response interceptors
- Configurable base URL and timeout
- Support for file uploads (multipart/form-data)
- Pagination support for list endpoints

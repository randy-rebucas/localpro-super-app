# LocalPro Super App - Suggested Questions for Codebase Exploration

This document contains suggested questions to help explore and understand different aspects of the LocalPro Super App codebase.

---

## Architecture & Design

- "How does the authentication and authorization system work?"
- "Explain the middleware stack and request flow"
- "What's the database schema for the marketplace/booking system?"
- "How are the 33+ background automation services organized and triggered?"
- "What's the WebSocket architecture for live chat?"

---

## Feature-Specific Questions

- "How does the referral system and tier rewards work?"
- "Explain the escrow payment flow and dispute management"
- "How does distance-based provider matching work in marketplace?"
- "What's the difference between a Client and a Provider user?"
- "How does the LocalPro Plus subscription system handle payments?"
- "Explain the trust verification and background check process"
- "How do GPS tracking and geofencing features work?"

---

## Payments & Financial

- "How are PayPal and PayMaya integrated for payments?"
- "Show me the commission calculation logic for agencies"
- "How does the salary advance/loan system work?"
- "What webhook handlers exist for payment providers?"

---

## Code Quality & Maintenance

- "What test coverage exists and what's missing?"
- "Are there any security vulnerabilities or concerns?"
- "What API endpoints are missing input validation?"
- "Show me any TODO comments or incomplete features"
- "What are the most complex functions that need refactoring?"

---

## Documentation & API

- "Generate API documentation for the marketplace endpoints"
- "What's missing from the Swagger documentation?"
- "Create a developer onboarding guide"
- "Why was PARTNER_API_DOCUMENTATION.md deleted?"

---

## Troubleshooting & Debugging

- "What error tracking and logging systems are in place?"
- "How do I debug a failed booking/payment?"
- "What monitoring metrics are collected?"
- "Show me the most common error patterns in the codebase"

---

## Deployment & Operations

- "What environment variables need to be configured?"
- "How do database migrations and seeders work?"
- "What's the health check and startup validation process?"
- "How are background jobs scheduled and managed?"

---

## Getting Started

Pick any question from the categories above and ask Claude Code to explore that aspect of your codebase. These questions are designed to help you understand the architecture, features, and operational aspects of the LocalPro Super App.

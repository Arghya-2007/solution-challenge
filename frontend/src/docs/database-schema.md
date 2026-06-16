# Firestore Multi-Tenant Database Schema

This document outlines the architecture for the enterprise-grade multi-tenant AI platform in Firestore.

## Root Collection: `organizations`
The `organizations` collection represents a tenant in the system.
- **Document ID**: `tenant_id` (Auto-generated or custom business ID)
- **Fields**:
  - `name`: string (e.g., "Acme Corp")
  - `createdAt`: timestamp
  - `plan`: string (e.g., "enterprise", "pro", "free")

### Sub-collection: `users`
Inside each organization document, there is a `users` sub-collection for the tenant's users.
- **Document ID**: application user ID
- **Fields**:
  - `email`: string
  - `role`: string ('admin' | 'analyst')
  - `tenantId`: string (reference to the parent organization ID)

### Sub-collection: `datasets`
Inside each organization document, there is a `datasets` sub-collection for tracking uploaded files/datasets for the tenant.
- **Document ID**: Auto-generated string
- **Fields**:
  - `filename`: string
  - `storagePath`: string
  - `status`: string (e.g., "processing", "uploaded", "failed")
  - `uploadedBy`: string (ID of the user who uploaded the file)
  - `uploadedAt`: timestamp


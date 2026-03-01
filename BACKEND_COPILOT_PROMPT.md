# Backend Implementation Prompt for VS Code Copilot

## Context
I need to implement user profile and settings management APIs for a Smart Hydroponic Lettuce System mobile app. The mobile app is built with React Native and already has all the UI components and API client ready.

## Requirements

### 1. Database Schema

Create two new tables:

**users table** (extend existing or create new):
- id (VARCHAR PRIMARY KEY)
- name (VARCHAR)
- email (VARCHAR UNIQUE)
- phone (VARCHAR)
- location (VARCHAR)
- bio (TEXT)
- avatar_url (VARCHAR)
- hashed_password (VARCHAR)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- deleted_at (TIMESTAMP)

**preferences table** (new):
- id (SERIAL PRIMARY KEY)
- user_id (VARCHAR, FOREIGN KEY -> users.id)
- push_notifications (BOOLEAN, default TRUE)
- email_notifications (BOOLEAN, default FALSE)
- auto_sync (BOOLEAN, default TRUE)
- dark_mode (BOOLEAN, default FALSE)
- language (VARCHAR, default 'English')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- UNIQUE constraint on user_id

### 2. API Endpoints to Implement

**User Profile:**
- GET /api/users/profile - Get current user's profile with stats
- PUT /api/users/profile - Update profile (name, phone, location, bio)
- POST /api/users/avatar - Upload profile avatar image

**User Preferences:**
- GET /api/users/preferences - Get user's app preferences
- PUT /api/users/preferences - Update preferences

**Account Management:**
- POST /api/users/change-password - Change password with verification
- DELETE /api/users/account - Soft delete user account

### 3. Response Formats

**GET /api/users/profile response:**
```json
{
  "user_id": "user_123",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "location": "San Francisco, CA",
  "bio": "Hydroponic enthusiast",
  "avatar_url": "https://storage.example.com/avatars/user_123.jpg",
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-02-27T10:00:00Z",
  "stats": {
    "plants_monitored": 48,
    "forecasts_made": 156,
    "weight_scans": 89,
    "disease_checks": 23
  }
}
```

**GET /api/users/preferences response:**
```json
{
  "user_id": "user_123",
  "push_notifications": true,
  "email_notifications": false,
  "auto_sync": true,
  "dark_mode": false,
  "language": "English",
  "updated_at": "2026-02-27T10:00:00Z"
}
```

### 4. Security Requirements
- All endpoints require JWT authentication (Authorization: Bearer <token>)
- Password change requires current password verification
- Account deletion requires password confirmation and "DELETE" string
- File uploads limited to 10MB, only image types (jpeg, png)
- Hash passwords with bcrypt
- Rate limit password change attempts

### 5. Statistics Calculation
For the profile stats, calculate:
- plants_monitored: Count of plants owned by user
- forecasts_made: Count of growth forecasts by user
- weight_scans: Count of weight estimation scans by user
- disease_checks: Count of disease scans by user (if implemented)

### 6. File Upload
For avatar upload:
- Accept multipart/form-data
- Save to static/avatars/ directory
- Generate unique filename: {user_id}_{uuid}.{extension}
- Return full URL: https://yourdomain.com/static/avatars/{filename}
- Update user.avatar_url in database

### 7. Error Handling
Return appropriate HTTP status codes:
- 200: Success
- 400: Bad request (validation error, incorrect password)
- 401: Unauthorized (invalid token)
- 404: Not found
- 500: Internal server error

### 8. Implementation Notes
- Use FastAPI with SQLAlchemy ORM
- Use Pydantic models for request/response validation
- Implement proper transaction handling (db.commit(), db.rollback())
- Add logging for security-sensitive operations
- Return descriptive error messages
- Implement soft delete (set is_active=False, deleted_at=NOW())

### 9. Testing
After implementation, test with:
```bash
# Get profile
curl -X GET "http://localhost:8001/api/users/profile" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update profile
curl -X PUT "http://localhost:8001/api/users/profile" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "phone": "+1234567890"}'

# Get preferences
curl -X GET "http://localhost:8001/api/users/preferences" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update preferences
curl -X PUT "http://localhost:8001/api/users/preferences" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"push_notifications": true, "dark_mode": false}'
```

## Additional Context
- The auth backend is on port 8001
- ML/inference backend is on port 8000
- Mobile app is React Native with Expo
- Already have working auth (login/register) endpoints
- Mobile app already has API client (axios) configured
- All request/response TypeScript types are defined

## Expected Deliverables
1. Database migration/schema update SQL
2. FastAPI router with all endpoints
3. Pydantic models for requests/responses
4. Authentication dependency (get_current_user)
5. File upload handling for avatars
6. Error handling and validation
7. Statistics calculation queries

Please implement all the endpoints following FastAPI best practices with proper error handling, validation, and security measures.

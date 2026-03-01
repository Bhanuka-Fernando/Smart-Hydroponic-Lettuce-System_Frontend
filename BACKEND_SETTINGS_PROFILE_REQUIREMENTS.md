# Backend API Implementation Requirements - Settings & Profile Features

## Overview
This document outlines the backend API endpoints needed to support the mobile app's settings and profile management features. Implement these endpoints in your FastAPI backend.

---

## 1. User Profile Management

### GET /api/users/profile
**Description:** Get the current user's profile information

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** 200 OK
```json
{
  "user_id": "user_123",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "location": "San Francisco, CA",
  "bio": "Hydroponic farming enthusiast",
  "avatar_url": "https://storage.example.com/avatars/user_123.jpg",
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-02-20T14:45:00Z",
  "stats": {
    "plants_monitored": 48,
    "forecasts_made": 156,
    "weight_scans": 89,
    "disease_checks": 23
  }
}
```

**FastAPI Implementation:**
```python
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/users", tags=["users"])

class UserStats(BaseModel):
    plants_monitored: int
    forecasts_made: int
    weight_scans: int
    disease_checks: int

class UserProfile(BaseModel):
    user_id: str
    name: str
    email: str
    phone: str | None = None
    location: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    created_at: datetime
    updated_at: datetime
    stats: UserStats

@router.get("/profile", response_model=UserProfile)
async def get_user_profile(current_user = Depends(get_current_user)):
    """Get current user's profile"""
    # Fetch from database
    user = db.query(User).filter(User.id == current_user.id).first()
    
    # Calculate stats
    stats = UserStats(
        plants_monitored=db.query(Plant).filter(Plant.user_id == user.id).count(),
        forecasts_made=db.query(Forecast).filter(Forecast.user_id == user.id).count(),
        weight_scans=db.query(WeightScan).filter(WeightScan.user_id == user.id).count(),
        disease_checks=db.query(DiseaseCheck).filter(DiseaseCheck.user_id == user.id).count()
    )
    
    return UserProfile(
        user_id=user.id,
        name=user.name,
        email=user.email,
        phone=user.phone,
        location=user.location,
        bio=user.bio,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
        updated_at=user.updated_at,
        stats=stats
    )
```

---

### PUT /api/users/profile
**Description:** Update the current user's profile

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "location": "San Francisco, CA",
  "bio": "Hydroponic farming enthusiast with 5 years experience"
}
```

**Response:** 200 OK
```json
{
  "message": "Profile updated successfully",
  "user": {
    "user_id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "location": "San Francisco, CA",
    "bio": "Hydroponic farming enthusiast with 5 years experience",
    "updated_at": "2026-02-27T10:00:00Z"
  }
}
```

**FastAPI Implementation:**
```python
from pydantic import BaseModel

class ProfileUpdateRequest(BaseModel):
    name: str | None = None
    phone: str | None = None
    location: str | None = None
    bio: str | None = None

@router.put("/profile")
async def update_user_profile(
    profile: ProfileUpdateRequest,
    current_user = Depends(get_current_user)
):
    """Update current user's profile"""
    user = db.query(User).filter(User.id == current_user.id).first()
    
    if profile.name:
        user.name = profile.name
    if profile.phone:
        user.phone = profile.phone
    if profile.location:
        user.location = profile.location
    if profile.bio:
        user.bio = profile.bio
    
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    return {
        "message": "Profile updated successfully",
        "user": {
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "location": user.location,
            "bio": user.bio,
            "updated_at": user.updated_at
        }
    }
```

---

### POST /api/users/avatar
**Description:** Upload a new profile avatar

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body:**
```
file: <image file>
```

**Response:** 200 OK
```json
{
  "message": "Avatar uploaded successfully",
  "avatar_url": "https://storage.example.com/avatars/user_123.jpg"
}
```

**FastAPI Implementation:**
```python
from fastapi import File, UploadFile
import uuid
import aiofiles

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """Upload user avatar"""
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    file_extension = file.filename.split(".")[-1]
    filename = f"{current_user.id}_{uuid.uuid4()}.{file_extension}"
    file_path = f"avatars/{filename}"
    
    # Save file (adjust path as needed)
    async with aiofiles.open(f"static/{file_path}", "wb") as f:
        content = await file.read()
        await f.write(content)
    
    # Update user avatar URL
    avatar_url = f"https://yourdomain.com/static/{file_path}"
    user = db.query(User).filter(User.id == current_user.id).first()
    user.avatar_url = avatar_url
    db.commit()
    
    return {
        "message": "Avatar uploaded successfully",
        "avatar_url": avatar_url
    }
```

---

## 2. User Preferences Management

### GET /api/users/preferences
**Description:** Get user preferences (notifications, app settings, etc.)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** 200 OK
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

**FastAPI Implementation:**
```python
class UserPreferences(BaseModel):
    user_id: str
    push_notifications: bool = True
    email_notifications: bool = False
    auto_sync: bool = True
    dark_mode: bool = False
    language: str = "English"
    updated_at: datetime

@router.get("/preferences", response_model=UserPreferences)
async def get_user_preferences(current_user = Depends(get_current_user)):
    """Get user preferences"""
    prefs = db.query(Preferences).filter(Preferences.user_id == current_user.id).first()
    
    if not prefs:
        # Create default preferences
        prefs = Preferences(
            user_id=current_user.id,
            push_notifications=True,
            email_notifications=False,
            auto_sync=True,
            dark_mode=False,
            language="English"
        )
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    
    return prefs
```

---

### PUT /api/users/preferences
**Description:** Update user preferences

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "push_notifications": true,
  "email_notifications": true,
  "auto_sync": true,
  "dark_mode": false,
  "language": "English"
}
```

**Response:** 200 OK
```json
{
  "message": "Preferences updated successfully",
  "preferences": {
    "user_id": "user_123",
    "push_notifications": true,
    "email_notifications": true,
    "auto_sync": true,
    "dark_mode": false,
    "language": "English",
    "updated_at": "2026-02-27T10:05:00Z"
  }
}
```

**FastAPI Implementation:**
```python
class PreferencesUpdateRequest(BaseModel):
    push_notifications: bool | None = None
    email_notifications: bool | None = None
    auto_sync: bool | None = None
    dark_mode: bool | None = None
    language: str | None = None

@router.put("/preferences")
async def update_user_preferences(
    preferences: PreferencesUpdateRequest,
    current_user = Depends(get_current_user)
):
    """Update user preferences"""
    prefs = db.query(Preferences).filter(Preferences.user_id == current_user.id).first()
    
    if not prefs:
        prefs = Preferences(user_id=current_user.id)
        db.add(prefs)
    
    if preferences.push_notifications is not None:
        prefs.push_notifications = preferences.push_notifications
    if preferences.email_notifications is not None:
        prefs.email_notifications = preferences.email_notifications
    if preferences.auto_sync is not None:
        prefs.auto_sync = preferences.auto_sync
    if preferences.dark_mode is not None:
        prefs.dark_mode = preferences.dark_mode
    if preferences.language is not None:
        prefs.language = preferences.language
    
    prefs.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(prefs)
    
    return {
        "message": "Preferences updated successfully",
        "preferences": prefs
    }
```

---

## 3. Password Management

### POST /api/users/change-password
**Description:** Change user password

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "current_password": "oldPassword123",
  "new_password": "newPassword456"
}
```

**Response:** 200 OK
```json
{
  "message": "Password changed successfully"
}
```

**FastAPI Implementation:**
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user = Depends(get_current_user)
):
    """Change user password"""
    user = db.query(User).filter(User.id == current_user.id).first()
    
    # Verify current password
    if not pwd_context.verify(request.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Hash and save new password
    user.hashed_password = pwd_context.hash(request.new_password)
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Password changed successfully"}
```

---

## 4. Account Management

### DELETE /api/users/account
**Description:** Delete user account

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "password": "userPassword123",
  "confirmation": "DELETE"
}
```

**Response:** 200 OK
```json
{
  "message": "Account deleted successfully"
}
```

**FastAPI Implementation:**
```python
class DeleteAccountRequest(BaseModel):
    password: str
    confirmation: str

@router.delete("/account")
async def delete_account(
    request: DeleteAccountRequest,
    current_user = Depends(get_current_user)
):
    """Delete user account"""
    if request.confirmation != "DELETE":
        raise HTTPException(status_code=400, detail="Confirmation must be 'DELETE'")
    
    user = db.query(User).filter(User.id == current_user.id).first()
    
    # Verify password
    if not pwd_context.verify(request.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password")
    
    # Soft delete (recommended) or hard delete
    user.is_active = False
    user.deleted_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Account deleted successfully"}
```

---

## 5. Database Schema

### Users Table
```sql
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    location VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(255),
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### Preferences Table
```sql
CREATE TABLE preferences (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    push_notifications BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT FALSE,
    auto_sync BOOLEAN DEFAULT TRUE,
    dark_mode BOOLEAN DEFAULT FALSE,
    language VARCHAR(50) DEFAULT 'English',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);
```

---

## 6. Testing Commands

### Test Profile Endpoints
```bash
# Get profile
curl -X GET "http://localhost:8001/api/users/profile" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update profile
curl -X PUT "http://localhost:8001/api/users/profile" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "+1234567890",
    "location": "San Francisco, CA",
    "bio": "Hydroponic enthusiast"
  }'

# Get preferences
curl -X GET "http://localhost:8001/api/users/preferences" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update preferences
curl -X PUT "http://localhost:8001/api/users/preferences" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "push_notifications": true,
    "email_notifications": true,
    "dark_mode": false
  }'

# Change password
curl -X POST "http://localhost:8001/api/users/change-password" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "oldPassword123",
    "new_password": "newPassword456"
  }'
```

---

## 7. Environment Variables

Add these to your `.env` file:

```env
# File Upload Settings
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/jpg
AVATAR_UPLOAD_DIR=static/avatars

# Storage URLs
STORAGE_BASE_URL=https://yourdomain.com/static
```

---

## 8. Implementation Checklist

- [ ] Create `users` table in database
- [ ] Create `preferences` table in database
- [ ] Implement GET /api/users/profile
- [ ] Implement PUT /api/users/profile
- [ ] Implement POST /api/users/avatar
- [ ] Implement GET /api/users/preferences
- [ ] Implement PUT /api/users/preferences
- [ ] Implement POST /api/users/change-password
- [ ] Implement DELETE /api/users/account
- [ ] Set up file upload directory and permissions
- [ ] Test all endpoints with Postman/curl
- [ ] Add proper error handling and validation
- [ ] Implement rate limiting for password changes
- [ ] Add logging for security-sensitive operations

---

## 9. Security Considerations

1. **Password Requirements**: Enforce strong passwords (min 8 chars, uppercase, lowercase, numbers)
2. **Rate Limiting**: Limit password change attempts to prevent brute force
3. **File Upload**: Validate file types and scan for malware
4. **Data Privacy**: Ensure user data is encrypted at rest
5. **Audit Logging**: Log all profile/preference changes for security auditing
6. **GDPR Compliance**: Implement right to be forgotten (account deletion)

---

## Notes for Mobile App Integration

The mobile app already has:
- `PreferencesContext` that stores settings locally in AsyncStorage
- Profile editing UI in ProfileScreen
- Settings management UI in SettingsScreen

To integrate with backend:
1. Add API calls to `src/api/userApi.ts` (create this file)
2. Update PreferencesContext to sync with backend
3. Update ProfileScreen to call backend APIs
4. Add network error handling with offline support

Example userApi.ts structure:
```typescript
import { http } from "./http";

export const getUserProfile = async (token: string) => {
  const response = await http.get("/api/users/profile", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateUserProfile = async (token: string, data: any) => {
  const response = await http.put("/api/users/profile", data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
```

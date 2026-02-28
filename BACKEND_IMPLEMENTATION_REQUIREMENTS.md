# Backend Implementation Requirements for Smart Hydroponic Lettuce System

## 🎯 Overview
The mobile frontend is now complete and requires the following backend API endpoints to be fully functional. Please implement these endpoints in your FastAPI backend.

---

## 🔴 CRITICAL - Missing Endpoints (High Priority)

### 1. Dashboard Latest Metrics
**Endpoint:** `GET /dashboard/latest`

**Query Parameters:**
- `zone_id` (optional): Filter by zone (z01, z02, z03)

**Response Schema:**
```python
class DashboardMetricsResponse(BaseModel):
    zone_id: str
    zone_name: str
    plant_count: int
    harvest_ready_count: int
    avg_growth_pct: float
    temperature_c: float
    humidity_pct: float
    ec_ms_cm: float
    ph: float
    last_updated: str  # ISO 8601 datetime
```

**Implementation Notes:**
- Query the latest sensor readings from your IoT sensor table
- Count plants by zone and harvest status
- Calculate average growth percentage from plant records
- Return most recent sensor data with timestamp

**Example Response:**
```json
{
  "zone_id": "z01",
  "zone_name": "Zone Z01",
  "plant_count": 24,
  "harvest_ready_count": 5,
  "avg_growth_pct": 78.5,
  "temperature_c": 23.5,
  "humidity_pct": 62.0,
  "ec_ms_cm": 1.4,
  "ph": 6.2,
  "last_updated": "2026-02-27T13:45:00Z"
}
```

---

### 2. IoT Sensor Data Ingestion
**Endpoint:** `POST /infer/iot/ingest`

**Request Body:**
```python
class IoTSensorPayload(BaseModel):
    zone_id: str
    temperature_c: float
    humidity_pct: float
    ec_ms_cm: float
    ph: float
    timestamp: Optional[str] = None  # ISO 8601, defaults to current time
```

**Response:**
```python
{
  "ok": true,
  "sensor_id": "sensor_12345",
  "recorded_at": "2026-02-27T13:45:00Z"
}
```

**Implementation Notes:**
- Store sensor readings in your database
- If timestamp is not provided, use server's current time
- Validate sensor value ranges:
  - Temperature: 15-35°C
  - Humidity: 30-90%
  - EC: 0.5-3.0 mS/cm
  - pH: 4.0-8.0
- Consider triggering alerts if values are out of optimal range

---

### 3. Save Growth Prediction
**Endpoint:** `POST /growth/predict/save`

**Request Body:**
```python
class SaveGrowthPredictionPayload(BaseModel):
    plant_id: str
    date_label: str
    predicted_weight_g: float
    predicted_area_cm2: float
    predicted_diameter_cm: float
    change_pct: float
    series: Optional[dict] = None  # {"labels": [...], "actual": [...], "predicted": [...]}
```

**Response:**
```python
{
  "ok": true,
  "prediction_id": "pred_12345",
  "saved_at": "2026-02-27T13:45:00Z"
}
```

**Implementation Notes:**
- Save the growth prediction to database
- Link prediction to the plant_id
- Store the series data for historical charts
- Used after user runs growth forecasting and wants to save results

---

### 4. Delete Plant
**Endpoint:** `DELETE /plants/{plant_id}`

**Path Parameters:**
- `plant_id`: The unique identifier of the plant to delete

**Response:**
```python
{
  "ok": true,
  "plant_id": "p01",
  "deleted_at": "2026-02-27T13:45:00Z"
}
```

**Implementation Notes:**
- Soft delete or hard delete based on your requirements
- Consider cascade deletion or marking related records as deleted
- Ensure proper authorization (user can only delete their own plants)
- Used when user wants to remove a plant from their growth log

---

## 🟡 RECOMMENDED - Enhanced Endpoints (Medium Priority)

### 3. Activity History Endpoint
**Endpoint:** `GET /activities/history`

**Query Parameters:**
- `zone_id` (optional): Filter by zone
- `type` (optional): Filter by activity type (weight_scan, growth_forecast, sensor_update, harvest, system, disease_check)
- `limit` (optional, default: 50): Number of records to return
- `offset` (optional, default: 0): Pagination offset

**Response Schema:**
```python
class ActivityItem(BaseModel):
    id: str
    type: str  # weight_scan, growth_forecast, sensor_update, etc.
    title: str
    description: str
    timestamp: str  # ISO 8601
    zone: Optional[str]
    status: Optional[str]  # success, warning, info

class ActivityHistoryResponse(BaseModel):
    activities: List[ActivityItem]
    total_count: int
    has_more: bool
```

**Implementation Notes:**
- Log all major system events (scans, forecasts, sensor updates, harvests)
- Store in an activities/events table
- Include filtering and pagination support

---

### 4. User Profile Management
**Endpoint:** `GET /users/profile`
**Endpoint Update:** `PUT /users/profile`

**GET Response:**
```python
class UserProfile(BaseModel):
    user_id: str
    name: str
    email: str
    phone: Optional[str]
    location: Optional[str]
    bio: Optional[str]
    avatar_url: Optional[str]
    stats: UserStats

class UserStats(BaseModel):
    plants_monitored: int
    forecasts_made: int
    weight_scans: int
```

**PUT Request Body:**
```python
{
  "name": "John Doe",
  "phone": "+1 555 000 0000",
  "location": "California, USA",
  "bio": "Hydroponic farming enthusiast"
}
```

---

## 🟢 OPTIONAL - Future Enhancements (Low Priority)

### 5. Push Notifications
**Endpoint:** `POST /notifications/register-device`

Register mobile device tokens for push notifications.

### 6. Real-time Sensor WebSocket
**Endpoint:** `WS /ws/sensors/{zone_id}`

Provide real-time sensor data streaming via WebSocket.

### 7. Image Storage Endpoints
**Endpoint:** `POST /images/upload`
**Endpoint:** `GET /images/{image_id}`

Dedicated image storage and retrieval (if not already implemented).

---

## 📋 Database Schema Suggestions

### Sensor Readings Table
```sql
CREATE TABLE sensor_readings (
    id SERIAL PRIMARY KEY,
    zone_id VARCHAR(10) NOT NULL,
    temperature_c FLOAT NOT NULL,
    humidity_pct FLOAT NOT NULL,
    ec_ms_cm FLOAT NOT NULL,
    ph FLOAT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sensor_zone_time ON sensor_readings(zone_id, timestamp DESC);
```

### Activities Log Table
```sql
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    activity_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    zone_id VARCHAR(10),
    user_id INTEGER REFERENCES users(id),
    status VARCHAR(20),
    metadata JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activities_type_time ON activities(activity_type, timestamp DESC);
CREATE INDEX idx_activities_zone ON activities(zone_id);
```

### User Profiles Extension
```sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN location VARCHAR(100);
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);
```

---

## 🔧 Implementation Priority

### Phase 1 (Critical - Implement Immediately)
1. ✅ `GET /dashboard/latest` - Dashboard will show real data
2. ✅ `POST /infer/iot/ingest` - Enable sensor data submission

### Phase 2 (Important - Implement Soon)
3. `GET /activities/history` - Activity history screen
4. `GET /users/profile` + `PUT /users/profile` - User profile management

### Phase 3 (Enhancement - Implement Later)
5. Push notifications system
6. WebSocket for real-time data
7. Advanced analytics endpoints

---

## 🧪 Testing Endpoints

Once implemented, test with these curl commands:

### Test Dashboard
```bash
curl -X GET "http://172.20.10.12:8001/dashboard/latest?zone_id=z01" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test IoT Ingestion
```bash
curl -X POST "http://172.20.10.12:8000/infer/iot/ingest" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "zone_id": "z01",
    "temperature_c": 23.5,
    "humidity_pct": 62.0,
    "ec_ms_cm": 1.4,
    "ph": 6.2
  }'
```

---

## 📱 Frontend Status

### ✅ Completed Features
- Authentication (Login, Register, Google OAuth)
- Dashboard with zone selection
- IoT Sensor Dashboard with manual input
- Weight Estimation (8 complete screens)
- Growth Forecasting
- Plant Lists with filters
- Plant Details with history
- History Screen with activity filters
- Settings Screen with preferences
- Profile Screen with edit mode
- Scan Screen hub

### ⚠️ Features Using Mock Data (Until Backend Ready)
- Dashboard metrics (falls back to mock)
- IoT sensor display (falls back to mock)
- Activity history (using mock data)
- User profile stats (using mock data)

### 🔄 API Integration Points Already Working
- ✅ POST /auth/register
- ✅ POST /auth/login
- ✅ POST /auth/google
- ✅ GET /auth/me
- ✅ POST /auth/refresh
- ✅ GET /plants
- ✅ GET /infer/plants/{plant_id}
- ✅ POST /infer/today (weight estimation)
- ✅ POST /infer/forecast (growth forecasting)
- ✅ POST /infer/weights/save
- ✅ POST /growth/predict/save (frontend ready, backend needed)
- ✅ DELETE /plants/{plant_id} (frontend ready, backend needed)

---

## 🚀 Quick Start Implementation Guide

### Step 1: Add Dashboard Endpoint
```python
# main.py or dashboard_routes.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

router = APIRouter()

@router.get("/dashboard/latest")
async def get_dashboard_latest(
    zone_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Query latest sensor data
    latest_sensor = db.query(SensorReading)\
        .filter(SensorReading.zone_id == zone_id if zone_id else True)\
        .order_by(SensorReading.timestamp.desc())\
        .first()
    
    # Count plants
    plant_count = db.query(Plant)\
        .filter(Plant.zone_id == zone_id if zone_id else True)\
        .count()
    
    # Count harvest ready
    harvest_ready = db.query(Plant)\
        .filter(Plant.status == "HARVEST_READY")\
        .filter(Plant.zone_id == zone_id if zone_id else True)\
        .count()
    
    # Calculate average growth
    plants = db.query(Plant)\
        .filter(Plant.zone_id == zone_id if zone_id else True)\
        .all()
    avg_growth = sum(p.growth_pct for p in plants) / len(plants) if plants else 0
    
    return {
        "zone_id": zone_id or "all",
        "zone_name": f"Zone {zone_id.upper()}" if zone_id else "All Zones",
        "plant_count": plant_count,
        "harvest_ready_count": harvest_ready,
        "avg_growth_pct": round(avg_growth, 1),
        "temperature_c": latest_sensor.temperature_c if latest_sensor else 0,
        "humidity_pct": latest_sensor.humidity_pct if latest_sensor else 0,
        "ec_ms_cm": latest_sensor.ec_ms_cm if latest_sensor else 0,
        "ph": latest_sensor.ph if latest_sensor else 0,
        "last_updated": latest_sensor.timestamp.isoformat() if latest_sensor else datetime.now().isoformat()
    }
```

### Step 2: Add IoT Ingestion Endpoint
```python
# iot_routes.py

@router.post("/infer/iot/ingest")
async def ingest_iot_data(
    payload: IoTSensorPayload,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sensor_reading = SensorReading(
        zone_id=payload.zone_id,
        temperature_c=payload.temperature_c,
        humidity_pct=payload.humidity_pct,
        ec_ms_cm=payload.ec_ms_cm,
        ph=payload.ph,
        timestamp=datetime.fromisoformat(payload.timestamp) if payload.timestamp else datetime.now()
    )
    
    db.add(sensor_reading)
    db.commit()
    db.refresh(sensor_reading)
    
    return {
        "ok": True,
        "sensor_id": str(sensor_reading.id),
        "recorded_at": sensor_reading.timestamp.isoformat()
    }
```

### Step 3: Add Growth Prediction Save Endpoint
```python
# growth_routes.py

@router.post("/growth/predict/save")
async def save_growth_prediction(
    payload: SaveGrowthPredictionPayload,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prediction = GrowthPrediction(
        plant_id=payload.plant_id,
        user_id=current_user["user_id"],
        date_label=payload.date_label,
        predicted_weight_g=payload.predicted_weight_g,
        predicted_area_cm2=payload.predicted_area_cm2,
        predicted_diameter_cm=payload.predicted_diameter_cm,
        change_pct=payload.change_pct,
        series_data=payload.series,  # Store as JSON
        created_at=datetime.now()
    )
    
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    
    return {
        "ok": True,
        "prediction_id": str(prediction.id),
        "saved_at": prediction.created_at.isoformat()
    }
```

### Step 4: Add Plant Delete Endpoint
```python
# plants_routes.py

@router.delete("/plants/{plant_id}")
async def delete_plant(
    plant_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plant = db.query(Plant).filter(
        Plant.plant_id == plant_id,
        Plant.user_id == current_user["user_id"]
    ).first()
    
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    
    # Option 1: Soft delete
    plant.deleted_at = datetime.now()
    plant.status = "DELETED"
    
    # Option 2: Hard delete (uncomment if preferred)
    # db.delete(plant)
    
    db.commit()
    
    return {
        "ok": True,
        "plant_id": plant_id,
        "deleted_at": datetime.now().isoformat()
    }
```

---

## 📞 Support

If you need clarification on any endpoint or response format, please check:
1. Frontend API client files in `mobile-app/src/api/`
2. TypeScript type definitions for expected response shapes
3. Existing working endpoints as reference

---

## ✅ Checklist for Backend Developer

### Phase 1 - Critical (Required for Full Functionality)
- [ ] Implement `GET /dashboard/latest`
- [ ] Implement `POST /infer/iot/ingest`
- [ ] Implement `POST /growth/predict/save`
- [ ] Implement `DELETE /plants/{plant_id}`
- [ ] Create sensor_readings table (if not exists)
- [ ] Create growth_predictions table (if not exists)
- [ ] Test dashboard endpoint with Postman
- [ ] Test IoT ingestion endpoint
- [ ] Test growth prediction save endpoint
- [ ] Test plant deletion endpoint
- [ ] Verify CORS settings for mobile app
- [ ] Check authentication headers are working

### Phase 2 - Optional Enhancements
- [ ] Implement activity history endpoint
- [ ] Implement user profile endpoints (GET/PUT /api/users/profile)
- [ ] Implement user preferences endpoints
- [ ] Add cascade deletion for plant-related data
- [ ] Add soft delete for audit trail
- [ ] Implement pagination for plant lists

---

**Note:** The frontend is now fully functional and will gracefully fall back to mock data if endpoints are not available. Priority should be given to Phase 1 endpoints to enable full backend integration.

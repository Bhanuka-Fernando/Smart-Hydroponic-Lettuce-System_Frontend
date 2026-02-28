# Backend Implementation Prompt - Plant CRUD & Dashboard

## Overview
Please implement the following critical FastAPI endpoints for the Smart Hydroponic Lettuce System. The frontend is already complete and needs these backend endpoints to function properly.

---

## 1. Dashboard Latest Metrics

**Endpoint:** `GET /dashboard/latest`

**Query Parameters:**
- `zone_id` (optional): Filter by zone (z01, z02, z03)

**Response:**
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

**Implementation Requirements:**
- Query latest sensor readings from IoT sensor table
- Count total plants in the specified zone (or all zones if not specified)
- Count plants with status "HARVEST_READY"
- Calculate average growth percentage from all plants in zone
- Return the most recent sensor data (temperature, humidity, EC, pH)

---

## 2. IoT Sensor Data Ingestion

**Endpoint:** `POST /infer/iot/ingest`

**Request Body:**
```json
{
  "zone_id": "z01",
  "temperature_c": 23.5,
  "humidity_pct": 62.0,
  "ec_ms_cm": 1.4,
  "ph": 6.2,
  "timestamp": "2026-02-27T13:45:00Z"  // optional
}
```

**Response:**
```json
{
  "ok": true,
  "sensor_id": "sensor_12345",
  "recorded_at": "2026-02-27T13:45:00Z"
}
```

**Implementation Requirements:**
- Store sensor readings in database
- If timestamp not provided, use server's current time
- Validate sensor value ranges:
  - Temperature: 15-35°C
  - Humidity: 30-90%
  - EC: 0.5-3.0 mS/cm
  - pH: 4.0-8.0

---

## 3. Save Growth Prediction

**Endpoint:** `POST /growth/predict/save`

**Request Body:**
```json
{
  "plant_id": "P001",
  "age_days": 14,
  "date_label": "Tomorrow",
  "predicted_weight_g": 125.5,
  "predicted_area_cm2": 245.3,
  "predicted_diameter_cm": 18.2,
  "change_pct": 5.2,
  "series": {
    "labels": ["Today", "D+1", "D+2", "D+3"],
    "actual": [120.0, 120.0, 120.0, 120.0],
    "predicted": [120.0, 125.5, 131.2, 137.3]
  }
}
```

**Response:**
```json
{
  "ok": true,
  "prediction_id": "pred_12345",
  "plant_id": "P001",
  "saved_at": "2026-02-27T13:45:00Z"
}
```

**Implementation Requirements:**
- Create a `growth_predictions` table (if not exists):
  - id (primary key)
  - plant_id (string, indexed)
  - user_id (foreign key to users table)
  - age_days (integer)
  - date_label (string)
  - predicted_weight_g (float)
  - predicted_area_cm2 (float)
  - predicted_diameter_cm (float)
  - change_pct (float)
  - series_data (JSON/JSONB)
  - created_at (timestamp)
- **Create or update plant record** in `plants` table:
  - If plant_id doesn't exist, create new plant record with:
    - plant_id (from request)
    - user_id (from authenticated user)
    - age_days (from request)
    - name (default: "Plant {plant_id}")
    - estimated_weight_g (from predicted_weight_g)
    - area_cm2 (from predicted_area_cm2)
    - diameter_cm (from predicted_diameter_cm)
    - status: "NOT_READY" (default)
    - created_at (timestamp)
  - If plant_id exists, update with latest predictions
- Link prediction to authenticated user
- Store the series data as JSON for historical chart display
- This endpoint serves as the primary way to create/update plant records

---

## 4. Delete Plant

**Endpoint:** `DELETE /plants/{plant_id}`

**Path Parameters:**
- `plant_id`: The unique identifier of the plant to delete

**Response:**
```json
{
  "ok": true,
  "plant_id": "p01",
  "deleted_at": "2026-02-27T13:45:00Z"
}
```

**Implementation Requirements:**
- Ensure user can only delete their own plants (check user_id)
- Return 404 if plant not found or doesn't belong to user
- Choose deletion strategy:
  - **Soft Delete (Recommended):** Add `deleted_at` timestamp and `status = "DELETED"`
  - **Hard Delete:** Permanently remove from database
- Consider how to handle related records:
  - Weight measurements
  - Growth predictions
  - Activity history entries

---

## Database Schema Suggestions

### sensor_readings table
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

### growth_predictions table
```sql
CREATE TABLE growth_predictions (
    id SERIAL PRIMARY KEY,
    plant_id VARCHAR(50) NOT NULL,
    user_id INTEGER NOT NULL,
    age_days INTEGER,
    date_label VARCHAR(50),
    predicted_weight_g FLOAT,
    predicted_area_cm2 FLOAT,
    predicted_diameter_cm FLOAT,
    change_pct FLOAT,
    series_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_prediction_plant ON growth_predictions(plant_id);
CREATE INDEX idx_prediction_user ON growth_predictions(user_id);
```

### plants table (updated)
```sql
CREATE TABLE IF NOT EXISTS plants (
    id SERIAL PRIMARY KEY,
    plant_id VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    name VARCHAR(100),
    age_days INTEGER,
    area_cm2 FLOAT,
    diameter_cm FLOAT,
    estimated_weight_g FLOAT,
    status VARCHAR(20) DEFAULT 'NOT_READY',
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_plant_id ON plants(plant_id);
CREATE INDEX idx_plant_user ON plants(user_id);
CREATE INDEX idx_plant_status ON plants(status, deleted_at);
```

**Note:** Plants are now created via the growth prediction save endpoint, not as a separate operation.

---

## Testing Checklist

After implementation, test with these curl commands:

### Test Dashboard
```bash
curl -X GET "http://localhost:8000/dashboard/latest?zone_id=z01" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test IoT Ingestion
```bash
curl -X POST "http://localhost:8000/infer/iot/ingest" \
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

### Test Growth Prediction Save
```bash
curl -X POST "http://localhost:8000/growth/predict/save" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plant_id": "P001",
    "age_days": 14,
    "date_label": "Tomorrow",
    "predicted_weight_g": 125.5,
    "predicted_area_cm2": 245.3,
    "predicted_diameter_cm": 18.2,
    "change_pct": 5.2,
    "series": {
      "labels": ["Today", "D+1"],
      "actual": [120.0, 120.0],
      "predicted": [120.0, 125.5]
    }
  }'
```

### Test Plant Deletion
```bash
curl -X DELETE "http://localhost:8000/plants/p01" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Priority Order

1. **GET /dashboard/latest** - Dashboard screen currently showing 404 errors
2. **DELETE /plants/{plant_id}** - Users can't remove unwanted plants
3. **POST /growth/predict/save** - Growth predictions can't be saved
4. **POST /infer/iot/ingest** - Manual sensor input not persisting

---

## Notes

- All endpoints require authentication (Bearer token in Authorization header)
- Ensure CORS is properly configured for mobile app access
- Return proper HTTP status codes (200, 201, 404, 401, 422, etc.)
- Validate all input data before processing
- Log important operations for debugging
- Consider adding rate limiting for IoT ingestion endpoint

---

## Frontend Context

The mobile app is built with React Native and is already making requests to these endpoints:
- `/dashboard/latest` is called on DashboardScreen mount and when zone changes
- `/infer/iot/ingest` is called when user manually enters sensor readings
- `/growth/predict/save` is called when user taps "Save" on growth prediction results
- `/plants/{plant_id}` DELETE is called when user taps trash icon in plant list

Current error in logs:
```
ERROR Failed to fetch dashboard: [Error: 'Not Found']
INFO: 172.20.10.1:56196 - 'GET /dashboard/latest?zone_id=z01 HTTP/1.1' 404 Not Found
```

# Backend API Specification for Ozu Admin Portal

This document describes the API endpoints your FastAPI backend needs to implement for the admin portal to work.

---

## 🔌 HTTP Endpoints

### GET /riders/live

Returns a list of all active riders with their current location and status.

**Request:**
```http
GET /riders/live
Accept: application/json
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "phone": "+1234567890",
    "zone": "North Delhi",
    "status": "available",
    "lat": 28.6139,
    "lng": 77.2090,
    "headingDeg": 45,
    "activeShipmentId": null,
    "updatedAt": "2025-01-18T10:30:00Z"
  },
  {
    "id": 2,
    "name": "Jane Smith",
    "phone": "+1234567891",
    "zone": "South Delhi",
    "status": "in_transit",
    "lat": 28.5355,
    "lng": 77.3910,
    "headingDeg": 120,
    "activeShipmentId": "SHP-12345",
    "updatedAt": "2025-01-18T10:32:15Z"
  }
]
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string \| number | ✅ | Unique rider identifier |
| `name` | string | ✅ | Rider's full name |
| `phone` | string | ❌ | Rider's phone number |
| `zone` | string | ❌ | Assigned delivery zone |
| `status` | string | ✅ | Rider status (see below) |
| `lat` | number | ✅ | Latitude coordinate |
| `lng` | number | ✅ | Longitude coordinate |
| `headingDeg` | number | ❌ | GPS bearing in degrees (0-360) |
| `activeShipmentId` | string \| number \| null | ❌ | Current shipment ID if any |
| `updatedAt` | string | ❌ | ISO 8601 timestamp of last update |

**Status Values:**
- `"available"` - Rider is free and can accept new deliveries (🟢 Green marker)
- `"assigned"` - Rider has been assigned a delivery but hasn't started (🟡 Yellow marker)
- `"in_transit"` - Rider is currently on a delivery (🔴 Red marker)
- `"offline"` - Rider is not active (⚫ Gray marker)

---

## 🔌 WebSocket Endpoint

### Socket.IO: /ws/riders

Real-time updates for rider location and status changes.

**Connection:**
```javascript
// Frontend connects to:
io('http://localhost:8000', {
  path: '/ws/riders',
  transports: ['websocket'],
  withCredentials: true
})
```

**Events to Emit (Server → Client):**

#### Event: `rider_update`

Emitted when a rider's location or status changes.

**Payload:**
```json
{
  "id": 1,
  "name": "John Doe",
  "phone": "+1234567890",
  "zone": "North Delhi",
  "status": "in_transit",
  "lat": 28.6150,
  "lng": 77.2100,
  "headingDeg": 50,
  "activeShipmentId": "SHP-99999",
  "updatedAt": "2025-01-18T10:35:00Z"
}
```

**When to emit:**
- Rider location updates (from GPS tracking)
- Rider status changes (available → assigned → in_transit → available)
- Rider accepts/completes a delivery
- Any field changes in the rider object

**Note:** The frontend automatically merges this update with existing rider data.

---

## 🔐 CORS Configuration

Your FastAPI backend must allow CORS from the frontend origin.

**FastAPI Example:**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Development
        "http://localhost:5173",  # Vite alternative port
        # Add your production domain here
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🧪 Testing Endpoints

### Test with cURL

```bash
# Test HTTP endpoint
curl http://localhost:8000/riders/live

# Expected: JSON array of riders
```

### Test with Python

```python
import requests

response = requests.get("http://localhost:8000/riders/live")
print(response.json())
```

---

## 📋 Implementation Checklist

### HTTP Endpoint
- [ ] Implement `GET /riders/live`
- [ ] Return JSON array of rider objects
- [ ] Include required fields: `id`, `name`, `status`, `lat`, `lng`
- [ ] Optional fields: `phone`, `zone`, `headingDeg`, `activeShipmentId`, `updatedAt`
- [ ] Test endpoint returns valid JSON

### WebSocket
- [ ] Set up Socket.IO server at `/ws/riders` path
- [ ] Emit `rider_update` event on location changes
- [ ] Emit `rider_update` event on status changes
- [ ] Test WebSocket connection from frontend

### CORS
- [ ] Enable CORS for frontend origin
- [ ] Allow credentials
- [ ] Allow all methods and headers

### Data
- [ ] Connect to your database (PostgreSQL)
- [ ] Query riders table with location and status
- [ ] Format response to match API spec
- [ ] Handle GPS coordinates correctly (lat/lng as floats)

---

## 📖 Example FastAPI Implementation

### HTTP Endpoint

```python
from fastapi import FastAPI, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

app = FastAPI()

class Rider(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None
    zone: Optional[str] = None
    status: str  # 'available', 'assigned', 'in_transit', 'offline'
    lat: float
    lng: float
    headingDeg: Optional[float] = None
    activeShipmentId: Optional[str] = None
    updatedAt: Optional[datetime] = None

@app.get("/riders/live", response_model=List[Rider])
async def get_live_riders():
    # TODO: Query your database
    # Example:
    # riders = await db.query(Rider).filter(Rider.status != 'offline').all()
    
    # Mock data for testing:
    return [
        {
            "id": 1,
            "name": "John Doe",
            "phone": "+1234567890",
            "zone": "North",
            "status": "available",
            "lat": 28.6139,
            "lng": 77.2090,
            "updatedAt": datetime.now().isoformat()
        }
    ]
```

### WebSocket with Socket.IO

```python
import socketio
from fastapi import FastAPI

app = FastAPI()
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, app, socketio_path='/ws/riders')

@sio.event
async def connect(sid, environ):
    print(f"Client {sid} connected")

@sio.event
async def disconnect(sid):
    print(f"Client {sid} disconnected")

# Emit rider updates from your tracking system
async def emit_rider_update(rider_data):
    await sio.emit('rider_update', rider_data)

# Use this function wherever you track rider updates:
# await emit_rider_update({
#     "id": 1,
#     "status": "in_transit",
#     "lat": 28.6150,
#     "lng": 77.2100,
#     ...
# })
```

---

## 🚀 Quick Start (Backend Developer)

1. **Install Socket.IO for Python:**
   ```bash
   pip install python-socketio
   ```

2. **Implement the endpoints above**

3. **Test with cURL/Postman:**
   ```bash
   curl http://localhost:8000/riders/live
   ```

4. **Run your FastAPI server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

5. **Verify CORS is working** by checking browser console in the frontend

---

## 📞 Questions?

If you need help implementing these endpoints or have questions about the data format, let me know!

**Common questions:**
- Q: Can I use different field names?
- A: Yes, but you'll need to update `frontend/src/types/rider.ts` to match

- Q: Can I use a different WebSocket path?
- A: Yes, update `frontend/src/lib/socket.ts` with the new path

- Q: Do I need to implement polling if I have WebSocket?
- A: No, but it's recommended as a fallback. The frontend handles both automatically.



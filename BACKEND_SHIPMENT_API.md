# Backend API Specification for Admin Shipment System

## Overview
This document outlines the backend API endpoints required for the Admin Shipment Creation and Delivery Boy Assignment system.

---

## Required Endpoints

### 1. Get Available Delivery Boys

**Endpoint:** `GET /riders/available`

**Description:** Returns a list of all available delivery boys for the admin to select from when sending to a specific rider.

**Response:**
```json
[
  {
    "id": "rider_456",
    "name": "Rahul Kumar",
    "mobile": "+91 9988776655",
    "zone": "North Delhi",
    "isAvailable": true
  },
  {
    "id": "rider_789",
    "name": "Amit Sharma",
    "mobile": "+91 9876543211",
    "zone": "South Delhi",
    "isAvailable": true
  }
]
```

---

### 2. Create Shipment and Notify Delivery Boys

**Endpoint:** `POST /shipments/create`

**Description:** Creates a new shipment request and sends WhatsApp notifications to either:
- All available delivery boys (broadcast mode)
- A specific delivery boy (if `specificRiderId` is provided)

**Request Body (Broadcast to All):**
```json
{
  "adminLocation": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "address": "Shop 12, Connaught Place, New Delhi"
  },
  "adminMobile": "+91 9876543210",
  "customer": {
    "name": "John Doe",
    "mobile": "+91 9123456789",
    "locationLink": "https://maps.google.com/?q=28.6139,77.2090",
    "address": "123 Main Street, Sector 18, Noida",
    "landmark": "Near Metro Station",
    "price": 50
  }
}
```

**Request Body (Send to Specific Rider):**
```json
{
  "adminLocation": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "address": "Shop 12, Connaught Place, New Delhi"
  },
  "adminMobile": "+91 9876543210",
  "customer": {
    "name": "John Doe",
    "mobile": "+91 9123456789",
    "locationLink": "https://maps.google.com/?q=28.6139,77.2090",
    "address": "123 Main Street, Sector 18, Noida",
    "landmark": "Near Metro Station",
    "price": 50
  },
  "specificRiderId": "rider_456"
}
```

**Response:**
```json
{
  "id": "shipment_123",
  "status": "pending",
  "createdAt": "2025-10-21T10:30:00Z",
  "notifiedRiders": [
    {
      "riderId": "rider_456",
      "riderName": "Rahul Kumar",
      "riderMobile": "+91 9988776655",
      "notificationSent": true
    }
  ]
}
```

**WhatsApp Message to Delivery Boys (Initial):**
```
🚀 New Delivery Request!

📍 Pickup: [Admin Address]
📞 Shop Contact: [Admin Mobile]

📦 Delivery: [Customer Landmark] (Near Metro Station)
💰 Delivery Fee: ₹50

Reply:
✅ Type "ACCEPT [shipment_id]" to accept
❌ Type "DECLINE [shipment_id]" to decline

⏰ First to accept gets the job!
```

**Backend Logic:**
1. If `specificRiderId` is provided:
   - Send WhatsApp only to that specific rider
   - **CRITICAL:** Create `shipment_responses` record for that rider:
     ```sql
     INSERT INTO shipment_responses (shipment_id, rider_id, response, timestamp)
     VALUES (shipment_id, specificRiderId, 'pending', NOW());
     ```
   - Frontend expects this record to display "Request sent to [RiderName]"
   
2. If `specificRiderId` is NOT provided (Broadcast Mode):
   - Query available delivery boys (is_available = true)
   - **Sort by distance** from admin location (nearest first)
   - **Select top 3** nearest available riders
   - Send WhatsApp to these 3 riders only
   - Create `shipment_responses` records for ALL 3 notified riders:
     ```sql
     -- For each of the 3 riders
     INSERT INTO shipment_responses (shipment_id, rider_id, response, timestamp)
     VALUES (shipment_id, rider_id, 'pending', NOW());
     ```

**Smart Rider Selection Query:**
```sql
-- Get top 3 nearest available riders
SELECT id, name, mobile, zone, lat, lng,
       (6371 * acos(cos(radians(?)) * cos(radians(lat)) * 
        cos(radians(lng) - radians(?)) + 
        sin(radians(?)) * sin(radians(lat)))) AS distance
FROM users
WHERE user_type = 'rider' 
  AND is_available = true
  AND lat IS NOT NULL 
  AND lng IS NOT NULL
ORDER BY distance ASC
LIMIT 3;
```

**Parameters:**
- First ?, third ?: admin_latitude
- Second ?: admin_longitude

**Why Top 3?**
- Faster delivery (nearest riders)
- Better acceptance rate
- Less notification spam
- Automatic load balancing

**Complete Backend Example:**
```python
@app.post("/shipments/create")
async def create_shipment(data: ShipmentCreate, db: Session = Depends(get_db)):
    # Create shipment record
    shipment = Shipment(
        id=generate_id(),
        admin_mobile=data.adminMobile,
        admin_lat=data.adminLocation.latitude,
        admin_lng=data.adminLocation.longitude,
        customer_name=data.customer.name,
        # ... other fields
        status="pending"
    )
    db.add(shipment)
    db.commit()
    
    if data.specificRiderId:
        # SPECIFIC RIDER MODE
        rider = db.query(User).filter(User.id == data.specificRiderId).first()
        if not rider:
            raise HTTPException(404, "Rider not found")
        
        # Send WhatsApp to specific rider
        send_whatsapp(rider.mobile, shipment_message)
        
        # CRITICAL: Create shipment_response record
        response_record = ShipmentResponse(
            shipment_id=shipment.id,
            rider_id=rider.id,
            response="pending",
            timestamp=datetime.now()
        )
        db.add(response_record)
        db.commit()
        
        return {
            "id": shipment.id,
            "notifiedRiders": [{
                "riderId": rider.id,
                "riderName": rider.name,
                "riderMobile": rider.mobile
            }]
        }
    
    else:
        # BROADCAST MODE - Get top 3 nearest available riders
        distance = (6371 * func.acos(...)).label('distance')
        
        riders = db.query(User, distance).filter(
            User.user_type == 'rider',
            User.is_available == True,
            User.lat.isnot(None)
        ).order_by(distance).limit(3).all()
        
        notified_riders = []
        for rider, dist in riders:
            # Send WhatsApp
            send_whatsapp(rider.mobile, shipment_message)
            
            # Create shipment_response record
            response_record = ShipmentResponse(
                shipment_id=shipment.id,
                rider_id=rider.id,
                response="pending",
                timestamp=datetime.now()
            )
            db.add(response_record)
            
            notified_riders.append({
                "riderId": rider.id,
                "riderName": rider.name,
                "riderMobile": rider.mobile
            })
        
        db.commit()
        
        return {
            "id": shipment.id,
            "notifiedRiders": notified_riders
        }
```

---

### 3. Handle Delivery Boy Response (Accept/Decline)

**Endpoint:** `POST /shipments/:shipmentId/respond`

**Description:** Called when a delivery boy accepts or declines via WhatsApp webhook. **CRITICAL:** When accepted, rider must be marked as unavailable to prevent them from receiving future requests until they complete this delivery.

**Request Body:**
```json
{
  "riderId": "rider_456",
  "response": "accepted",  // or "declined"
  "timestamp": "2025-10-21T10:35:00Z"
}
```

**Backend Actions (if accepted and first to accept):**
1. ✅ Update shipment: `status = 'assigned'`, `assigned_rider_id = rider_id`
2. ✅ Update shipment_responses: `response = 'accepted'`
3. ✅ **Mark rider unavailable:** `UPDATE users SET is_available = false WHERE id = rider_id`
4. ✅ Send full customer details to accepted rider via WhatsApp
5. ✅ Send "already assigned" message to other pending riders

**Response (if accepted):**
```json
{
  "status": "accepted",
  "message": "Shipment assigned to rider",
  "customerDetails": {
    "name": "John Doe",
    "mobile": "+91 9123456789",
    "fullLocation": {
      "latitude": 28.6139,
      "longitude": 77.2090,
      "address": "123 Main Street, Sector 18, Noida"
    }
  }
}
```

**WhatsApp Message to Accepted Delivery Boy:**
```
✅ Shipment Accepted!

📍 Pickup Location:
[Admin Address]
📞 Shop: [Admin Mobile]

📦 Customer Details:
Name: John Doe
📞 Mobile: +91 9123456789
📍 Location: 123 Main Street, Sector 18, Noida
🗺️ Google Maps: [clickable link]

💰 You'll earn: ₹50

Start navigation and call customer if needed!
```

**Response (if declined):**
```json
{
  "status": "declined",
  "message": "Response recorded"
}
```

**WhatsApp Message to Other Delivery Boys (after one accepts):**
```
❌ Shipment Already Assigned

This delivery has been taken by another rider.
Stay tuned for more requests!
```

---

### 4. Get Delivery Boy Responses

**Endpoint:** `GET /shipments/:shipmentId/responses`

**Description:** Fetches all delivery boy responses (pending, accepted, declined) for the admin dashboard.

**Response:**
```json
{
  "shipmentId": "shipment_123",
  "status": "accepted",  // pending, accepted, declined
  "responses": [
    {
      "riderId": "rider_456",
      "riderName": "Rahul Kumar",
      "riderMobile": "+91 9988776655",
      "status": "accepted",
      "timestamp": "2025-10-21T10:35:00Z"
    },
    {
      "riderId": "rider_789",
      "riderName": "Amit Sharma",
      "riderMobile": "+91 9876543211",
      "status": "declined",
      "timestamp": "2025-10-21T10:33:00Z"
    },
    {
      "riderId": "rider_101",
      "riderName": "Vijay Singh",
      "riderMobile": "+91 9765432109",
      "status": "pending",
      "timestamp": "2025-10-21T10:30:00Z"
    }
  ],
  "acceptedRiderId": "rider_456"  // null if none accepted yet
}
```

---

### 5. Get Rider Live Location

**Endpoint:** `GET /riders/:riderId/location`

**Description:** Returns the current live location of a delivery boy (used for real-time tracking after acceptance).

**Response:**
```json
{
  "riderId": "rider_456",
  "name": "Rahul Kumar",
  "mobile": "+91 9988776655",
  "lat": 28.6150,
  "lng": 77.2100,
  "heading": 45,
  "speed": 25,
  "lastUpdated": "2025-10-21T10:40:00Z"
}
```

---

### 6. Get Latest Active Shipment for Admin

**Endpoint:** `GET /shipments/latest?adminMobile={mobile}`

**Description:** Returns the most recent active shipment for a specific admin. Used to restore shipment state after page refresh.

**Query Parameters:**
- `adminMobile` (required) - Mobile number of the admin

**Example Request:**
```
GET /shipments/latest?adminMobile=%2B919876543210
```

**Response (if active shipment exists):**
```json
{
  "id": "shipment_123",
  "adminLocation": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "address": "Shop 12, Connaught Place, New Delhi"
  },
  "adminMobile": "+91 9876543210",
  "customer": {
    "name": "John Doe",
    "mobile": "+91 9123456789",
    "locationLink": "https://maps.google.com/?q=28.6200,77.2150",
    "address": "123 Main Street, Sector 18, Noida",
    "landmark": "Near Metro Station"
  },
  "deliveryPrice": 50,
  "status": "pending",
  "createdAt": "2025-10-21T10:30:00Z"
}
```

**Response (if no active shipment):**
- HTTP 404 with `{"detail": "No active shipment found"}`
- OR HTTP 200 with `null`

**Backend Logic:**
```sql
SELECT * FROM shipments 
WHERE admin_mobile = ? 
  AND status IN ('pending', 'assigned', 'in_transit')
ORDER BY created_at DESC 
LIMIT 1;
```

**Notes:**
- Only returns shipments with status: `pending`, `assigned`, or `in_transit`
- Excludes `delivered` and `cancelled` shipments
- Returns the MOST RECENT one (latest created_at)
- Used for page refresh/reload to restore UI state

---

### 7. Get All Active Shipments

**Endpoint:** `GET /shipments/active?adminMobile={mobile}`

**Description:** Returns all active shipments for a specific admin with customer and delivery boy information for the map view. Used by the "MAP" feature to show all ongoing deliveries for the current admin only.

**Query Parameters:**
- `adminMobile` (required) - Mobile number of the admin to filter shipments

**Example Request:**
```
GET /shipments/active?adminMobile=%2B919876543210
```

**Response:**
```json
[
  {
    "id": "shipment_123",
    "adminLocation": {
      "latitude": 28.6139,
      "longitude": 77.2090,
      "address": "Shop 12, Connaught Place, New Delhi"
    },
    "adminMobile": "+91 9876543210",
    "customer": {
      "name": "John Doe",
      "mobile": "+91 9123456789",
      "locationLink": "https://maps.google.com/?q=28.6200,77.2150",
      "address": "123 Main Street, Sector 18, Noida",
      "landmark": "Near Metro Station"
    },
    "deliveryPrice": 50,
    "status": "assigned",
    "acceptedRiderId": "rider_456",
    "createdAt": "2025-10-21T10:30:00Z"
  },
  {
    "id": "shipment_124",
    "adminLocation": {
      "latitude": 28.5355,
      "longitude": 77.3910,
      "address": "Shop 5, Sector 62, Noida"
    },
    "adminMobile": "+91 9876543211",
    "customer": {
      "name": "Jane Smith",
      "mobile": "+91 9123456780",
      "locationLink": "https://maps.google.com/?q=28.5500,77.4000",
      "address": "456 Park Avenue, Sector 18, Noida",
      "landmark": "Near Shopping Mall"
    },
    "deliveryPrice": 70,
    "status": "in_transit",
    "acceptedRiderId": "rider_789",
    "createdAt": "2025-10-21T10:25:00Z"
  }
]
```

**Notes:**
- **IMPORTANT:** Only returns shipments for the specified `adminMobile` (privacy & security)
- Each admin sees only their own deliveries, not other admins' shipments
- Only returns shipments with status: `pending`, `assigned`, or `in_transit`
- Excludes `delivered` and `cancelled` shipments
- Frontend will parse customer location from `locationLink`
- Frontend will call `GET /riders/:riderId/location` separately for each accepted rider
- Map shows ONE blue marker (admin's shop) + multiple red/green markers (customers/riders)

---

## WhatsApp Integration Flow

### Step 1: Admin Creates Shipment
1. Admin fills form with customer details
2. Frontend calls `POST /shipments/create`
3. Backend:
   - Creates shipment record
   - Queries all available delivery boys in zone
   - Sends WhatsApp message with **limited info** (admin location, customer landmark, price)
   - Returns shipment ID to frontend

### Step 2: Delivery Boy Responds
1. Delivery boy sends WhatsApp message: "ACCEPT shipment_123" or "DECLINE shipment_123"
2. WhatsApp webhook receives message
3. Backend calls `POST /shipments/:shipmentId/respond`
4. If **first acceptance**:
   - Mark shipment as assigned
   - Send **full customer details** to accepted rider via WhatsApp
   - Send "already assigned" message to other riders
   - Mark rider as unavailable
5. If declined:
   - Record decline in database
   - Continue waiting for acceptance

### Step 3: Admin Tracks Delivery
1. Frontend polls `GET /shipments/:shipmentId/responses` every 3 seconds
2. Once accepted, frontend shows:
   - Accepted rider details
   - Live tracking map
3. Frontend polls `GET /riders/:riderId/location` every 5 seconds to update map

---

## Database Schema Suggestions

### Shipments Table
```sql
CREATE TABLE shipments (
  id VARCHAR PRIMARY KEY,
  admin_mobile VARCHAR,
  admin_lat DECIMAL,
  admin_lng DECIMAL,
  admin_address TEXT,
  customer_name VARCHAR,
  customer_mobile VARCHAR,
  customer_lat DECIMAL,
  customer_lng DECIMAL,
  customer_address TEXT,
  customer_landmark VARCHAR,
  delivery_price DECIMAL,
  status VARCHAR,  -- pending, assigned, in_transit, delivered
  assigned_rider_id VARCHAR,
  created_at TIMESTAMP,
  accepted_at TIMESTAMP
);
```

### Shipment Responses Table
```sql
CREATE TABLE shipment_responses (
  id SERIAL PRIMARY KEY,
  shipment_id VARCHAR,
  rider_id VARCHAR,
  response VARCHAR,  -- pending, accepted, declined
  timestamp TIMESTAMP,
  FOREIGN KEY (shipment_id) REFERENCES shipments(id),
  FOREIGN KEY (rider_id) REFERENCES users(id)
);
```

### Riders Location Table (for live tracking)
```sql
CREATE TABLE rider_locations (
  rider_id VARCHAR PRIMARY KEY,
  lat DECIMAL,
  lng DECIMAL,
  heading DECIMAL,
  speed DECIMAL,
  updated_at TIMESTAMP,
  FOREIGN KEY (rider_id) REFERENCES users(id)
);
```

---

## Implementation Priority

1. ✅ **GET /riders/available** - Get list of available delivery boys
2. ✅ **POST /shipments/create** - Core functionality (supports both broadcast & specific rider)
3. ✅ **POST /shipments/:shipmentId/respond** - Handle accept/decline
4. ✅ **GET /shipments/:shipmentId/responses** - Admin dashboard tracking
5. ⚠️ **GET /riders/:riderId/location** - Real-time tracking (can be mocked initially)
6. ✅ **GET /shipments/latest** - Restore shipment after page refresh
7. ✅ **GET /shipments/active** - Map view showing all active deliveries

---

## Rider Availability Management

### Mark Rider Unavailable (After Acceptance)
```python
# When rider accepts shipment
@app.post("/shipments/{shipment_id}/respond")
async def respond_to_shipment(shipment_id: str, rider_id: str, response: str):
    if response == "accepted":
        # Mark rider as busy
        db.query(User).filter(User.id == rider_id).update({
            "is_available": False
        })
        db.commit()
```

### Mark Rider Available (After Delivery Completion)
```python
# When shipment is delivered
@app.post("/shipments/{shipment_id}/complete")
async def complete_shipment(shipment_id: str):
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    
    # Update shipment status
    shipment.status = "delivered"
    
    # Free up the rider
    db.query(User).filter(User.id == shipment.assigned_rider_id).update({
        "is_available": True
    })
    
    db.commit()
    return {"message": "Shipment completed, rider is now available"}
```

### Automatic Availability (Optional - Cron Job)
```python
# Run every hour to free stuck riders
@app.get("/riders/auto-free")
async def auto_free_riders():
    """Free riders whose shipments were delivered > 1 hour ago"""
    
    # Get completed shipments from last hour
    one_hour_ago = datetime.now() - timedelta(hours=1)
    
    completed_shipments = db.query(Shipment).filter(
        Shipment.status == "delivered",
        Shipment.completed_at > one_hour_ago
    ).all()
    
    for shipment in completed_shipments:
        db.query(User).filter(User.id == shipment.assigned_rider_id).update({
            "is_available": True
        })
    
    db.commit()
```

---

## Testing Checklist

- [ ] Create shipment successfully
- [ ] **Only top 3 nearest riders** receive WhatsApp
- [ ] First rider can accept
- [ ] **Rider marked unavailable** after acceptance
- [ ] Subsequent riders get "already assigned" message
- [ ] Admin sees accepted rider details
- [ ] Admin sees declined riders list
- [ ] **Create second shipment** - goes to **next 3 available** riders
- [ ] Live location updates on map (every 5 seconds)
- [ ] **Rider becomes available** after delivery completion
- [ ] Multiple active shipments show in tabs

---

## Notes

- Use Meta Graph API or Twilio for WhatsApp
- Implement signature verification for Meta webhooks
- Store WhatsApp message templates in config
- Add rate limiting to prevent spam
- Log all WhatsApp API calls for debugging
- Consider adding delivery status updates (picked up, in transit, delivered)

---

## Frontend URLs

- **Shipment Creation:** `http://localhost:3001/shipment`
- **All Shipments Map View:** `http://localhost:3001/map`
- **Rider Tracking (Old):** `http://localhost:3001/tracking`

Default route redirects to `/shipment`

**MAP Button:** Click the green "MAP" button on the Admin Shipment Portal to view all active shipments on one map with live tracking of all delivery boys.


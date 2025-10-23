# Multi-Shipment Management Guide

## ✨ What's New

You can now **create multiple shipments simultaneously** and manage them all from one screen!

---

## 🎯 Key Features

### 1. **Create Multiple Shipments**
- Create as many shipments as you want
- Each shipment is tracked separately
- Switch between shipments using tabs

### 2. **Smart Rider Distribution**
- **Shipment 1** → Goes to 3 nearest available riders
- **Shipment 2** → Goes to next 3 available riders (excluding busy ones)
- **Shipment 3** → Goes to next 3 available riders
- And so on...

### 3. **Automatic Availability Management**
- Rider accepts Shipment 1 → Marked as **UNAVAILABLE**
- They won't receive Shipment 2, 3, 4, etc.
- After delivery → Marked as **AVAILABLE** again
- Now eligible for new shipments

---

## 📊 UI Features

### **Shipment Tabs**
At the top of the right panel, you'll see buttons for each shipment:

```
┌─────────────────────────────────────────┐
│ Active Shipments        3 total         │
├─────────────────────────────────────────┤
│ [Shipment 1 🟡] [Shipment 2 🟢] [Shipment 3 🟡] │
└─────────────────────────────────────────┘
```

**Status Indicators:**
- 🟡 Yellow dot = Pending (waiting for acceptance)
- 🟢 Green dot = Assigned (rider accepted)

**Active Tab:**
- Blue background = Currently viewing
- Gray background = Other shipments

---

## 🔄 Complete Workflow

### **Create First Shipment**

1. Fill customer details
2. Click "Send to Available Delivery Boys"
3. Backend finds **3 nearest available riders**
4. Sends WhatsApp to those 3 riders
5. Tab shows: **[Shipment 1 🟡]**

**Riders notified:**
- Rahul (500m away)
- Amit (800m away)
- Priya (1.2km away)

---

### **Rahul Accepts Shipment 1**

1. Rahul sends "ACCEPT shipment_1"
2. Backend marks Rahul as **UNAVAILABLE**
3. Tab updates: **[Shipment 1 🟢]**
4. Status shows: "Accepted by Rahul"

**Current Status:**
- ✅ Rahul: BUSY (handling Shipment 1)
- ✅ Amit: AVAILABLE
- ✅ Priya: AVAILABLE

---

### **Create Second Shipment**

1. Fill new customer details
2. Click "Send to Available Delivery Boys"
3. Backend finds **3 nearest AVAILABLE riders** (excludes Rahul)
4. Sends WhatsApp to new set of riders
5. Tabs show: **[Shipment 1 🟢] [Shipment 2 🟡]**

**Riders notified (excluding Rahul):**
- Amit (800m away) ✅
- Priya (1.2km away) ✅
- Vijay (1.5km away) ✅

**Why Rahul NOT included?**
- He's busy with Shipment 1
- `is_available = false` in database

---

### **Amit Accepts Shipment 2**

1. Amit sends "ACCEPT shipment_2"
2. Backend marks Amit as **UNAVAILABLE**
3. Tab updates: **[Shipment 1 🟢] [Shipment 2 🟢]**

**Current Status:**
- ✅ Rahul: BUSY (Shipment 1)
- ✅ Amit: BUSY (Shipment 2)
- ✅ Priya: AVAILABLE
- ✅ Vijay: AVAILABLE

---

### **Create Third Shipment**

1. Fill customer details
2. Click "Send to Available Delivery Boys"
3. Backend finds 3 nearest AVAILABLE riders (excludes Rahul & Amit)
4. Tabs show: **[Shipment 1 🟢] [Shipment 2 🟢] [Shipment 3 🟡]**

**Riders notified (excluding Rahul & Amit):**
- Priya (1.2km away) ✅
- Vijay (1.5km away) ✅
- Sanjay (2.0km away) ✅

---

### **Rahul Completes Shipment 1**

1. Rahul delivers to customer
2. Backend marks shipment as "delivered"
3. Backend marks Rahul as **AVAILABLE** again
4. Rahul is now eligible for future shipments

**Current Status:**
- ✅ Rahul: AVAILABLE (completed delivery) 🎉
- ✅ Amit: BUSY (Shipment 2)
- ✅ Priya: BUSY (Shipment 3, if accepted)
- ✅ Vijay: AVAILABLE

---

### **Create Fourth Shipment**

Now Rahul is back in the pool!

**Riders notified (excluding Amit & Priya):**
- Rahul (500m away) ✅ (He's free now!)
- Vijay (1.5km away) ✅
- Sanjay (2.0km away) ✅

---

## 🗺️ Smart Rider Selection

### **How Backend Chooses Riders**

```python
# Haversine formula for distance calculation
SELECT id, name, mobile, 
       (6371 * acos(
           cos(radians(admin_lat)) * cos(radians(rider_lat)) * 
           cos(radians(rider_lng) - radians(admin_lng)) + 
           sin(radians(admin_lat)) * sin(radians(rider_lat))
       )) AS distance_km
FROM users
WHERE user_type = 'rider' 
  AND is_available = true
  AND lat IS NOT NULL 
  AND lng IS NOT NULL
ORDER BY distance_km ASC
LIMIT 3;
```

**Result:**
```
Rider    Distance    Status       Action
─────    ────────    ──────       ──────
Rahul    0.5 km      ✅ Free      → Send WhatsApp
Amit     0.8 km      ✅ Free      → Send WhatsApp
Priya    1.2 km      ✅ Free      → Send WhatsApp
Vijay    1.5 km      ❌ Busy      → Skip
Sanjay   2.0 km      ✅ Free      → Skip (already have 3)
```

---

## 📱 UI Interaction

### **Switching Between Shipments**

Click any tab to view that shipment's details:

**Click "Shipment 1":**
- Shows delivery boy status for Shipment 1
- Shows map with Shipment 1 tracking
- Shows Rahul's location

**Click "Shipment 2":**
- Shows delivery boy status for Shipment 2
- Shows map with Shipment 2 tracking
- Shows Amit's location

**Click "Shipment 3":**
- Shows delivery boy status for Shipment 3
- Shows map with Shipment 3 tracking
- Shows Priya's location (if accepted)

---

## 🔧 Backend Requirements

### **1. Store Rider Location**

Riders must have GPS coordinates:

```sql
UPDATE users 
SET lat = 28.6139, lng = 77.2090 
WHERE id = 'rider_123' AND user_type = 'rider';
```

### **2. Mark Rider Unavailable on Accept**

```python
@app.post("/shipments/{shipment_id}/respond")
async def respond(shipment_id: str, rider_id: str, response: str):
    if response == "accepted":
        # Mark busy
        db.query(User).filter(User.id == rider_id).update({
            "is_available": False
        })
        db.commit()
```

### **3. Mark Rider Available on Complete**

```python
@app.post("/shipments/{shipment_id}/complete")
async def complete(shipment_id: str):
    shipment = db.query(Shipment).get(shipment_id)
    
    # Free up rider
    db.query(User).filter(User.id == shipment.assigned_rider_id).update({
        "is_available": True
    })
    
    # Update shipment
    shipment.status = "delivered"
    db.commit()
```

### **4. Select Top 3 Nearest Available Riders**

```python
from sqlalchemy import func, literal_column

@app.post("/shipments/create")
async def create_shipment(data: ShipmentCreate):
    # Calculate distance using Haversine formula
    distance = (
        6371 * func.acos(
            func.cos(func.radians(data.adminLocation.latitude)) * 
            func.cos(func.radians(User.lat)) * 
            func.cos(func.radians(User.lng) - func.radians(data.adminLocation.longitude)) + 
            func.sin(func.radians(data.adminLocation.latitude)) * 
            func.sin(func.radians(User.lat))
        )
    ).label('distance')
    
    # Get top 3 nearest available riders
    riders = db.query(User, distance).filter(
        User.user_type == 'rider',
        User.is_available == True,
        User.lat.isnot(None),
        User.lng.isnot(None)
    ).order_by(distance).limit(3).all()
    
    # Send WhatsApp to these 3 riders
    for rider, dist in riders:
        send_whatsapp(rider.mobile, message)
```

---

## ✅ Benefits

### **For Admin:**
- ✅ Handle multiple orders simultaneously
- ✅ See all shipments at a glance
- ✅ Switch between shipments easily
- ✅ No rider gets overloaded

### **For Riders:**
- ✅ Only receive requests when available
- ✅ No spam if already busy
- ✅ Automatic availability management
- ✅ Fair distribution of work

### **For Customers:**
- ✅ Fastest delivery (nearest rider)
- ✅ Better service quality
- ✅ Reduced wait times

---

## 🧪 Testing Scenario

### **Setup: 6 Riders**
```
Rahul  - 500m  - AVAILABLE
Amit   - 800m  - AVAILABLE
Priya  - 1.2km - AVAILABLE
Vijay  - 1.5km - AVAILABLE
Sanjay - 2.0km - AVAILABLE
Ravi   - 2.5km - AVAILABLE
```

### **Test Flow:**

#### **Shipment 1**
- Notify: Rahul, Amit, Priya
- Rahul accepts
- Rahul → UNAVAILABLE

#### **Shipment 2**
- Notify: Amit, Priya, Vijay (skip Rahul)
- Amit accepts
- Amit → UNAVAILABLE

#### **Shipment 3**
- Notify: Priya, Vijay, Sanjay (skip Rahul, Amit)
- Priya accepts
- Priya → UNAVAILABLE

#### **Shipment 4**
- Notify: Vijay, Sanjay, Ravi (skip Rahul, Amit, Priya)
- Vijay accepts
- Vijay → UNAVAILABLE

#### **Rahul Delivers Shipment 1**
- Rahul → AVAILABLE

#### **Shipment 5**
- Notify: Rahul, Sanjay, Ravi (skip Amit, Priya, Vijay)
- Rahul can accept again! ✅

---

## 📊 Database Status Example

After 4 shipments created and accepted:

```
Rider    Status       Assigned To
─────    ──────       ───────────
Rahul    ❌ BUSY      Shipment 1
Amit     ❌ BUSY      Shipment 2
Priya    ❌ BUSY      Shipment 3
Vijay    ❌ BUSY      Shipment 4
Sanjay   ✅ FREE      -
Ravi     ✅ FREE      -
```

**Next shipment** will go to: Sanjay, Ravi + next available

---

## 💡 Pro Tips

### **Tip 1: Reload Available Riders**
After deliveries complete, available rider pool refreshes automatically.

### **Tip 2: Distance-Based**
Always sends to nearest riders first for faster delivery.

### **Tip 3: Auto-Refresh**
Tabs auto-update every 3 seconds to show latest status.

### **Tip 4: View All on Map**
Click "MAP" button to see all shipments and all riders on one map.

---

## 🚀 Summary

**Old System:**
- 1 shipment at a time
- All riders notified
- Busy riders get spam

**New System:**
- ✅ Multiple shipments simultaneously
- ✅ Only 3 nearest riders per shipment
- ✅ Busy riders automatically excluded
- ✅ Fair workload distribution
- ✅ Tab-based management

---

**Your multi-shipment portal is ready! Create as many shipments as you need! 📦📦📦**


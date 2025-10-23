# 🔧 Troubleshooting: Shipment Not Restoring After Refresh

## ❌ Problem
After pressing Ctrl+R (refresh), the shipment disappears and shows "No Active Shipment".

---

## 🔍 Debugging Steps

### Step 1: Open Browser Console
1. Press **F12** on your keyboard
2. Click **Console** tab
3. Refresh the page (Ctrl+R)
4. Look for colored emoji messages

---

## 📋 What the Console Should Show

### ✅ If Everything Works:
```
🔍 Fetching latest shipment for mobile: 8233758907
📡 Calling: http://localhost:8000/shipments/latest?adminMobile=8233758907
📥 Response status: 200
📦 Shipment data received: {id: "shipment_123", ...}
✅ Restored active shipment: shipment_123
```

### ⚠️ If No Shipment Exists (Normal):
```
🔍 Fetching latest shipment for mobile: 8233758907
📡 Calling: http://localhost:8000/shipments/latest?adminMobile=8233758907
📥 Response status: 404
ℹ️ No active shipment found (this is normal if you haven't created one yet)
```

### ❌ If Backend Endpoint Doesn't Exist:
```
🔍 Fetching latest shipment for mobile: 8233758907
📡 Calling: http://localhost:8000/shipments/latest?adminMobile=8233758907
📥 Response status: 404
❌ Backend error: 404 {"detail":"Not Found"}
❌ Error fetching latest shipment: Error: HTTP 404
💡 Make sure your backend has the GET /shipments/latest endpoint
```

### ❌ If Backend Not Running:
```
🔍 Fetching latest shipment for mobile: 8233758907
📡 Calling: http://localhost:8000/shipments/latest?adminMobile=8233758907
❌ Error fetching latest shipment: TypeError: Failed to fetch
💡 Make sure your backend has the GET /shipments/latest endpoint
```

---

## 🛠️ Solutions

### Solution 1: Backend Endpoint Missing (Most Common)

The `/shipments/latest` endpoint doesn't exist in your backend yet.

**Add this to your FastAPI backend:**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

@app.get("/shipments/latest")
async def get_latest_shipment(
    adminMobile: str,
    db: Session = Depends(get_db)
):
    """Get the most recent active shipment for an admin."""
    
    # Query the database
    shipment = db.query(Shipment).filter(
        Shipment.admin_mobile == adminMobile,
        Shipment.status.in_(['pending', 'assigned', 'in_transit'])
    ).order_by(
        Shipment.created_at.desc()
    ).first()
    
    # If no shipment found, return 404
    if not shipment:
        raise HTTPException(
            status_code=404, 
            detail="No active shipment found"
        )
    
    # Return shipment data
    return {
        "id": shipment.id,
        "adminLocation": {
            "latitude": shipment.admin_lat,
            "longitude": shipment.admin_lng,
            "address": shipment.admin_address
        },
        "adminMobile": shipment.admin_mobile,
        "customer": {
            "name": shipment.customer_name,
            "mobile": shipment.customer_mobile,
            "locationLink": shipment.customer_location_link,
            "address": shipment.customer_address,
            "landmark": shipment.customer_landmark
        },
        "deliveryPrice": shipment.delivery_price,
        "status": shipment.status,
        "createdAt": shipment.created_at.isoformat()
    }
```

**Then restart your backend:**
```bash
uvicorn main:app --reload
```

---

### Solution 2: Backend Not Running

Make sure your FastAPI backend is running on port 8000.

**Check:**
1. Open terminal
2. Navigate to backend directory
3. Run: `uvicorn main:app --reload --port 8000`
4. Should see: `Uvicorn running on http://127.0.0.1:8000`

---

### Solution 3: Wrong Backend URL

Check your frontend `.env` file:

```env
VITE_BACKEND_BASE_URL=http://localhost:8000
```

**If you changed the port, update this file and restart frontend:**
```bash
# Stop frontend (Ctrl+C)
npm run dev
```

---

### Solution 4: CORS Error

If console shows CORS error, add CORS middleware to backend:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🧪 Test the Backend Endpoint Directly

### Option 1: Browser
Open this URL in your browser:
```
http://localhost:8000/shipments/latest?adminMobile=8233758907
```

**Expected:**
- If shipment exists: JSON data
- If no shipment: `{"detail":"No active shipment found"}`

### Option 2: PowerShell
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/shipments/latest?adminMobile=8233758907"
```

### Option 3: curl
```bash
curl "http://localhost:8000/shipments/latest?adminMobile=8233758907"
```

---

## 📊 Quick Checklist

- [ ] Backend is running on port 8000
- [ ] `/shipments/latest` endpoint exists in backend
- [ ] Database has `shipments` table
- [ ] At least one shipment with `status IN ('pending', 'assigned', 'in_transit')` exists
- [ ] `admin_mobile` in database matches your mobile number
- [ ] Frontend `.env` has correct `VITE_BACKEND_BASE_URL`
- [ ] CORS is configured in backend
- [ ] Browser console shows no errors

---

## 🔄 Full Test Workflow

### Step 1: Create a Shipment
1. Fill customer details
2. Click "Send to Available Delivery Boys"
3. See shipment on right side
4. **Note the shipment ID in console**

### Step 2: Refresh Page
1. Press **Ctrl+R** or **F5**
2. Open console (F12)
3. Look for restoration messages

### Step 3: Verify in Database
```sql
SELECT id, admin_mobile, status, created_at 
FROM shipments 
WHERE admin_mobile = '8233758907'
ORDER BY created_at DESC
LIMIT 1;
```

Should return your shipment with status = 'pending', 'assigned', or 'in_transit'.

---

## 🎯 Common Issues

### Issue 1: "404 Not Found"
**Cause:** Backend endpoint doesn't exist  
**Fix:** Add the endpoint (see Solution 1)

### Issue 2: "Failed to fetch"
**Cause:** Backend not running  
**Fix:** Start backend server

### Issue 3: "CORS error"
**Cause:** CORS not configured  
**Fix:** Add CORS middleware (see Solution 4)

### Issue 4: Always returns 404 even though shipment exists
**Cause:** Mobile number mismatch  
**Fix:** Check if `admin_mobile` in database exactly matches localStorage value

```javascript
// Browser console
localStorage.getItem('adminMobile')  // What frontend sends
```

```sql
-- Database
SELECT admin_mobile FROM shipments WHERE id = 'shipment_123';
```

They must match EXACTLY (including +91 or spaces).

### Issue 5: Shipment status is 'delivered'
**Cause:** Query only returns `pending`, `assigned`, `in_transit`  
**Fix:** This is correct - delivered shipments shouldn't restore

---

## 💡 Pro Tips

### Tip 1: Clear Everything and Start Fresh
```javascript
// Browser console (F12)
localStorage.clear();
// Then refresh page
```

### Tip 2: Check Database Directly
```sql
-- See all active shipments
SELECT id, admin_mobile, status, created_at 
FROM shipments 
WHERE status IN ('pending', 'assigned', 'in_transit')
ORDER BY created_at DESC;
```

### Tip 3: Mock the Endpoint Temporarily
If you can't add the backend endpoint yet, test with mock data:

```typescript
// Temporarily in AdminShipment/index.tsx
const fetchLatestShipment = async () => {
  // Mock data for testing
  const mockShipment = {
    id: "test_123",
    status: "pending",
    adminLocation: adminLocation,
    adminMobile: adminMobile,
    customer: {
      name: "Test Customer",
      mobile: "9876543210",
      locationLink: "https://maps.google.com/?q=28.6139,77.2090",
      address: "Test Address",
      landmark: "Test Landmark"
    },
    deliveryPrice: 50,
    createdAt: new Date().toISOString()
  };
  
  setActiveShipment(mockShipment);
};
```

---

## 📞 Still Not Working?

### Share Console Output
1. Open console (F12)
2. Refresh page (Ctrl+R)
3. Copy ALL console messages
4. Share them for debugging

### Share Backend Response
```bash
curl "http://localhost:8000/shipments/latest?adminMobile=YOUR_MOBILE"
```

Copy the output and share it.

---

**Most likely cause: The `/shipments/latest` endpoint doesn't exist in your backend yet. Add it using the code in Solution 1!** 🚀


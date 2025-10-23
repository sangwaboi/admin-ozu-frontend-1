# MAP Feature - All Shipments View

## Overview
The MAP button provides a comprehensive view of **YOUR active shipments** on a single interactive map with real-time delivery boy tracking. Each admin sees only their own deliveries for privacy and security.

---

## 🔒 Privacy & Security

**IMPORTANT:** The MAP feature shows **ONLY YOUR deliveries**, not other admins' shipments.

- ✅ Each shop owner sees only their own shipments
- ✅ Only ONE blue marker (your shop location) appears on the map
- ✅ Other admins' data is completely hidden
- ✅ Multi-tenant safe - perfect for multiple shop owners using the same platform

---

## How to Access

1. Go to Admin Shipment Portal: `http://localhost:3001/shipment`
2. **Enter your mobile number** in the admin portal (required for MAP access)
3. Click the green **"MAP"** button in the top-right corner
4. You'll be taken to: `http://localhost:3001/map`

**Note:** MAP button is disabled until you set your mobile number and location.

---

## What You'll See

### Left Sidebar - Shipment List
- **Active Shipments Count** - Total number of ongoing deliveries
- **Individual Shipment Cards** showing:
  - Shipment ID (first 8 characters)
  - Status badge (pending/assigned/in_transit)
  - Customer name
  - Delivery landmark
  - Accepted delivery boy name (if assigned)
  - Time created
  - Delivery price

**Click any shipment** in the list to highlight it on the map

### Right Side - Interactive Map
Shows **all YOUR shipments simultaneously** with:

#### 🔵 Blue Marker - YOUR Shop Location (Only One)
There's only ONE blue marker showing your shop location. Click on it to see:
- Your shop address
- Your mobile number
- Total number of active deliveries

#### 🔴 Red Markers - Customer Locations
Click on any red marker to see:
- Customer name
- Customer mobile
- Full delivery address
- Landmark
- Delivery price

#### 🟢 Green Markers - Delivery Boys
Click on any green marker to see:
- Delivery boy name
- Delivery boy mobile
- Current delivery status
- Live location (updates every 5 seconds)

#### 📍 Route Lines
- **Blue dashed line** - Shop to Delivery Boy
- **Green dashed line** - Delivery Boy to Customer
- Shows the complete delivery route

---

## Features

### ✅ Real-Time Updates
- **Auto-refresh every 5 seconds** - All shipment and rider locations update automatically
- Green indicator at top-left shows "Auto-refreshing every 5s"

### ✅ Manual Refresh
- Click the **"Refresh"** button to manually update all data
- Useful when you want immediate updates

### ✅ Map Auto-Fit
- Map automatically zooms to show all active shipments
- All markers fit in view without manual panning

### ✅ Detailed Popups
- Click any marker to see complete information
- Popups show all relevant details for that location

### ✅ Color-Coded Status
- **Yellow badge** - Pending (waiting for acceptance)
- **Blue badge** - Assigned (delivery boy accepted)
- **Green badge** - In Transit (on the way)
- **Gray badge** - Delivered (completed)

---

## Use Cases

### 1. Monitor Fleet Operations
See all delivery boys and their current locations at a glance

### 2. Track Multiple Deliveries
Monitor several ongoing deliveries simultaneously on one screen

### 3. Identify Bottlenecks
Quickly spot which deliveries need attention

### 4. Customer Support
Provide accurate ETA by checking exact delivery boy location

### 5. Performance Monitoring
See which areas have most activity and delivery density

---

## Map Legend
Located at **bottom-left** of the map:
- 🔵 Blue = Shop Location
- 🔴 Red = Customer
- 🟢 Green = Delivery Boy

---

## Navigation

### From MAP View:
- **"Back to Portal"** button - Returns to shipment creation page
- Click on shipment in sidebar - Highlights that specific delivery

### To MAP View:
- Click **"MAP"** button from Admin Shipment Portal

---

## Technical Details

### Data Refresh
- Shipment list: Refreshes every 5 seconds
- Delivery boy locations: Fetched separately for each active rider
- Customer locations: Parsed from Google Maps links

### Backend API Called
- `GET /shipments/active` - Fetches all active shipments
- `GET /riders/:riderId/location` - Fetches each rider's live location

### Map Technology
- **Leaflet.js** - Interactive map library
- **OpenStreetMap** - Map tiles (free, no API key needed)
- **React-Leaflet** - React wrapper for seamless integration

---

## Example Workflow

1. **Admin creates multiple shipments** from `/shipment` page
2. **Delivery boys accept** via WhatsApp
3. **Admin clicks MAP button** to see overview
4. **Map displays**:
   - Shop 1 (Blue) → Rider 1 (Green) → Customer 1 (Red)
   - Shop 2 (Blue) → Rider 2 (Green) → Customer 2 (Red)
   - Shop 3 (Blue) → Waiting (no green marker yet)
5. **Admin can click** on any marker for details
6. **Locations update** automatically every 5 seconds
7. **Admin tracks** until all deliveries complete

---

## Information Displayed

### For Each Shipment:
✅ Admin location and contact  
✅ Customer location and contact  
✅ Delivery boy location and contact (if accepted)  
✅ Current status  
✅ Delivery price  
✅ Time created  
✅ Live route visualization  

---

## Benefits

### 👀 Complete Visibility
- See everything happening in your delivery network
- No need to switch between multiple shipments

### ⚡ Real-Time Monitoring
- Live location updates
- Instant status changes
- Automatic data refresh

### 📊 Operational Insights
- Identify busy zones
- Monitor delivery coverage
- Track team performance

### 🎯 Quick Decision Making
- Spot delays immediately
- Reassign if needed
- Communicate with customers proactively

---

## Best Practices

1. **Keep MAP view open** during peak hours for monitoring
2. **Check regularly** for stuck deliveries
3. **Use sidebar filtering** to focus on specific shipments
4. **Click markers** to get full context before calling riders
5. **Monitor routes** to ensure delivery boys are on track

---

## Keyboard Shortcuts (Map Controls)
- **Scroll wheel** - Zoom in/out
- **Click + Drag** - Pan around map
- **Click marker** - Open popup with details
- **Double click** - Zoom in on location

---

## Mobile Responsiveness
- Works on tablets and mobile devices
- Sidebar collapses on smaller screens
- Touch-friendly map controls
- Swipe to pan map

---

## Coming Soon
- 📊 Analytics overlay
- 🔍 Search/filter shipments
- 📍 Geofencing alerts
- 📈 Heatmap of delivery density
- 🎨 Custom marker styles by priority
- 📤 Export map as image

---

**Enjoy your complete visibility into all deliveries! 🗺️**


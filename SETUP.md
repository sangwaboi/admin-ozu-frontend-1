# Ozu Admin Portal - Setup Guide

## 🚀 Quick Start

This admin portal connects to your FastAPI backend for real-time rider tracking.

### Prerequisites

- Node.js 18+ and npm
- Your FastAPI backend running (default: `http://localhost:8000`)

---

## 📦 Installation

### 1. Install Dependencies

```bash
cd frontend
npm install
```

This will install:
- ✅ React 18 + TypeScript
- ✅ Vite (dev server)
- ✅ Tailwind CSS + shadcn/ui
- ✅ Leaflet + React-Leaflet (map)
- ✅ Socket.IO client (WebSocket)
- ✅ Axios (HTTP client)

### 2. Configure Environment

Create a `.env` file in the `frontend/` directory:

```env
VITE_BACKEND_BASE_URL=http://localhost:8000
```

**Important:** Update the URL to match your FastAPI server.

---

## 🔧 Backend Requirements

Your FastAPI backend needs to provide these endpoints:

### HTTP Endpoint
```
GET /riders/live
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "phone": "+1234567890",
    "zone": "North",
    "status": "available",  // available | assigned | in_transit | offline
    "lat": 28.6139,
    "lng": 77.2090,
    "headingDeg": 45,
    "activeShipmentId": null,
    "updatedAt": "2025-01-18T10:30:00Z"
  }
]
```

### WebSocket Endpoint
```
Socket.IO: /ws/riders
```

**Event to emit:**
```javascript
// Server emits this when rider updates
socket.emit('rider_update', {
  id: 1,
  name: "John Doe",
  status: "in_transit",
  lat: 28.6150,
  lng: 77.2100,
  updatedAt: "2025-01-18T10:35:00Z"
});
```

---

## 🏃 Running the App

### Development Mode

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Production Build

```bash
npm run build
npm run preview
```

---

## 🗺️ Map Features

### Color-Coded Rider Markers

- 🟢 **Green** → Rider is available/free
- 🟡 **Yellow** → Rider is assigned (job allocated, not moving)
- 🔴 **Red** → Rider is in transit (on the way)
- ⚫ **Gray** → Rider is offline

### Real-Time Updates

- **Polling:** Fetches rider data every 5 seconds
- **WebSocket:** Instant updates when riders move or change status
- **Auto-fit:** Map automatically adjusts to show all riders

---

## 🔧 FastAPI CORS Configuration

Make sure your FastAPI backend allows CORS from your frontend:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🐛 Troubleshooting

### Map not loading?
- Check that leaflet CSS is imported in `RiderMap.tsx`
- Clear browser cache and restart dev server

### WebSocket not connecting?
- Verify `VITE_BACKEND_BASE_URL` in `.env`
- Check FastAPI Socket.IO path matches `/ws/riders`
- Ensure backend CORS is configured correctly

### No riders showing?
- Open browser console and check for errors
- Verify `/riders/live` endpoint returns valid JSON
- Check that rider objects have `lat`, `lng`, and `status` fields

### TypeScript errors?
```bash
npm install @types/leaflet
```

---

## 📂 File Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components (Button, Card, Badge)
│   │   └── map/             # Map components
│   │       ├── RiderMarker.tsx
│   │       ├── MapLegend.tsx
│   │       ├── MapToolbar.tsx
│   │       └── statusColors.ts
│   ├── pages/
│   │   └── AdminPortal/
│   │       ├── index.tsx    # Main portal page
│   │       └── RiderMap.tsx # Left-side map
│   ├── hooks/
│   │   └── useRiders.ts     # Fetch + WebSocket logic
│   ├── lib/
│   │   ├── api.ts           # API client
│   │   ├── socket.ts        # Socket.IO setup
│   │   └── utils.ts         # Utilities
│   └── types/
│       └── rider.ts         # TypeScript types
```

---

## 🎨 Customization

### Change Default Map Center

Edit `src/pages/AdminPortal/RiderMap.tsx`:
```typescript
const center = useMemo(() => ({ 
  lat: YOUR_LAT, 
  lng: YOUR_LNG 
}), []);
```

### Adjust Polling Interval

In `RiderMap.tsx`:
```typescript
const { riders, loading, lastUpdated, refresh } = useRiders(10000); // 10 seconds
```

### Change Status Colors

Edit `src/components/map/statusColors.ts`:
```typescript
export function statusToColor(status: RiderStatus): string {
  switch (status) {
    case "available": return "#YOUR_COLOR";
    // ...
  }
}
```

---

## 📞 Need Help?

If you need to add more features (right panel, analytics, order tracking, etc.), just ask!

---

## ✅ Checklist

- [ ] Backend running at `http://localhost:8000`
- [ ] `.env` file created with `VITE_BACKEND_BASE_URL`
- [ ] Dependencies installed (`npm install`)
- [ ] Backend provides `/riders/live` endpoint
- [ ] Backend Socket.IO configured at `/ws/riders`
- [ ] CORS enabled for `http://localhost:3000`
- [ ] Frontend running (`npm run dev`)

---

🎉 **You're all set!** Open `http://localhost:3000` to see your live rider map.


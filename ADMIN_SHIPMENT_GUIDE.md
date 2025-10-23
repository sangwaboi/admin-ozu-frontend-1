# Admin Shipment Portal - User Guide

## 🚀 Quick Start

This portal allows shop owners to create delivery requests and track delivery boys in real-time.

---

## 📍 How It Works

### Step 1: Admin Opens Portal
- Navigate to: `http://localhost:3000/shipment`
- Your location is automatically detected (allow browser location permission)
- Enter your mobile number (this will be shared with delivery boys)

### Step 2: Create Delivery Request
Fill in the customer details form:

1. **Customer Location Link** - Paste Google Maps link
   - Example: `https://maps.google.com/?q=28.6139,77.2090`
   - Or just coordinates: `28.6139,77.2090`

2. **Customer Name** - Full name of the customer

3. **Customer Mobile** - 10-digit mobile number

4. **Full Address** - Complete delivery address

5. **Landmark** - Important: This is what delivery boys see initially
   - Example: "Near Metro Station, Blue Building"
   - ⚠️ Only landmark is shared before acceptance

6. **Delivery Price** - Amount the delivery boy will earn
   - Example: ₹50

### Step 3: Send Request
- Click "Send to Available Delivery Boys"
- System automatically finds free delivery boys
- WhatsApp message sent with:
  - ✅ Your shop location & mobile number
  - ✅ Customer landmark (NOT full address)
  - ✅ Delivery price

---

## 📱 WhatsApp Flow

### Initial Message to Delivery Boys:
```
🚀 New Delivery Request!

📍 Pickup: [Your Shop Address]
📞 Shop Contact: [Your Mobile]

📦 Delivery: Near Metro Station, Blue Building
💰 Delivery Fee: ₹50

Reply ACCEPT or DECLINE
```

### When Delivery Boy Accepts:
- ✅ You see their name and mobile number
- ✅ They receive full customer location and mobile
- ✅ Map shows real-time tracking
- ❌ Other delivery boys notified it's taken

### When Delivery Boy Declines:
- You see who declined
- Request stays active for others

---

## 🗺️ Live Tracking

After acceptance, you'll see:

**Map Legend:**
- 🔵 Blue Marker = Your Shop (Admin)
- 🔴 Red Marker = Customer Location
- 🟢 Green Marker = Delivery Boy (updates every 5 seconds)

**Delivery Boy Information:**
- Name
- Mobile number
- Live location
- Route visualization

---

## 🎯 Key Features

### Privacy Protection
- ⚠️ Delivery boys only see customer **landmark** initially
- ✅ Full address shared ONLY after acceptance
- ✅ Your mobile number shared so they can call you

### One-Time Assignment
- ⏱️ First to accept gets the job
- ❌ Others automatically rejected
- 🔒 No double booking

### Real-Time Updates
- Live delivery boy location
- Acceptance/Decline notifications
- Auto-refresh every 3-5 seconds

---

## 🛠️ Troubleshooting

### Location Not Detected?
1. Allow location permission in browser
2. Click "Refresh Location" button
3. Or manually enter coordinates

### No Delivery Boys Responding?
- Check if any are marked as "available" in system
- Verify WhatsApp integration is working
- Check backend logs

### Map Not Loading?
- Ensure internet connection
- Check that customer location link is valid
- Try refreshing the page

---

## 📊 Admin Dashboard Views

### Shipment Creation Page (`/shipment`)
- Create new delivery requests
- See real-time acceptance status
- Track delivery boy location

### Rider Tracking Page (`/tracking`)
- View all active riders on map
- See rider availability status
- Monitor fleet in real-time

---

## 🔐 Privacy & Security

**What Delivery Boys See (Before Accept):**
- ✅ Your shop location
- ✅ Your mobile number
- ✅ Customer landmark only
- ✅ Delivery price

**What Delivery Boys See (After Accept):**
- ✅ Full customer address
- ✅ Customer mobile number
- ✅ Live navigation to customer

**What You See:**
- ✅ Delivery boy name & mobile
- ✅ Delivery boy live location
- ✅ Customer location
- ✅ Who accepted/declined

---

## 💡 Best Practices

1. **Always verify location** - Make sure auto-detected location is correct
2. **Accurate landmarks** - Help delivery boys find customers easily
3. **Fair pricing** - Set reasonable delivery fees
4. **Monitor tracking** - Watch delivery progress in real-time
5. **Contact riders** - Call if there are delays or issues

---

## 📞 Support

For technical issues:
- Check browser console (F12) for errors
- Verify backend is running at `http://localhost:8000`
- Ensure `.env` file has correct `VITE_BACKEND_BASE_URL`

For WhatsApp issues:
- Verify Meta Graph API or Twilio credentials
- Check webhook signature verification
- Review backend logs for API errors

---

## 🎨 UI Components

### Status Indicators
- 🟡 Yellow = Waiting for acceptance
- 🟢 Green = Accepted by rider
- 🔴 Red = Declined
- ⚫ Gray = Pending response

### Buttons
- **Refresh Location** - Update your GPS coordinates
- **Send Request** - Broadcast to available riders
- **Map Controls** - Zoom, pan, full screen

---

## 🚦 System Requirements

**Browser:**
- Chrome, Firefox, Edge (latest versions)
- Location permission enabled
- JavaScript enabled

**Backend:**
- FastAPI server running on port 8000
- PostgreSQL database
- WhatsApp API configured

**Network:**
- Internet connection for maps
- WebSocket support for real-time updates

---

## 📈 Future Enhancements

Coming soon:
- 📊 Analytics dashboard
- 📜 Delivery history
- ⭐ Rider ratings
- 📧 Email notifications
- 💬 In-app chat with riders
- 🔔 Push notifications

---

**Ready to create your first delivery request? Let's go! 🚀**


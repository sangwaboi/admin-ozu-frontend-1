import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ShipmentForm from './ShipmentForm';
import LiveTrackingMap from './LiveTrackingMap';
import DeliveryBoyStatus from './DeliveryBoyStatus';

export interface AdminLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface CustomerDetails {
  name: string;
  mobile: string;
  locationLink: string;
  address: string;
  landmark: string;
  price: number;
}

export interface ShipmentRequest {
  adminLocation: AdminLocation;
  adminMobile: string;
  customer: CustomerDetails;
}

function AdminShipment() {
  const navigate = useNavigate();
  const [adminLocation, setAdminLocation] = useState<AdminLocation | null>(null);
  const [adminMobile, setAdminMobile] = useState<string>('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [allShipments, setAllShipments] = useState<any[]>([]);
  const [completedShipments, setCompletedShipments] = useState<any[]>([]);
  const [activeShipmentIndex, setActiveShipmentIndex] = useState<number>(0);
  const [activeShipment, setActiveShipment] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState<'active' | 'completed'>('active');
  const [notifications, setNotifications] = useState<string[]>([]);

  // Fetch admin's live location
  useEffect(() => {
    fetchAdminLocation();
  }, []);

  // Restore admin mobile from localStorage
  useEffect(() => {
    const savedMobile = localStorage.getItem('adminMobile');
    if (savedMobile) {
      setAdminMobile(savedMobile);
    }

    const savedLocation = localStorage.getItem('adminLocation');
    if (savedLocation) {
      try {
        setAdminLocation(JSON.parse(savedLocation));
      } catch (error) {
        console.error('Failed to parse saved location:', error);
      }
    }
  }, []);

  // Fetch active shipments
  const fetchActiveShipments = async () => {
    const mobile = localStorage.getItem('adminMobile');
    if (!mobile) return;

    try {
      const url = `${import.meta.env.VITE_BACKEND_BASE_URL}/shipments/active?adminMobile=${encodeURIComponent(mobile)}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          setAllShipments([]);
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data && Array.isArray(data)) {
        // Check for status changes (delivered shipments)
        const previousIds = allShipments.map(s => s.id);
        const newIds = data.map((s: any) => s.id);
        
        // Find shipments that were removed (moved to completed)
        const removedIds = previousIds.filter(id => !newIds.includes(id));
        if (removedIds.length > 0 && allShipments.length > 0) {
          removedIds.forEach(id => {
            const shipment = allShipments.find(s => s.id === id);
            if (shipment) {
              showNotification(`📦 Shipment #${id} has been delivered! ✅`);
            }
          });
        }
        
        // Check for newly accepted shipments
        data.forEach((newShipment: any) => {
          const oldShipment = allShipments.find(s => s.id === newShipment.id);
          if (oldShipment && oldShipment.status === 'pending' && newShipment.status === 'assigned') {
            showNotification(`✅ Shipment #${newShipment.id} has been accepted!`);
          }
        });
        
        setAllShipments(data);
        
        // Update active shipment if it still exists
        if (activeShipment) {
          const updated = data.find((s: any) => s.id === activeShipment.id);
          if (updated) {
            setActiveShipment(updated);
          } else if (data.length > 0) {
            // Active shipment was removed, select first available
            setActiveShipment(data[0]);
            setActiveShipmentIndex(0);
          } else {
            setActiveShipment(null);
          }
        } else if (data.length > 0 && !activeShipment) {
          setActiveShipment(data[0]);
          setActiveShipmentIndex(0);
        }
      }
    } catch (error) {
      console.error('Error fetching active shipments:', error);
    }
  };

  // Fetch completed shipments
  const fetchCompletedShipments = async () => {
    const mobile = localStorage.getItem('adminMobile');
    if (!mobile) return;

    try {
      const url = `${import.meta.env.VITE_BACKEND_BASE_URL}/shipments/completed?adminMobile=${encodeURIComponent(mobile)}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          setCompletedShipments([]);
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data && Array.isArray(data)) {
        setCompletedShipments(data);
      }
    } catch (error) {
      console.error('Error fetching completed shipments:', error);
    }
  };

  // Show notification
  const showNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(m => m !== message));
    }, 5000);
  };

  // Initial load of active shipments
  useEffect(() => {
    const timer = setTimeout(fetchActiveShipments, 500);
    return () => clearTimeout(timer);
  }, []);

  // Polling: Fetch active shipments every 5 seconds
  useEffect(() => {
    const mobile = localStorage.getItem('adminMobile');
    if (!mobile) return;

    const interval = setInterval(() => {
      fetchActiveShipments();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [allShipments, activeShipment]); // Re-run when shipments change

  const fetchAdminLocation = () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location: AdminLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        // Reverse geocode to get address
        try {
          const address = await reverseGeocode(location.latitude, location.longitude);
          location.address = address;
        } catch (error) {
          console.error('Failed to get address:', error);
        }

        setAdminLocation(location);
        setIsLoadingLocation(false);
      },
      (error) => {
        setLocationError(`Failed to get location: ${error.message}`);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await response.json();
      return data.display_name || 'Address not found';
    } catch (error) {
      return 'Address not found';
    }
  };

  const handleShipmentCreate = async (customerDetails: CustomerDetails, specificRiderId?: string) => {
    if (!adminLocation) {
      alert('Admin location not available. Please refresh location.');
      return;
    }

    if (!adminMobile) {
      alert('Please enter your mobile number first');
      return;
    }

    const shipmentRequest: ShipmentRequest & { specificRiderId?: string } = {
      adminLocation,
      adminMobile,
      customer: customerDetails,
    };

    // Add specific rider ID if provided
    if (specificRiderId) {
      shipmentRequest.specificRiderId = specificRiderId;
      console.log('📤 Sending to SPECIFIC rider:', specificRiderId);
    } else {
      console.log('📤 Sending to ALL available riders (broadcast)');
    }

    console.log('📤 Request payload:', JSON.stringify(shipmentRequest, null, 2));

    try {
      // Call API to create shipment and notify delivery boy(s)
      const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/shipments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shipmentRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('❌ Backend error:', response.status, errorData);
        
        // Handle specific error codes
        switch (response.status) {
          case 400:
            alert(`❌ ${errorData.detail || 'Invalid request. Please check your input.'}`);
            break;
          case 404:
            alert('❌ Rider not found. Please select a different delivery boy.');
            break;
          case 500:
            alert('❌ Server error. Please try again later.');
            break;
          default:
            alert(`❌ Error: ${errorData.detail || 'An error occurred'}`);
        }
        return;
      }

      const data = await response.json();
      console.log('✅ Shipment created:', data);
      
      // Add new shipment to the list
      const newShipments = [...allShipments, data];
      setAllShipments(newShipments);
      setActiveShipmentIndex(newShipments.length - 1);
      setActiveShipment(data);
      
      // Check if no riders were notified
      if (data.notifiedRiders && data.notifiedRiders.length === 0) {
        alert(`⚠️ Shipment #${data.id} created, but no delivery boys are currently available.\n\nThe shipment has been saved. You can resend the notification later when riders become available.`);
      } else if (specificRiderId) {
        alert(`✅ Shipment #${data.id} request sent to the selected delivery boy!`);
      } else {
        const riderCount = data.notifiedRiders?.length || 0;
        alert(`✅ Shipment #${data.id} created! Notified ${riderCount} rider(s).`);
      }
    } catch (error) {
      console.error('Failed to create shipment:', error);
      alert('❌ Network error. Please check your connection and try again.');
    }
  };

  const handleShipmentSwitch = (index: number) => {
    setActiveShipmentIndex(index);
    setActiveShipment(allShipments[index]);
  };

  const handleTabSwitch = (tab: 'active' | 'completed') => {
    setCurrentTab(tab);
    if (tab === 'completed') {
      fetchCompletedShipments();
    }
  };

  const handleResendNotification = async (shipmentId: number) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/shipments/${shipmentId}/resend`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to resend' }));
        alert(`❌ ${errorData.detail}`);
        return;
      }

      const data = await response.json();
      console.log('✅ Resend response:', data);

      if (data.notifiedRiders && data.notifiedRiders.length === 0) {
        alert('⚠️ Still no delivery boys available. Please try again later.');
      } else {
        const riderCount = data.notifiedRiders?.length || 0;
        alert(`✅ Notification resent to ${riderCount} rider(s)!`);
        
        // Refresh shipments list
        const mobile = localStorage.getItem('adminMobile');
        if (mobile) {
          const url = `${import.meta.env.VITE_BACKEND_BASE_URL}/shipments/active?adminMobile=${encodeURIComponent(mobile)}`;
          const refreshResponse = await fetch(url);
          if (refreshResponse.ok) {
            const refreshedData = await refreshResponse.json();
            if (refreshedData && Array.isArray(refreshedData) && refreshedData.length > 0) {
              setAllShipments(refreshedData);
              // Find and set the active shipment
              const updated = refreshedData.find((s: any) => s.id === shipmentId);
              if (updated) {
                setActiveShipment(updated);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error resending notification:', error);
      alert('❌ Failed to resend notification. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification, index) => (
          <div
            key={index}
            className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{notification}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Shipment Portal</h1>
              <p className="text-sm text-gray-500 mt-1">Create and manage delivery requests</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  // Store admin info in localStorage before navigating
                  if (adminMobile && adminLocation) {
                    localStorage.setItem('adminMobile', adminMobile);
                    localStorage.setItem('adminLocation', JSON.stringify(adminLocation));
                  }
                  navigate('/map');
                }}
                disabled={!adminMobile || !adminLocation}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                MAP
              </button>
              <button
                onClick={fetchAdminLocation}
                disabled={isLoadingLocation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
              >
                {isLoadingLocation ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Fetching...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Refresh Location
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Admin Location Display */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900">Your Location (Shop Address)</h3>
                {adminLocation ? (
                  <div className="mt-1">
                    <p className="text-sm text-blue-800">{adminLocation.address || 'Getting address...'}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Lat: {adminLocation.latitude.toFixed(6)}, Lng: {adminLocation.longitude.toFixed(6)}
                    </p>
                  </div>
                ) : locationError ? (
                  <p className="text-sm text-red-600 mt-1">{locationError}</p>
                ) : (
                  <p className="text-sm text-blue-700 mt-1">Fetching your location...</p>
                )}
              </div>
            </div>

            {/* Admin Mobile Number */}
            <div className="mt-3 pt-3 border-t border-blue-200">
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Your Mobile Number (Shared with delivery boy)
              </label>
              <input
                type="tel"
                value={adminMobile}
                onChange={(e) => {
                  const mobile = e.target.value;
                  setAdminMobile(mobile);
                  // Save to localStorage for persistence
                  if (mobile) {
                    localStorage.setItem('adminMobile', mobile);
                  }
                }}
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Shipment Form */}
          <div>
            <ShipmentForm
              onSubmit={handleShipmentCreate}
              disabled={!adminLocation || !adminMobile}
            />
          </div>

          {/* Right: Tracking & Status */}
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {/* Tab Headers */}
              <div className="flex border-b">
                <button
                  onClick={() => handleTabSwitch('active')}
                  className={`flex-1 px-6 py-3 font-semibold text-sm transition-all ${
                    currentTab === 'active'
                      ? 'bg-blue-600 text-white border-b-2 border-blue-700'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Active Shipments
                    {allShipments.length > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                        currentTab === 'active' ? 'bg-blue-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {allShipments.length}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => handleTabSwitch('completed')}
                  className={`flex-1 px-6 py-3 font-semibold text-sm transition-all ${
                    currentTab === 'completed'
                      ? 'bg-green-600 text-white border-b-2 border-green-700'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Completed
                    {completedShipments.length > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                        currentTab === 'completed' ? 'bg-green-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {completedShipments.length}
                      </span>
                    )}
                  </div>
                </button>
              </div>

              {/* Tab Content */}
              {currentTab === 'active' ? (
                allShipments.length > 0 ? (
                  <div className="p-2">
                    <div className="flex flex-wrap gap-2">
                      {allShipments.map((shipment, index) => (
                        <button
                          key={shipment.id}
                          onClick={() => handleShipmentSwitch(index)}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                            activeShipmentIndex === index
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>Shipment #{shipment.id}</span>
                            {shipment.status === 'assigned' && (
                              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                            )}
                            {shipment.status === 'pending' && (
                              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-sm text-gray-500">No active shipments</p>
                  </div>
                )
              ) : (
                <div className="p-4">
                  {completedShipments.length > 0 ? (
                    <div className="space-y-3">
                      {completedShipments.map((shipment) => (
                        <div key={shipment.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900">Shipment #{shipment.id}</h4>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✅ Delivered
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-700">
                                ₹{shipment.price || 0}
                              </div>
                            </div>
                          </div>

                          {/* Customer Details */}
                          <div className="bg-white rounded-lg p-3 mb-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Customer</p>
                            <div className="space-y-1 text-sm text-gray-700">
                              <p><strong>Name:</strong> {shipment.customerName || 'N/A'}</p>
                              <p><strong>Mobile:</strong> {shipment.customerMobile || 'N/A'}</p>
                              <p><strong>Landmark:</strong> {shipment.landmark || 'N/A'}</p>
                            </div>
                          </div>

                          {/* Delivery Boy Details */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                            <p className="text-xs font-semibold text-blue-700 uppercase mb-2">🏍️ Delivered By</p>
                            <div className="space-y-1 text-sm text-gray-700">
                              <p><strong>Name:</strong> {shipment.assignedRiderName || 'N/A'}</p>
                              <p><strong>Mobile:</strong> {shipment.assignedRiderMobile || 'N/A'}</p>
                            </div>
                          </div>

                          {/* Timestamp */}
                          {shipment.deliveredAt && (
                            <p className="text-xs text-gray-500 mt-2">
                              🕐 Delivered: {new Date(shipment.deliveredAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-gray-500">No completed shipments yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Active Shipment Details - Only show on Active tab */}
            {currentTab === 'active' && activeShipment && (
              <>
                <DeliveryBoyStatus 
                  shipmentId={activeShipment.id}
                  shipmentStatus={activeShipment.status}
                  onResend={handleResendNotification}
                />
                <LiveTrackingMap
                  adminLocation={adminLocation}
                  shipment={activeShipment}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminShipment;


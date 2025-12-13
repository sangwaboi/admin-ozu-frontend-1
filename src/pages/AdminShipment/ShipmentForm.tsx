import { useState } from 'react';
import { CustomerDetails } from './index';
import LocationSearchInput, { LocationResult } from '../../components/LocationSearchInput';
import { authenticatedFetch } from '../../lib/api';

interface Rider {
  id: string;
  name: string;
  mobile: string;
  zone: string;
  isAvailable: boolean;
}

interface ShipmentFormProps {
  onSubmit: (customer: CustomerDetails, specificRiderId?: string) => void;
  disabled?: boolean;
}

function ShipmentForm({ onSubmit, disabled }: ShipmentFormProps) {
  const [formData, setFormData] = useState<CustomerDetails>({
    name: '',
    mobile: '',
    locationLink: '',
    address: '',
    landmark: '',
    price: 0,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CustomerDetails, string>>>({});
  const [showRiderModal, setShowRiderModal] = useState(false);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loadingRiders, setLoadingRiders] = useState(false);
  const [selectedRider, setSelectedRider] = useState<string | null>(null);
  const [customerLocationDisplay, setCustomerLocationDisplay] = useState<string>('');
  const [customerHouseAddress, setCustomerHouseAddress] = useState<string>('');
  const [customerLandmark, setCustomerLandmark] = useState<string>('');

  const handleChange = (field: keyof CustomerDetails, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCustomerLocationSelect = (location: LocationResult) => {
    // Store location as coordinates format that backend can parse
    const locationLink = `${location.lat},${location.lng}`;
    
    // Build full address from location + house address
    const fullAddress = [
      customerHouseAddress,
      location.address
    ].filter(Boolean).join(', ');
    
    setFormData((prev) => ({ 
      ...prev, 
      locationLink,
      address: fullAddress || location.address,
      landmark: customerLandmark || location.landmark || prev.landmark
    }));
    
    setCustomerLocationDisplay(location.displayName);
    
    // Clear errors
    setErrors((prev) => ({ 
      ...prev, 
      locationLink: undefined,
      address: undefined,
      landmark: undefined
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CustomerDetails, string>> = {};

    if (!formData.name.trim()) newErrors.name = 'Customer name is required';
    if (!formData.mobile.trim()) newErrors.mobile = 'Mobile number is required';
    if (!/^[6-9]\d{9}$/.test(formData.mobile.replace(/\s+/g, ''))) {
      newErrors.mobile = 'Enter valid 10-digit mobile number';
    }

    // Customer location must be selected from the search box so backend gets lat/lng
    if (!formData.locationLink.trim()) {
      newErrors.locationLink = 'Please select customer location using the search above';
    }

    if (!formData.address.trim()) newErrors.address = 'Address is required';

    // Make landmark optional (nice to have, but should not block sending requests)
    // if (!formData.landmark.trim()) newErrors.landmark = 'Landmark is required';

    if (formData.price <= 0) newErrors.price = 'Price must be greater than 0';

    setErrors(newErrors);

    const isValid = Object.keys(newErrors).length === 0;
    if (!isValid) {
      // Extra feedback so it's obvious why the request didn't go out
      console.warn('[ShipmentForm] Validation failed', newErrors);
    }
    return isValid;
  };

  const fetchRiders = async () => {
    setLoadingRiders(true);
    try {
      const response = await authenticatedFetch('/riders/available');
      
      if (!response.ok) {
        // Handle different error statuses
        if (response.status === 403) {
          console.error('Access denied: You may not have permission to view riders');
          setRiders([]); // Set empty array to prevent .map() error
          return;
        }
        if (response.status === 401) {
          console.error('Authentication required');
          setRiders([]);
          return;
        }
        throw new Error(`Failed to fetch riders: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Ensure data is an array before setting it
      if (Array.isArray(data)) {
        setRiders(data);
      } else {
        console.error('Invalid response format: expected array, got', typeof data);
        setRiders([]); // Set empty array to prevent .map() error
      }
    } catch (error) {
      console.error('Failed to fetch riders:', error);
      // Set empty array on error to prevent .map() crash
      setRiders([]);
      // Don't show alert - let the empty state UI handle it
    } finally {
      setLoadingRiders(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
      // Reset form after submission
      setFormData({
        name: '',
        mobile: '',
        locationLink: '',
        address: '',
        landmark: '',
        price: 0,
      });
      setCustomerLocationDisplay('');
      setCustomerHouseAddress('');
      setCustomerLandmark('');
    }
  };

  const handleSpecificRiderClick = () => {
    if (!validate()) return;
    fetchRiders();
    setShowRiderModal(true);
  };

  const handleSendToSpecificRider = () => {
    if (!selectedRider) {
      alert('Please select a rider');
      return;
    }
    
    console.log('🎯 Selected rider ID:', selectedRider);
    console.log('📦 Customer data:', formData);
    
    onSubmit(formData, selectedRider);
    setShowRiderModal(false);
    setSelectedRider(null);
    // Reset form after submission
    setFormData({
      name: '',
      mobile: '',
      locationLink: '',
      address: '',
      landmark: '',
      price: 0,
    });
    setCustomerLocationDisplay('');
    setCustomerHouseAddress('');
    setCustomerLandmark('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-5">Create Delivery Request</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Customer Location Search */}
        <div>
          <LocationSearchInput
            value={customerLocationDisplay}
            onChange={handleCustomerLocationSelect}
            placeholder="Search for customer location..."
            label="Customer Location"
            required
            error={errors.locationLink}
            showAddressFields={true}
            houseAddress={customerHouseAddress}
            landmark={customerLandmark}
            onHouseAddressChange={(value) => {
              setCustomerHouseAddress(value);
              if (formData.locationLink) {
                const fullAddress = [value, customerLocationDisplay].filter(Boolean).join(', ');
                setFormData(prev => ({ ...prev, address: fullAddress }));
              }
            }}
            onLandmarkChange={(value) => {
              setCustomerLandmark(value);
              setFormData(prev => ({ ...prev, landmark: value }));
              setErrors(prev => ({ ...prev, landmark: undefined }));
            }}
          />
        </div>

        {/* Customer Name */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Customer Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="John Doe"
            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors bg-gray-50 ${
              errors.name ? 'border-red-400' : 'border-gray-200'
            }`}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* Customer Mobile */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Customer Mobile Number <span className="text-red-400">*</span>
          </label>
          <input
            type="tel"
            value={formData.mobile}
            onChange={(e) => handleChange('mobile', e.target.value)}
            placeholder="+91 XXXXX XXXXX"
            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors bg-gray-50 ${
              errors.mobile ? 'border-red-400' : 'border-gray-200'
            }`}
          />
          {errors.mobile && <p className="text-xs text-red-500 mt-1">{errors.mobile}</p>}
        </div>

        {/* Address and Landmark are now included in LocationSearchInput above */}
        {/* Display selected address for confirmation */}
        {formData.address && (
          <div className="p-2.5 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs font-semibold text-green-900 uppercase mb-1">Selected Address</p>
            <p className="text-xs sm:text-sm text-green-800 break-words">{formData.address}</p>
            {formData.landmark && (
              <p className="text-xs text-green-700 mt-1">
                📍 Landmark: {formData.landmark}
              </p>
            )}
          </div>
        )}

        {/* Delivery Price */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Delivery Price (₹) <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            value={formData.price || ''}
            onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
            placeholder="50"
            min="0"
            step="10"
            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors bg-gray-50 ${
              errors.price ? 'border-red-400' : 'border-gray-200'
            }`}
          />
          {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
          <p className="text-xs text-gray-400 mt-1">Amount rider will receive</p>
        </div>

        {/* Submit Buttons */}
        <div className="space-y-2.5 sm:space-y-3 pt-2">
          <button
            type="submit"
            disabled={disabled}
            className="w-full py-3 sm:py-3.5 px-4 text-sm sm:text-base bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-lg sm:rounded-xl hover:from-violet-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/30 touch-manipulation"
          >
            {disabled ? (
              <>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-xs sm:text-sm">Please enable location & mobile number</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span className="text-xs sm:text-sm">Send to Available Riders</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSpecificRiderClick}
            disabled={disabled}
            className="w-full py-2.5 sm:py-3 px-4 text-sm sm:text-base border border-gray-200 text-gray-700 font-medium rounded-lg sm:rounded-xl hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 touch-manipulation"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs sm:text-sm">Send to Specific Rider</span>
          </button>
        </div>
      </form>

      {/* Rider Selection Modal */}
      {showRiderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-2 sm:p-4">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] sm:max-h-[80vh] overflow-hidden relative z-[10000] flex flex-col">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b flex items-center justify-between flex-shrink-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Select Rider</h3>
              <button
                onClick={() => {
                  setShowRiderModal(false);
                  setSelectedRider(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 touch-manipulation"
                aria-label="Close"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
              {loadingRiders ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-blue-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : riders.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <p className="text-sm sm:text-base text-gray-500">No available riders</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {riders.map((rider) => (
                    <div
                      key={rider.id}
                      onClick={() => setSelectedRider(rider.id)}
                      className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-all touch-manipulation ${
                        selectedRider === rider.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 active:border-blue-300 active:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{rider.name}</h4>
                            {rider.isAvailable && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 flex-shrink-0">
                                Available
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1 break-all">📞 {rider.mobile}</p>
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">📍 Zone: {rider.zone || 'N/A'}</p>
                        </div>
                        {selectedRider === rider.id && (
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t bg-gray-50 flex gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setShowRiderModal(false);
                  setSelectedRider(null);
                }}
                className="flex-1 py-2.5 sm:py-2 px-3 sm:px-4 text-sm sm:text-base border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
              >
                Cancel
              </button>
              <button
                onClick={handleSendToSpecificRider}
                disabled={!selectedRider}
                className="flex-1 py-2.5 sm:py-2 px-3 sm:px-4 text-sm sm:text-base bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors touch-manipulation"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShipmentForm;


const BASE_URL = (import.meta as any)?.env?.VITE_BACKEND_BASE_URL || "http://localhost:8000";

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Accept": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export function getBaseUrl() {
  return BASE_URL;
}

// Riders endpoints (adjust to your FastAPI routes if needed)
export const RidersAPI = {
  listLive: () => apiGet<import("../types/rider").Rider[]>("/riders/live"),
};

// Shipment endpoints
export const ShipmentAPI = {
  create: async (data: any) => {
    const res = await fetch(`${BASE_URL}/shipments/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  },
  
  getResponses: (shipmentId: string) => 
    apiGet<any>(`/shipments/${shipmentId}/responses`),
  
  getRiderLocation: (riderId: string) =>
    apiGet<{ lat: number; lng: number }>(`/riders/${riderId}/location`),
  
  resendNotification: async (shipmentId: number) => {
    const res = await fetch(`${BASE_URL}/shipments/${shipmentId}/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  },
  
  getActive: (adminMobile: string) =>
    apiGet<any[]>(`/shipments/active?adminMobile=${encodeURIComponent(adminMobile)}`),
  
  getCompleted: (adminMobile: string) =>
    apiGet<any[]>(`/shipments/completed?adminMobile=${encodeURIComponent(adminMobile)}`),
};


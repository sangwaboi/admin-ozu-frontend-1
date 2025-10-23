import { useState, useEffect } from 'react';
import { Shipment } from '@/types/shipment';
import { api } from '@/lib/api';

export const useShipments = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        setLoading(true);
        const response = await api.get('/shipments');
        setShipments(response.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch shipments');
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();
  }, []);

  return { shipments, loading, error };
};



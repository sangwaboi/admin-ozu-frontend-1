import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminPortal from '@/pages/AdminPortal';
import AdminShipment from '@/pages/AdminShipment';
import AllShipmentsMap from '@/pages/AllShipmentsMap';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/shipment" replace />} />
        <Route path="/shipment" element={<AdminShipment />} />
        <Route path="/map" element={<AllShipmentsMap />} />
        <Route path="/tracking" element={<AdminPortal />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


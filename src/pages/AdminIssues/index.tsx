import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShipmentIssue } from '@/types/issue';
import { IssuesAPI } from '@/lib/api';
import IssueCard from './IssueCard';
import { Home, Map, AlertTriangle, Bike, RotateCcw,ArrowLeft } from 'lucide-react';
import Lottie from 'lottie-react';
import loadingIssuesAnimation from '@/assets/loading-issues.json';


export default function AdminIssues() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<ShipmentIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] =
    useState<'all' | 'reported' | 'admin_responded' | 'resolved'>('all');

  const fetchIssues = async () => {
    try {
      const data = await IssuesAPI.getAll();
      setIssues(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
    const interval = setInterval(fetchIssues, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredIssues = issues.filter(i =>
    filter === 'all' ? true : i.status === filter
  );

  const count = (s: ShipmentIssue['status']) =>
    issues.filter(i => i.status === s).length;

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-28 font-[DM Sans]">

      {/* ================= TOP BAR ================= */}
<header className="bg-white px-4 pt-4 pb-3">


        <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/shipment')}>
            <ArrowLeft />
          </button>
          {/* OZU LOGO */}
<div className="w-[109px] h-[46px] flex items-center">
  <img
    src="/ozu-logo.png"
    alt="OZU"
    className="h-[32px] w-auto object-contain"
  />
</div>

        </div>

         {/* PROFILE AVATAR */}
  <button
    onClick={() => navigate('/profile')}
    className="w-[46px] h-[46px] rounded-full border border-black overflow-hidden"
  >
    <img
      src="/ava2.png"
      alt="Profile"
      className="w-full h-full object-cover"
    />
  </button>

        </div>

       <div className="mt-3 flex justify-between">
  {/* LEFT: Title + subtitle stacked */}
  <div>
    <h2
      className="
        text-[20px]
        font-bold
        leading-[120%]
        tracking-[-0.02em]
        text-[#111111]
      "
    >
      Delivery Issues
    </h2>

    <p
      className="
        mt-[2px]
        text-[14px]
        font-medium
        leading-[130%]
        tracking-[-0.01em]
        text-[#5F5F5F]
      "
    >
      Manage and respond to delivery issues
    </p>
  </div>

  {/* RIGHT: Refresh button */}
  <button
    onClick={fetchIssues}
    className="
      flex items-center gap-2
      w-[101px] h-[32px]
      px-3
      border border-[#EAE6E6]
      rounded-lg
      text-[13px]
      font-medium
      text-[#111111]
      bg-white
      self-start
    "
  >
    <RotateCcw className="w-4 h-4" />
    Refresh
  </button>
</div>

      </header>

      {/* ================= FILTER CARDS ================= */}
<div className="px-4 bg-white pt-4">

        <div className="grid grid-cols-4 gap-2">
          <FilterBox
            label="All Issues"
            value={issues.length}
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          <FilterBox
            label="Need Response"
            value={count('reported')}
            color="red"
            active={filter === 'reported'}
            onClick={() => setFilter('reported')}
          />
          <FilterBox
            label="Waiting for Rider"
            value={count('admin_responded')}
            color="green"
            active={filter === 'admin_responded'}
            onClick={() => setFilter('admin_responded')}
          />
          <FilterBox
            label="Resolved"
            value={count('resolved')}
            color="blue"
            active={filter === 'resolved'}
            onClick={() => setFilter('resolved')}
          />
          
        </div>
      </div>

      {/* ================= ISSUE LIST ================= */}
      <div className="px-4 mt-4 space-y-4">
        {loading ? (
  <div className="flex justify-center items-center py-10">
    <Lottie
      animationData={loadingIssuesAnimation}
      loop
      className="w-[180px] h-[180px]"
    />
  </div>
) : (

          filteredIssues.map(issue => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onUpdate={fetchIssues}
            />
          ))
        )}
      </div>

      {/* ================= BOTTOM NAV ================= */}
      {/* ===== BOTTOM NAV (FIGMA EXACT) ===== */}
<nav className="fixed bottom-0 left-0 right-0 z-50 h-[76px] bg-white rounded-t-2xl shadow-[0_-1px_12px_rgba(0,0,0,0.11)]">
  <div className="max-w-[439px] mx-auto h-full flex justify-around items-center">
    
    {/* HOME */}
    <button
      onClick={() => navigate('/shipment')}
      className="flex flex-col items-center justify-center text-[11px] font-medium text-[#2B2B2B]"
    >
      <Home size={22} strokeWidth={1.8} />
      <span className="mt-1">HOME</span>
    </button>

    {/* ISSUES (ACTIVE SAMPLE) */}
    <button
      onClick={() => navigate('/issues')}
      className="flex flex-col items-center justify-center text-[11px] font-medium text-[#2B2B2B]"
    >
      <AlertTriangle size={22} strokeWidth={1.8} />
      <span className="mt-1">ISSUES</span>
    </button>

    {/* MAP */}
    <button
      onClick={() => navigate('/map')}
      className="flex flex-col items-center justify-center text-[11px] font-medium text-[#2B2B2B]"
    >
      <Map size={22} strokeWidth={1.8} />
      <span className="mt-1">MAP</span>
    </button>

    {/* RIDERS */}
    <button
      onClick={() => navigate('/riders')}
      className="flex flex-col items-center justify-center text-[11px] font-medium text-[#2B2B2B]"
    >
      <Bike size={22} strokeWidth={1.8} />
      <span className="mt-1">RIDERS</span>
    </button>

  </div>
</nav>

    </div>
  );
}

/* ================= FILTER CARD ================= */

function FilterBox({
  label,
  value,
  active,
  onClick,
  color = 'gray',
}: any) {
 const colors: any = {
  gray: 'bg-[#E5E5E5] text-[#2B2B2B]',
  red: 'bg-[#FFE4E1] text-[#E53935]',
  green: 'bg-[#EAF4D3] text-[#7CB342]',
  blue: 'bg-[#E3E7FF] text-[#5C6BC0]',
};

  return (
    <button
      onClick={onClick}
     className={`
  h-[74px]
  rounded-xl
  p-2
  border
  text-center
  ${active ? 'border-[#111111]' : 'border-transparent'}
  ${colors[color]}
`}

    >
     <div className="text-[20px] font-bold leading-none">
  {value}
</div>
<div className="mt-1 text-[11px] font-semibold leading-tight">
  {label}
</div>
    </button>
  );
}

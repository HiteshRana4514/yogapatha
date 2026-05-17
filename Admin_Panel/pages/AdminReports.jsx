import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  UserCheck,
  Calendar,
  Loader2,
  AlertCircle,
  DollarSign,
  CreditCard,
  Wallet
} from 'lucide-react';
import supabase from '../../src/supabase/supabse';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const AdminReports = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Stats
  const [clientStats, setClientStats] = useState({ total: 0, prevTotal: 0, demo: 0, permanent: 0, trend: 0 });
  const [trainerStats, setTrainerStats] = useState({ total: 0, prevTotal: 0, active: 0, pending: 0, trend: 0 });
  const [financeStats, setFinanceStats] = useState({ totalRevenue: 0, prevRevenue: 0, trend: 0, totalPlatformFee: 0, totalPayouts: 0 });
  
  // Charts Data
  const [monthlyClientData, setMonthlyClientData] = useState([]);
  const [kycData, setKycData] = useState([]);
  const [monthlyFinanceData, setMonthlyFinanceData] = useState([]);
  
  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      // 1. Fetch Data
      const [
        { data: clients, error: clientsError },
        { data: trainers, error: trainersError },
        { data: payments, error: paymentsError },
        { data: payouts, error: payoutsError }
      ] = await Promise.all([
        supabase.from('clients').select('id, created_at, class_type, status'),
        supabase.from('trainer_profiles').select('id, created_at, is_active, kyc_status'),
        supabase.from('client_payments').select('id, created_at, amount, status').eq('status', 'completed'),
        supabase.from('payment_transactions').select('id, created_at, platform_fee, trainer_amount, status').eq('status', 'completed')
      ]);

      if (clientsError) throw clientsError;
      if (trainersError) throw trainersError;
      if (paymentsError) throw paymentsError;
      if (payoutsError) throw payoutsError;

      // --- Process Stats Base ---
      // We'll initialize last 6 months for both charts
      const last6MonthsClients = [];
      const last6MonthsFinance = [];
      for (let i = 5; i >= 0; i--) {
        let m = currentMonth - i;
        let y = currentYear;
        if (m < 0) {
          m += 12;
          y -= 1;
        }
        last6MonthsClients.push({ monthName: `${MONTHS[m]} ${y}`, monthIdx: m, year: y, demo: 0, permanent: 0, total: 0 });
        last6MonthsFinance.push({ monthName: `${MONTHS[m]} ${y}`, monthIdx: m, year: y, revenue: 0, payouts: 0, platformFee: 0 });
      }

      // --- Process Client Stats ---
      let currClients = 0, prevClients = 0, demoCount = 0, permCount = 0;
      clients?.forEach(c => {
        const date = new Date(c.created_at);
        const m = date.getMonth();
        const y = date.getFullYear();

        if (m === currentMonth && y === currentYear) currClients++;
        if (m === prevMonth && y === prevYear) prevClients++;
        
        if (c.class_type === 'demo') demoCount++;
        if (c.class_type === 'permanent') permCount++;

        const monthEntry = last6MonthsClients.find( entry => entry.monthIdx === m && entry.year === y);
        if (monthEntry) {
          monthEntry.total++;
          if (c.class_type === 'demo') monthEntry.demo++;
          if (c.class_type === 'permanent') monthEntry.permanent++;
        }
      });
      const clientTrend = prevClients === 0 ? 100 : Math.round(((currClients - prevClients) / prevClients) * 100);
      setClientStats({ total: clients?.length || 0, prevTotal: prevClients, demo: demoCount, permanent: permCount, trend: clientTrend });
      setMonthlyClientData(last6MonthsClients);


      // --- Process Trainer Stats ---
      let currTrainers = 0, prevTrainers = 0, activeCount = 0, pendingCount = 0;
      const kycCounts = { approved: 0, pending: 0, rejected: 0 };
      trainers?.forEach(t => {
        const date = t.created_at ? new Date(t.created_at) : new Date();
        const m = date.getMonth();
        const y = date.getFullYear();

        if (m === currentMonth && y === currentYear) currTrainers++;
        if (m === prevMonth && y === prevYear) prevTrainers++;

        if (t.is_active) activeCount++;
        else pendingCount++;

        if (t.kyc_status === 'approved') kycCounts.approved++;
        else if (t.kyc_status === 'rejected') kycCounts.rejected++;
        else kycCounts.pending++;
      });
      const trainerTrend = prevTrainers === 0 ? 100 : Math.round(((currTrainers - prevTrainers) / prevTrainers) * 100);
      setTrainerStats({ total: trainers?.length || 0, prevTotal: prevTrainers, active: activeCount, pending: pendingCount, trend: trainerTrend });
      
      setKycData([
        { name: 'Approved', value: kycCounts.approved, color: '#10B981' },
        { name: 'Pending', value: kycCounts.pending, color: '#F59E0B' },
        { name: 'Rejected', value: kycCounts.rejected, color: '#EF4444' }
      ].filter(item => item.value > 0));


      // --- Process Finance Stats ---
      let currRevenue = 0, prevRevenue = 0, totalRev = 0;
      payments?.forEach(p => {
        const date = new Date(p.created_at);
        const m = date.getMonth();
        const y = date.getFullYear();
        const amt = parseFloat(p.amount) || 0;
        
        totalRev += amt;
        if (m === currentMonth && y === currentYear) currRevenue += amt;
        if (m === prevMonth && y === prevYear) prevRevenue += amt;

        const monthEntry = last6MonthsFinance.find( entry => entry.monthIdx === m && entry.year === y);
        if (monthEntry) monthEntry.revenue += amt;
      });

      let totalPlaformFee = 0, totalPayoutsAmt = 0;
      payouts?.forEach(p => {
        const date = new Date(p.created_at);
        const m = date.getMonth();
        const y = date.getFullYear();
        const pFee = parseFloat(p.platform_fee) || 0;
        const tAmt = parseFloat(p.trainer_amount) || 0;

        totalPlaformFee += pFee;
        totalPayoutsAmt += tAmt;

        const monthEntry = last6MonthsFinance.find( entry => entry.monthIdx === m && entry.year === y);
        if (monthEntry) {
            monthEntry.platformFee += pFee;
            monthEntry.payouts += tAmt;
        }
      });

      const revTrend = prevRevenue === 0 ? 100 : Math.round(((currRevenue - prevRevenue) / prevRevenue) * 100);

      setFinanceStats({
          totalRevenue: totalRev,
          prevRevenue: prevRevenue,
          trend: revTrend,
          totalPlatformFee: totalPlaformFee,
          totalPayouts: totalPayoutsAmt
      });

      setMonthlyFinanceData(last6MonthsFinance);

    } catch (err) {
      console.error('Error fetching reports data:', err);
      setError('Failed to load reports data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const TrendIndicator = ({ value }) => {
    if (value > 0) {
      return (
        <span className="flex items-center text-green-600 text-sm font-semibold bg-green-50 px-2 py-1 rounded-full">
          <TrendingUp className="w-4 h-4 mr-1" />
          +{value}%
        </span>
      );
    } else if (value < 0) {
      return (
        <span className="flex items-center text-red-600 text-sm font-semibold bg-red-50 px-2 py-1 rounded-full">
          <TrendingDown className="w-4 h-4 mr-1" />
          {value}%
        </span>
      );
    }
    return (
      <span className="flex items-center text-gray-500 text-sm font-semibold bg-gray-50 px-2 py-1 rounded-full">
        0%
      </span>
    );
  };

  const formatCurrency = (amt) => {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#336b6e] animate-spin mx-auto mb-4" />
          <p className="text-[#336b6e] font-medium">Loading reports data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 w-full max-w-2xl mx-auto">
          <AlertCircle className="w-6 h-6" />
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const CustomTooltipCurrency = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
          <p className="font-bold text-gray-700 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm font-medium flex justify-between gap-4" style={{ color: entry.color }}>
              <span>{entry.name}:</span>
              <span>{formatCurrency(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-[#fdfcf3] to-white min-h-screen pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#336b6e]">Platform Reports</h1>
          <p className="text-gray-500 mt-1">Analytics and insight trends for your operations.</p>
        </div>
        <button
            onClick={fetchReportData}
            className="flex items-center gap-2 px-4 py-2 bg-[#bb9f58] text-white rounded-lg hover:bg-[#a68a4a] transition-all self-start md:self-center font-semibold shadow-md"
        >
            <Calendar className="w-4 h-4" />
            Refresh Data
        </button>
      </div>

      {/* KPI Cards section 1: Clients & Trainers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-transparent hover:border-[#bb9f58] transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-blue-50 p-3 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <TrendIndicator value={clientStats.trend} />
          </div>
          <div>
            <h3 className="text-gray-500 text-sm font-medium">Total Clients</h3>
            <p className="text-3xl font-bold text-[#336b6e] mt-1">{clientStats.total}</p>
            <p className="text-xs text-gray-400 mt-2">vs {clientStats.prevTotal} last month</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-transparent hover:border-[#bb9f58] transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-purple-50 p-3 rounded-xl">
              <Briefcase className="w-6 h-6 text-purple-600" />
            </div>
            <TrendIndicator value={trainerStats.trend} />
          </div>
          <div>
            <h3 className="text-gray-500 text-sm font-medium">Total Trainers</h3>
            <p className="text-3xl font-bold text-[#336b6e] mt-1">{trainerStats.total}</p>
            <p className="text-xs text-gray-400 mt-2">vs {trainerStats.prevTotal} last month</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-transparent hover:border-[#bb9f58] transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-indigo-50 p-3 rounded-xl">
              <UserCheck className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div>
            <h3 className="text-gray-500 text-sm font-medium">Client Conversion</h3>
            <div className="flex items-center gap-4 mt-1">
              <div>
                <p className="text-xl font-bold text-indigo-600">{clientStats.permanent}</p>
                <p className="text-xs text-gray-400">Permanent</p>
              </div>
              <div className="h-8 w-px bg-gray-200"></div>
              <div>
                <p className="text-xl font-bold text-gray-600">{clientStats.demo}</p>
                <p className="text-xs text-gray-400">Demo</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-transparent hover:border-[#bb9f58] transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-amber-50 p-3 rounded-xl">
              <UserCheck className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div>
            <h3 className="text-gray-500 text-sm font-medium">Trainer Status</h3>
             <div className="flex items-center gap-4 mt-1">
              <div>
                <p className="text-xl font-bold text-green-600">{trainerStats.active}</p>
                <p className="text-xs text-gray-400">Active</p>
              </div>
              <div className="h-8 w-px bg-gray-200"></div>
              <div>
                <p className="text-xl font-bold text-amber-600">{trainerStats.pending}</p>
                <p className="text-xs text-gray-400">Pending</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards section 2: Financials */}
      <h2 className="text-2xl font-bold text-[#336b6e] mt-10 mb-4 flex items-center gap-2">
        <DollarSign className="w-6 h-6 text-[#bb9f58]"/> Financial Overview
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-2xl p-6 shadow-lg text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-white/10 p-3 rounded-xl">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm flex items-center">
              {financeStats.trend >= 0 ? <TrendingUp className="w-3 h-3 mr-1"/> : <TrendingDown className="w-3 h-3 mr-1"/>}
              {financeStats.trend > 0 ? '+' : ''}{financeStats.trend}%
            </div>
          </div>
          <div>
            <h3 className="text-white/80 text-sm font-medium">Total Revenue (Completed)</h3>
            <p className="text-3xl font-bold text-white mt-1">{formatCurrency(financeStats.totalRevenue)}</p>
            <p className="text-xs text-white/50 mt-2">vs {formatCurrency(financeStats.prevRevenue)} last month</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-transparent hover:border-[#bb9f58] transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-emerald-50 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div>
            <h3 className="text-gray-500 text-sm font-medium">Platform Fee Earned</h3>
            <p className="text-3xl font-bold text-[#336b6e] mt-1">{formatCurrency(financeStats.totalPlatformFee)}</p>
            <p className="text-xs text-gray-400 mt-2">From processed payouts</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-transparent hover:border-[#bb9f58] transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-rose-50 p-3 rounded-xl">
              <CreditCard className="w-6 h-6 text-rose-600" />
            </div>
          </div>
          <div>
            <h3 className="text-gray-500 text-sm font-medium">Trainer Payouts</h3>
            <p className="text-3xl font-bold text-[#336b6e] mt-1">{formatCurrency(financeStats.totalPayouts)}</p>
            <p className="text-xs text-gray-400 mt-2">Paid out to trainers</p>
          </div>
        </div>
      </div>


      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Area Chart: 6-Month Client Trends */}
        <div className="bg-white rounded-2xl p-6 shadow-md lg:col-span-2">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-[#336b6e]">Client Growth Trends</h3>
            <p className="text-sm text-gray-500">Demo vs Permanent clients over the last 6 months</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyClientData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDemo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPerm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="monthName" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
                <Area type="monotone" dataKey="demo" name="Demo Clients" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorDemo)" />
                <Area type="monotone" dataKey="permanent" name="Permanent Clients" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorPerm)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KYC Status Pie Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-md flex flex-col">
          <div className="mb-2">
            <h3 className="text-lg font-bold text-[#336b6e]">Trainer KYC Status</h3>
            <p className="text-sm text-gray-500">Distribution of approval statuses</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center min-h-[250px]">
            {kycData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kycData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {kycData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
                <div className="text-center text-gray-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No KYC data available</p>
                </div>
            )}
          </div>
        </div>

        {/* Financial Flow Line Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-md lg:col-span-3">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-[#336b6e]">Financial Performance (6 Months)</h3>
            <p className="text-sm text-gray-500">Monthly Revenue vs Payouts vs Platform Fee</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyFinanceData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="monthName" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                    stroke="#9ca3af" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => `₹${val/1000}k`} 
                />
                <Tooltip content={<CustomTooltipCurrency />} />
                <Legend iconType="circle"/>
                <Line type="monotone" dataKey="revenue" name="Total Gross Revenue" stroke="#336b6e" strokeWidth={3} dot={{ r: 4, fill: "#336b6e", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="payouts" name="Trainer Payouts" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="platformFee" name="Platform Fee" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminReports;

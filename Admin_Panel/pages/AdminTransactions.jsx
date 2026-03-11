import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Download,
    Calendar,
    DollarSign,
    User,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import supabase from '../../src/supabase/supabse';

const AdminTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        dateRange: 'all', // all, today, week, month
        startDate: '',
        endDate: ''
    });
    const [stats, setStats] = useState({
        platformProfit: 0,
        totalReceived: 0,
        pendingAmount: 0,
        completedCount: 0
    });

    useEffect(() => {
        fetchTransactions();
    }, [filters]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('payment_transactions')
                .select(`
          *,
          client:clients(id, first_name, last_name, email),
          trainer:trainer_profiles(id, user_id)
        `)
                .order('payment_date', { ascending: false });

            // Apply filters
            if (filters.status !== 'all') {
                query = query.eq('status', filters.status);
            }

            if (filters.dateRange === 'today') {
                const today = new Date().toISOString().split('T')[0];
                query = query.gte('payment_date', today);
            } else if (filters.dateRange === 'week') {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                query = query.gte('payment_date', weekAgo.toISOString().split('T')[0]);
            } else if (filters.dateRange === 'month') {
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                query = query.gte('payment_date', monthAgo.toISOString().split('T')[0]);
            } else if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
                query = query.gte('payment_date', filters.startDate).lte('payment_date', filters.endDate);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Client-side search (since we need to search in joined tables)
            let filteredData = data;
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                filteredData = data.filter(t =>
                    t.client?.first_name?.toLowerCase().includes(searchLower) ||
                    t.client?.last_name?.toLowerCase().includes(searchLower) ||
                    t.client?.email?.toLowerCase().includes(searchLower) ||
                    t.transaction_reference?.toLowerCase().includes(searchLower)
                );
            }

            // Fetch trainer names and enrich data with fee breakdown
            const trainerIds = [...new Set(filteredData.map(t => t.trainer?.user_id).filter(Boolean))];
            if (trainerIds.length > 0) {
                try {
                    const response = await fetch(`${import.meta.env.VITE_PROJECT_URL}/functions/v1/get-all-users`, {
                        headers: {
                            'Authorization': `Bearer ${import.meta.env.VITE_ANON_KEY}`
                        }
                    });
                    if (response.ok) {
                        const users = await response.json();
                        filteredData = filteredData.map(t => {
                            const trainerUser = users.find(u => u.id === t.trainer?.user_id);
                            
                            // Use new fields if available, otherwise calculate from old data
                            let totalFee, platformFee, trainerAmount, platformFeePercentage;
                            
                            if (t.total_fee !== null && t.total_fee !== undefined) {
                                // New schema: use stored values
                                totalFee = t.total_fee;
                                platformFee = t.platform_fee || 0;
                                trainerAmount = t.trainer_amount || t.amount || 0;
                                platformFeePercentage = t.platform_fee_percentage || 0;
                            } else {
                                // Old schema: calculate from amount and client's platform fee
                                trainerAmount = t.amount || 0;
                                platformFeePercentage = t.client?.platform_fee_percentage || 0;
                                
                                if (platformFeePercentage > 0 && platformFeePercentage < 100) {
                                    totalFee = trainerAmount / ((100 - platformFeePercentage) / 100);
                                    platformFee = totalFee - trainerAmount;
                                } else {
                                    totalFee = trainerAmount;
                                    platformFee = 0;
                                }
                            }
                            
                            return {
                                ...t,
                                trainer_name: trainerUser ?
                                    `${trainerUser.user_metadata?.firstName || ''} ${trainerUser.user_metadata?.lastName || ''}` :
                                    'Unknown Trainer',
                                total_fee: totalFee,
                                platform_fee: platformFee,
                                trainer_amount: trainerAmount,
                                platform_fee_percentage: platformFeePercentage
                            };
                        });
                    }
                } catch (err) {
                    console.error("Failed to fetch trainer details", err);
                }
            }

            setTransactions(filteredData);
            calculateStats(filteredData);

        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = async (data) => {
        const completedTransactions = data.filter(t => t.status === 'completed');
        const pendingTransactions = data.filter(t => t.status === 'pending');

        // Calculate totals from the enriched data
        const totalReceived = completedTransactions.reduce((sum, t) => sum + (t.total_fee || t.amount || 0), 0);
        const platformProfit = completedTransactions.reduce((sum, t) => sum + (t.platform_fee || 0), 0);
        const pending = pendingTransactions.reduce((sum, t) => sum + (t.total_fee || t.amount || 0), 0);

        setStats({
            platformProfit,
            totalReceived,
            pendingAmount: pending,
            completedCount: completedTransactions.length
        });
    };

    const getStatusBadge = (status) => {
        const styles = {
            completed: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            failed: 'bg-red-100 text-red-800',
            refunded: 'bg-gray-100 text-gray-800'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100'}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="p-6 bg-[#fdfcf3] min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#336b6e]">Transactions</h1>
                        <p className="text-gray-600 mt-1">Manage and track all payments</p>
                    </div>
                    <button
                        onClick={fetchTransactions}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-[#336b6e]"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-green-50 rounded-lg">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm">Platform Profit</p>
                        <h3 className="text-2xl font-bold text-green-600">₹{stats.platformProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
                        <p className="text-xs text-gray-500 mt-1">From platform fees</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <DollarSign className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm">Total Received</p>
                        <h3 className="text-2xl font-bold text-[#336b6e]">₹{stats.totalReceived.toLocaleString('en-IN')}</h3>
                        <p className="text-xs text-gray-500 mt-1">From clients</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-yellow-50 rounded-lg">
                                <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                            <span className="text-sm text-gray-500">Pending</span>
                        </div>
                        <p className="text-gray-600 text-sm">Pending Amount</p>
                        <h3 className="text-2xl font-bold text-[#336b6e]">₹{stats.pendingAmount.toLocaleString('en-IN')}</h3>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-blue-600" />
                            </div>
                            <span className="text-sm text-blue-600 font-medium">
                                {transactions.length > 0 ? Math.round((stats.completedCount / transactions.length) * 100) : 0}%
                            </span>
                        </div>
                        <p className="text-gray-600 text-sm">Success Rate</p>
                        <h3 className="text-2xl font-bold text-[#336b6e]">{stats.completedCount} / {transactions.length}</h3>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by client, email, or reference..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#bb9f58]"
                            />
                        </div>

                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#bb9f58] bg-white"
                        >
                            <option value="all">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                        </select>

                        <select
                            value={filters.dateRange}
                            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#bb9f58] bg-white"
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="custom">Custom Range</option>
                        </select>

                        {filters.dateRange === 'custom' && (
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#bb9f58]"
                                />
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#bb9f58]"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Client</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Trainer</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Total Fee</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Platform Fee</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">To Trainer</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Method</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-8 text-center">
                                            <RefreshCw className="w-8 h-8 mx-auto text-[#336b6e] animate-spin" />
                                        </td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                                            No transactions found
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((t) => {
                                        return (
                                            <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {new Date(t.payment_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-[#336b6e]/10 rounded-full flex items-center justify-center">
                                                            <User className="w-4 h-4 text-[#336b6e]" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-[#336b6e]">
                                                                {t.client?.first_name} {t.client?.last_name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">{t.client?.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-medium text-gray-700">
                                                        {t.trainer_name || 'Loading...'}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-[#336b6e]">
                                                    ₹{(t.total_fee || t.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-medium text-green-600">
                                                            ₹{(t.platform_fee || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                                        </p>
                                                        {t.platform_fee_percentage > 0 && (
                                                            <p className="text-xs text-gray-500">
                                                                ({t.platform_fee_percentage}%)
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-blue-600">
                                                    ₹{(t.trainer_amount || t.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                                                    {t.payment_method.replace('_', ' ')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getStatusBadge(t.status)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminTransactions;

import { DollarSign, TrendingUp, Calendar, CheckCircle } from 'lucide-react';

/**
 *  Earnings Summary Card Component
 * Displays trainer's payment summary and statistics
 */
const EarningsSummaryCard = ({ earnings = {} }) => {
    const {
        thisMonth = 0,
        lastMonth = 0,
        totalLifetime = 0,
        lastPaymentDate = null,
        pendingAmount = 0,
        totalTransactions = 0,
    } = earnings;

    const monthGrowth = lastMonth > 0
        ? (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1)
        : 0;

    const isGrowthPositive = monthGrowth >= 0;

    return (
        <div className="bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Earnings Overview</h2>
                <div className="w-12 h-12 bg-[#bb9f58] rounded-lg flex items-center justify-center">
                    <DollarSign className="w-7 h-7 text-[#336b6e]" />
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* This Month */}
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <p className="text-sm text-white/80 mb-1">This Month</p>
                    <p className="text-3xl font-bold">₹{thisMonth.toLocaleString('en-IN')}</p>
                    {isGrowthPositive ? (
                        <div className="flex items-center gap-1 mt-2 text-green-300">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm">+{monthGrowth}% from last month</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 mt-2 text-red-300">
                            <TrendingUp className="w-4 h-4 transform rotate-180" />
                            <span className="text-sm">{monthGrowth}% from last month</span>
                        </div>
                    )}
                </div>

                {/* Last Month */}
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <p className="text-sm text-white/80 mb-1">Last Month</p>
                    <p className="text-3xl font-bold">₹{lastMonth.toLocaleString('en-IN')}</p>
                    <p className="text-sm text-white/60 mt-2">{totalTransactions} transactions</p>
                </div>

                {/* Total Lifetime */}
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <p className="text-sm text-white/80 mb-1">Total Lifetime</p>
                    <p className="text-3xl font-bold">₹{totalLifetime.toLocaleString('en-IN')}</p>
                    <p className="text-sm text-white/60 mt-2">All-time earnings</p>
                </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Last Payment */}
                <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                    <Calendar className="w-5 h-5 text-[#bb9f58]" />
                    <div>
                        <p className="text-xs text-white/70">Last Payment</p>
                        <p className="font-medium">
                            {lastPaymentDate
                                ? new Date(lastPaymentDate).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                })
                                : 'No payments yet'}
                        </p>
                    </div>
                </div>

                {/* Pending Amount */}
                <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                    <CheckCircle className="w-5 h-5 text-yellow-300" />
                    <div>
                        <p className="text-xs text-white/70">Pending Payments</p>
                        <p className="font-medium">₹{pendingAmount.toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats Banner */}
            {pendingAmount > 0 && (
                <div className="mt-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-sm text-yellow-200 flex items-center gap-2">
                        <span className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></span>
                        You have ₹{pendingAmount.toLocaleString('en-IN')} in pending payments
                    </p>
                </div>
            )}
        </div>
    );
};

export default EarningsSummaryCard;

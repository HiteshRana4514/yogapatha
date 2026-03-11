import React, { useState, useEffect } from 'react'
import { X, Calendar, DollarSign, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react'
import supabase from '../../src/supabase/supabse'

function ClientPaymentHistoryModal({ isOpen, onClose, client }) {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (isOpen && client) {
            fetchHistory()
        }
    }, [isOpen, client])

    const fetchHistory = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('payment_transactions')
                .select('*')
                .eq('client_id', client.id)
                .order('payment_date', { ascending: false })

            if (error) throw error
            setHistory(data || [])
        } catch (error) {
            console.error('Error fetching payment history:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-[#336b6e]">Payment History</h2>
                        <p className="text-sm text-gray-500">
                            {client?.first_name} {client?.last_name}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-8">
                            <RefreshCw className="w-8 h-8 mx-auto mb-2 text-[#336b6e] animate-spin" />
                            <p className="text-gray-600">Loading history...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                            <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="font-medium text-gray-500">No payments recorded</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((payment) => (
                                <div
                                    key={payment.id}
                                    className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-700">
                                                {new Date(payment.payment_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                            }`}>
                                            {payment.status === 'completed' ? <CheckCircle className="w-3 h-3" /> :
                                                payment.status === 'pending' ? <Clock className="w-3 h-3" /> :
                                                    <XCircle className="w-3 h-3" />}
                                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-2xl font-bold text-[#336b6e]">
                                                ₹{payment.amount.toLocaleString('en-IN')}
                                            </p>
                                            <p className="text-xs text-gray-500 capitalize">
                                                Via {payment.payment_method.replace('_', ' ')}
                                            </p>
                                        </div>
                                        {payment.transaction_reference && (
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400">Reference ID</p>
                                                <p className="text-sm font-mono text-gray-600">
                                                    {payment.transaction_reference}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ClientPaymentHistoryModal

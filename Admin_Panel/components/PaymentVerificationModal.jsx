import { useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, CreditCard, Smartphone, QrCode, Eye, EyeOff } from 'lucide-react';

/**
 * Payment Verification Modal
 * Allows admins to approve or reject trainer payment details
 */
const PaymentVerificationModal = ({ isOpen, onClose, paymentDetails, onVerify, onReject }) => {
    const [showAccountNumber, setShowAccountNumber] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    if (!isOpen || !paymentDetails) return null;

    const maskAccountNumber = (accountNumber) => {
        if (!accountNumber) return '';
        const length = accountNumber.length;
        if (length <= 4) return accountNumber;
        return '*'.repeat(length - 4) + accountNumber.slice(-4);
    };

    const validateIFSC = (ifsc) => {
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        return ifscRegex.test(ifsc);
    };

    const validateUPI = (upi) => {
        const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]+$/;
        return upiRegex.test(upi);
    };

    const handleApprove = async () => {
        setProcessing(true);
        try {
            await onVerify(paymentDetails.id, adminNotes);
            onClose();
        } catch (error) {
            console.error('Error approving payment details:', error);
            alert('Failed to approve payment details');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        setProcessing(true);
        try {
            await onReject(paymentDetails.id, rejectionReason, adminNotes);
            onClose();
        } catch (error) {
            console.error('Error rejecting payment details:', error);
            alert('Failed to reject payment details');
        } finally {
            setProcessing(false);
        }
    };

    const hasBankDetails = paymentDetails.bank_account_number;
    const hasUpiDetails = paymentDetails.upi_id;
    const hasQrCode = paymentDetails.upi_qr_code_url;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-[#336b6e]">Verify Payment Details</h2>
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Verification Status */}
                    {paymentDetails.is_verified !== null && (
                        <div className={`p-4 rounded-lg ${paymentDetails.is_verified
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-red-50 border border-red-200'
                            }`}>
                            <div className="flex items-center gap-2">
                                {paymentDetails.is_verified ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-600" />
                                )}
                                <span className={`font-medium ${paymentDetails.is_verified ? 'text-green-800' : 'text-red-800'
                                    }`}>
                                    {paymentDetails.is_verified ? 'Already Verified' : 'Previously Rejected'}
                                </span>
                            </div>
                            {paymentDetails.rejection_reason && (
                                <p className="text-sm text-red-700 mt-2">
                                    Reason: {paymentDetails.rejection_reason}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Preferred Method */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            <strong>Preferred Method:</strong>{' '}
                            {paymentDetails.preferred_payment_method === 'bank' && 'Bank Transfer'}
                            {paymentDetails.preferred_payment_method === 'upi' && 'UPI Payment'}
                            {paymentDetails.preferred_payment_method === 'qr_code' && 'QR Code'}
                        </p>
                    </div>

                    {/* Bank Details */}
                    {hasBankDetails && (
                        <div className="border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <CreditCard className="w-6 h-6 text-[#bb9f58]" />
                                <h3 className="text-lg font-semibold text-[#336b6e]">Bank Account Details</h3>
                                {paymentDetails.preferred_payment_method === 'bank' && (
                                    <span className="text-xs bg-[#bb9f58] text-white px-2 py-1 rounded">Preferred</span>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Account Holder Name</label>
                                    <p className="text-gray-900 font-medium">{paymentDetails.account_holder_name}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-600">Account Number</label>
                                    <div className="flex items-center gap-2">
                                        <p className="text-gray-900 font-mono">
                                            {showAccountNumber
                                                ? paymentDetails.bank_account_number
                                                : maskAccountNumber(paymentDetails.bank_account_number)}
                                        </p>
                                        <button
                                            onClick={() => setShowAccountNumber(!showAccountNumber)}
                                            className="text-[#bb9f58] hover:text-[#a68a4a]"
                                        >
                                            {showAccountNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-600">IFSC Code</label>
                                    <div className="flex items-center gap-2">
                                        <p className="text-gray-900 font-mono">{paymentDetails.bank_ifsc_code}</p>
                                        {validateIFSC(paymentDetails.bank_ifsc_code) ? (
                                            <CheckCircle className="w-4 h-4 text-green-600" title="Valid format" />
                                        ) : (
                                            <AlertCircle className="w-4 h-4 text-red-600" title="Invalid format" />
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-600">Bank Name</label>
                                    <p className="text-gray-900">{paymentDetails.bank_name}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* UPI Details */}
                    {hasUpiDetails && (
                        <div className="border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Smartphone className="w-6 h-6 text-[#bb9f58]" />
                                <h3 className="text-lg font-semibold text-[#336b6e]">UPI Details</h3>
                                {paymentDetails.preferred_payment_method === 'upi' && (
                                    <span className="text-xs bg-[#bb9f58] text-white px-2 py-1 rounded">Preferred</span>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600">UPI ID</label>
                                <div className="flex items-center gap-2">
                                    <p className="text-gray-900 font-mono">{paymentDetails.upi_id}</p>
                                    {validateUPI(paymentDetails.upi_id) ? (
                                        <CheckCircle className="w-4 h-4 text-green-600" title="Valid format" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 text-red-600" title="Invalid format" />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* QR Code */}
                    {hasQrCode && (
                        <div className="border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <QrCode className="w-6 h-6 text-[#bb9f58]" />
                                <h3 className="text-lg font-semibold text-[#336b6e]">QR Code</h3>
                                {paymentDetails.preferred_payment_method === 'qr_code' && (
                                    <span className="text-xs bg-[#bb9f58] text-white px-2 py-1 rounded">Preferred</span>
                                )}
                            </div>

                            <div className="flex justify-center">
                                <img
                                    src={paymentDetails.upi_qr_code_url}
                                    alt="UPI QR Code"
                                    className="max-w-xs border-2 border-[#bb9f58] rounded-lg"
                                />
                            </div>
                        </div>
                    )}

                    {/* Admin Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Admin Notes (Optional)
                        </label>
                        <textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            disabled={processing}
                            rows={3}
                            placeholder="Add any notes about this verification..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bb9f58] disabled:bg-gray-100"
                        />
                    </div>

                    {/* Rejection Section */}
                    {isRejecting && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <label className="block text-sm font-medium text-red-900 mb-2">
                                Rejection Reason <span className="text-red-600">*</span>
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                disabled={processing}
                                rows={3}
                                placeholder="Please specify why you're rejecting these payment details..."
                                className="w-full px-4 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
                                required
                            />
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end gap-3">
                    {!isRejecting ? (
                        <>
                            <button
                                onClick={() => setIsRejecting(true)}
                                disabled={processing}
                                className="px-6 py-2 border-2 border-red-500 text-red-600 rounded-lg font-medium hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Reject
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={processing}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {processing ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        Approve
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    setIsRejecting(false);
                                    setRejectionReason('');
                                }}
                                disabled={processing}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={processing || !rejectionReason.trim()}
                                className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {processing ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        <XCircle className="w-5 h-5" />
                                        Confirm Rejection
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentVerificationModal;

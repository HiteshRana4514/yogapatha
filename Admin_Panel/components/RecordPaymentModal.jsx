import { useState } from 'react';
import { X, CheckCircle, Upload, Loader, DollarSign, Calendar, FileText } from 'lucide-react';
import supabase from '../../src/supabase/supabse';

/**
 * Record Payment Modal
 * Allows admins to record a payment transaction for a client
 */
const RecordPaymentModal = ({ isOpen, onClose, client, trainer, onSavePayment, prefilledAmount }) => {
    // Get client's fee details
    const totalFee = client?.total_fee || client?.fee_amount || 0;
    const platformFeePercentage = client?.platform_fee_percentage || 0;
    const platformFee = totalFee * (platformFeePercentage / 100);
    const trainerAmount = totalFee - platformFee;

    const [formData, setFormData] = useState({
        totalFee: totalFee,
        platformFeePercentage: platformFeePercentage,
        platformFee: platformFee,
        trainerAmount: trainerAmount,
        paymentMethod: 'bank_transfer',
        transactionReference: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentPeriodStart: '',
        paymentPeriodEnd: '',
        adminNotes: '',
    });

    const [paymentProofUrl, setPaymentProofUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [uploadError, setUploadError] = useState(null);

    if (!isOpen || !client || !trainer) return null;

    const paymentMethods = [
        { value: 'bank_transfer', label: 'Bank Transfer' },
        { value: 'upi', label: 'UPI' },
        { value: 'cash', label: 'Cash' },
        { value: 'cheque', label: 'Cheque' },
        { value: 'online', label: 'Online Payment' },
        { value: 'other', label: 'Other' },
    ];

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
            setUploadError('Please upload an image or PDF file');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setUploadError('File size must be less than 10MB');
            return;
        }

        setUploadError(null);
        setUploading(true);

        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            formDataUpload.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
            formDataUpload.append('folder', 'yogapatha/payment_proofs');

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/${file.type === 'application/pdf' ? 'raw' : 'image'
                }/upload`,
                {
                    method: 'POST',
                    body: formDataUpload,
                }
            );

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            setPaymentProofUrl(data.secure_url);
            setUploadError(null);
        } catch (err) {
            console.error('Upload error:', err);
            setUploadError('Failed to upload file. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (saveAndClose = true) => {
        // Validation
        if (!formData.totalFee || parseFloat(formData.totalFee) <= 0) {
            alert('Please enter a valid total fee');
            return;
        }

        if (!formData.paymentDate) {
            alert('Please select a payment date');
            return;
        }

        if (formData.paymentPeriodStart && formData.paymentPeriodEnd) {
            if (new Date(formData.paymentPeriodStart) > new Date(formData.paymentPeriodEnd)) {
                alert('Payment period end date must be after start date');
                return;
            }
        }

        setProcessing(true);
        try {
            // Get current user ID for recorded_by field
            const { data: { user } } = await supabase.auth.getUser();
            
            const paymentData = {
                client_id: client.id,
                trainer_id: trainer.id,
                total_fee: parseFloat(formData.totalFee),
                platform_fee_percentage: parseFloat(formData.platformFeePercentage),
                platform_fee: parseFloat(formData.platformFee),
                trainer_amount: parseFloat(formData.trainerAmount),
                amount: parseFloat(formData.trainerAmount), // For backward compatibility
                currency: 'INR',
                payment_method: formData.paymentMethod,
                transaction_reference: formData.transactionReference || null,
                payment_date: formData.paymentDate,
                payment_period_start: formData.paymentPeriodStart || null,
                payment_period_end: formData.paymentPeriodEnd || null,
                payment_proof_url: paymentProofUrl,
                admin_notes: formData.adminNotes || null,
                status: 'completed',
                recorded_by: user?.id
            };

            await onSavePayment(paymentData, saveAndClose);

            if (saveAndClose) {
                onClose();
            } else {
                // Reset form for another entry
                const resetTotalFee = client?.total_fee || client?.fee_amount || 0;
                const resetPlatformFeePercentage = client?.platform_fee_percentage || 0;
                const resetPlatformFee = resetTotalFee * (resetPlatformFeePercentage / 100);
                const resetTrainerAmount = resetTotalFee - resetPlatformFee;
                
                setFormData({
                    totalFee: resetTotalFee,
                    platformFeePercentage: resetPlatformFeePercentage,
                    platformFee: resetPlatformFee,
                    trainerAmount: resetTrainerAmount,
                    paymentMethod: 'bank_transfer',
                    transactionReference: '',
                    paymentDate: new Date().toISOString().split('T')[0],
                    paymentPeriodStart: '',
                    paymentPeriodEnd: '',
                    adminNotes: '',
                });
                setPaymentProofUrl(null);
            }
        } catch (error) {
            console.error('Error recording payment:', error);
            alert('Failed to record payment. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-[#336b6e]">Record Payment to Trainer</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Client: {client.first_name} {client.last_name} • Trainer: {trainer.firstName} {trainer.lastName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-6 space-y-6">
                    {/* Fee Breakdown Display */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                        <h3 className="text-lg font-bold text-[#336b6e] mb-4">Payment Breakdown</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg p-4">
                                <p className="text-xs text-gray-600 mb-1">Total Fee (Client Pays)</p>
                                <p className="text-2xl font-bold text-[#336b6e]">₹{parseFloat(formData.totalFee || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="bg-white rounded-lg p-4">
                                <p className="text-xs text-gray-600 mb-1">Platform Fee ({formData.platformFeePercentage}%)</p>
                                <p className="text-2xl font-bold text-green-600">₹{parseFloat(formData.platformFee || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 col-span-2">
                                <p className="text-xs text-gray-600 mb-1">Amount to Trainer</p>
                                <p className="text-3xl font-bold text-blue-600">₹{parseFloat(formData.trainerAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </div>

                    {/* Trainer Amount Input (Read-only, showing amount to be transferred) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Total Amount Transferred (to Trainer) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="number"
                                value={formData.trainerAmount}
                                disabled={true}
                                className="w-full pl-10 pr-16 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-semibold"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                                INR
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Amount after platform fee deduction</p>
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Method <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.paymentMethod}
                            onChange={(e) => handleChange('paymentMethod', e.target.value)}
                            disabled={processing}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bb9f58] disabled:bg-gray-100"
                        >
                            {paymentMethods.map(method => (
                                <option key={method.value} value={method.value}>
                                    {method.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Transaction Reference */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Transaction Reference / UTR (Optional)
                        </label>
                        <input
                            type="text"
                            value={formData.transactionReference}
                            onChange={(e) => handleChange('transactionReference', e.target.value)}
                            disabled={processing}
                            placeholder="e.g., UTR123456789"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bb9f58] disabled:bg-gray-100"
                        />
                    </div>

                    {/* Payment Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Date <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="date"
                                value={formData.paymentDate}
                                onChange={(e) => handleChange('paymentDate', e.target.value)}
                                disabled={processing}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bb9f58] disabled:bg-gray-100"
                            />
                        </div>
                    </div>

                    {/* Payment Period */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Period (Optional)
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">From</label>
                                <input
                                    type="date"
                                    value={formData.paymentPeriodStart}
                                    onChange={(e) => handleChange('paymentPeriodStart', e.target.value)}
                                    disabled={processing}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bb9f58] disabled:bg-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">To</label>
                                <input
                                    type="date"
                                    value={formData.paymentPeriodEnd}
                                    onChange={(e) => handleChange('paymentPeriodEnd', e.target.value)}
                                    disabled={processing}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bb9f58] disabled:bg-gray-100"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            E.g., for monthly fee, specify which month this payment covers
                        </p>
                    </div>

                    {/* Payment Proof Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Proof (Optional)
                        </label>
                        {paymentProofUrl ? (
                            <div className="border border-gray-300 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <span className="text-sm text-gray-700">File uploaded</span>
                                    </div>
                                    <button
                                        onClick={() => setPaymentProofUrl(null)}
                                        disabled={processing}
                                        className="text-red-600 hover:text-red-700 text-sm disabled:opacity-50"
                                    >
                                        Remove
                                    </button>
                                </div>
                                <a
                                    href={paymentProofUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-[#bb9f58] hover:underline mt-2 block"
                                >
                                    View file
                                </a>
                            </div>
                        ) : (
                            <div>
                                <input
                                    type="file"
                                    id="payment-proof"
                                    accept="image/*,application/pdf"
                                    onChange={handleFileUpload}
                                    disabled={uploading || processing}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="payment-proof"
                                    className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#bb9f58] transition-colors ${(uploading || processing) ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                >
                                    {uploading ? (
                                        <>
                                            <Loader className="w-5 h-5 animate-spin text-[#bb9f58]" />
                                            <span className="text-gray-700">Uploading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-700">Click to upload receipt/screenshot</span>
                                        </>
                                    )}
                                </label>
                                {uploadError && (
                                    <p className="text-sm text-red-600 mt-2">{uploadError}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    Supported: Images, PDF (max 10MB)
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Admin Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Admin Notes (Optional)
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <textarea
                                value={formData.adminNotes}
                                onChange={(e) => handleChange('adminNotes', e.target.value)}
                                disabled={processing}
                                rows={3}
                                placeholder="Add any additional notes about this payment..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bb9f58] disabled:bg-gray-100"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => handleSubmit(false)}
                        disabled={processing}
                        className="px-6 py-2 border-2 border-[#bb9f58] text-[#bb9f58] rounded-lg font-medium hover:bg-[#bb9f58]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save & Record Another
                    </button>
                    <button
                        onClick={() => handleSubmit(true)}
                        disabled={processing}
                        className="px-6 py-2 bg-[#bb9f58] text-white rounded-lg font-medium hover:bg-[#a68a4a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {processing ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Save & Close
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecordPaymentModal;

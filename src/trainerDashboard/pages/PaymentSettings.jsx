import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader, CreditCard, Smartphone, QrCode, ArrowLeft, Star } from 'lucide-react';
import supabase from '../../supabase/supabse';
import BankDetailsForm from '../components/BankDetailsForm';
import UPIDetailsForm from '../components/UPIDetailsForm';
import QRCodeUploader from '../components/QRCodeUploader';

/**
 * Payment Settings Page
 * Allows trainers to set up their payment details (Bank/UPI/QR Code)
 * Trainers can fill in any or all payment methods using tabs
 * Includes admin verification workflow
 */
const PaymentSettings = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Active tab
    const [activeTab, setActiveTab] = useState('bank'); // 'bank', 'upi', 'qr_code'

    // Preferred payment method
    const [preferredMethod, setPreferredMethod] = useState('bank');

    // Form data
    const [bankData, setBankData] = useState({});
    const [upiData, setUpiData] = useState({});
    const [qrCodeUrl, setQrCodeUrl] = useState(null);

    // Validation states
    const [bankValid, setBankValid] = useState(false);
    const [upiValid, setUpiValid] = useState(false);

    // Track which forms have data
    const [hasBankData, setHasBankData] = useState(false);
    const [hasUpiData, setHasUpiData] = useState(false);
    const [hasQrData, setHasQrData] = useState(false);

    // Existing payment details
    const [existingDetails, setExistingDetails] = useState(null);
    const [trainerId, setTrainerId] = useState(null);

    useEffect(() => {
        fetchPaymentDetails();
    }, []);

    // Check if bank data is filled
    useEffect(() => {
        const filled = bankData.accountNumber || bankData.ifscCode || bankData.bankName || bankData.accountHolderName;
        setHasBankData(!!filled);
    }, [bankData]);

    // Check if UPI data is filled (and validate format)
    useEffect(() => {
        const filled = !!upiData.upiId;
        setHasUpiData(filled);

        // Auto-validate UPI format if data exists
        if (filled) {
            const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]+$/;
            setUpiValid(upiRegex.test(upiData.upiId));
        } else {
            setUpiValid(false);
        }
    }, [upiData]);

    // Check if QR data is filled
    useEffect(() => {
        setHasQrData(!!qrCodeUrl);
    }, [qrCodeUrl]);

    const fetchPaymentDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            // Get trainer profile
            const { data: trainerProfile, error: profileError } = await supabase
                .from('trainer_profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (profileError) throw profileError;
            setTrainerId(trainerProfile.id);

            // Get existing payment details
            const { data, error: detailsError } = await supabase
                .from('trainer_payment_details')
                .select('*')
                .eq('trainer_id', trainerProfile.id)
                .single();

            if (detailsError && detailsError.code !== 'PGRST116') {
                throw detailsError;
            }

            if (data) {
                setExistingDetails(data);

                // Set preferred method
                if (data.preferred_payment_method) {
                    setPreferredMethod(data.preferred_payment_method);
                }

                // Populate ALL forms with existing data
                const loadedBankData = {
                    accountNumber: data.bank_account_number || '',
                    ifscCode: data.bank_ifsc_code || '',
                    bankName: data.bank_name || '',
                    accountHolderName: data.account_holder_name || '',
                };
                setBankData(loadedBankData);

                const loadedUpiData = {
                    upiId: data.upi_id || '',
                };
                setUpiData(loadedUpiData);

                setQrCodeUrl(data.upi_qr_code_url || null);

                // Auto-validate loaded data
                // Bank validation - check if all required fields are filled
                const bankFilled = loadedBankData.accountNumber &&
                    loadedBankData.ifscCode &&
                    loadedBankData.bankName &&
                    loadedBankData.accountHolderName;
                if (bankFilled) {
                    // Do basic validation
                    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
                    const accountRegex = /^[0-9]{9,18}$/;
                    const isValid = ifscRegex.test(loadedBankData.ifscCode) &&
                        accountRegex.test(loadedBankData.accountNumber) &&
                        loadedBankData.bankName.length >= 3 &&
                        loadedBankData.accountHolderName.length >= 2;
                    setBankValid(isValid);
                }

                // UPI validation happens in useEffect above
            }
        } catch (err) {
            console.error('Error fetching payment details:', err);
            setError('Failed to load payment details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(false);

            if (!trainerId) {
                throw new Error('Trainer profile not found');
            }

            // Check if at least one method is filled
            if (!hasBankData && !hasUpiData && !hasQrData) {
                throw new Error('Please fill in at least one payment method');
            }

            // Validate filled forms
            if (hasBankData && !bankValid) {
                throw new Error('Please fill in all required bank details correctly');
            }
            if (hasUpiData && !upiValid) {
                throw new Error('Please enter a valid UPI ID');
            }

            // Prepare data for submission - save ALL filled methods
            const paymentDetails = {
                trainer_id: trainerId,
                preferred_payment_method: preferredMethod,
                // Save bank data if filled
                bank_account_number: hasBankData ? bankData.accountNumber : null,
                bank_ifsc_code: hasBankData ? bankData.ifscCode : null,
                bank_name: hasBankData ? bankData.bankName : null,
                account_holder_name: hasBankData ? bankData.accountHolderName : null,
                // Save UPI data if filled
                upi_id: hasUpiData ? upiData.upiId : null,
                // Save QR code if uploaded
                upi_qr_code_url: hasQrData ? qrCodeUrl : null,
                is_verified: false, // Reset verification when details change
            };

            // Upsert payment details
            const { error: upsertError } = await supabase
                .from('trainer_payment_details')
                .upsert(paymentDetails, {
                    onConflict: 'trainer_id',
                });

            if (upsertError) throw upsertError;

            setSuccess(true);

            // Refresh data
            await fetchPaymentDetails();

            // Auto-hide success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Error saving payment details:', err);
            setError(err.message || 'Failed to save payment details. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader className="w-8 h-8 text-[#bb9f58] animate-spin" />
            </div>
        );
    }

    const verificationStatus = existingDetails?.is_verified;
    const rejectionReason = existingDetails?.rejection_reason;

    // Tab configuration
    const tabs = [
        { id: 'bank', label: 'Bank Transfer', icon: CreditCard, hasData: hasBankData, isValid: bankValid },
        { id: 'upi', label: 'UPI Payment', icon: Smartphone, hasData: hasUpiData, isValid: upiValid },
        { id: 'qr_code', label: 'QR Code', icon: QrCode, hasData: hasQrData, isValid: true }, // QR is valid if uploaded
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/trainer_dashboard')}
                        className="flex items-center gap-2 text-[#336b6e] hover:text-[#bb9f58] transition-colors mb-4"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold text-[#336b6e]">Payment Settings</h1>
                    <p className="text-gray-600 mt-2">
                        Set up your payment details to receive payments from YogaPatha. You can add multiple payment methods!
                    </p>
                </div>

                {/* Verification Status Banner */}
                {existingDetails && (
                    <div className={`mb-6 p-4 rounded-lg ${verificationStatus === true
                            ? 'bg-green-50 border border-green-200'
                            : verificationStatus === false && rejectionReason
                                ? 'bg-red-50 border border-red-200'
                                : 'bg-yellow-50 border border-yellow-200'
                        }`}>
                        <div className="flex items-start gap-3">
                            {verificationStatus === true ? (
                                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                            ) : (
                                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                            )}
                            <div>
                                <p className={`font-medium ${verificationStatus === true ? 'text-green-800' : 'text-yellow-800'
                                    }`}>
                                    {verificationStatus === true
                                        ? '✓ Payment details verified'
                                        : verificationStatus === false && rejectionReason
                                            ? '✗ Payment details rejected'
                                            : '⏳ Pending admin verification'}
                                </p>
                                {rejectionReason && (
                                    <p className="text-sm text-red-700 mt-1">
                                        Reason: {rejectionReason}
                                    </p>
                                )}
                                {!verificationStatus && !rejectionReason && (
                                    <p className="text-sm text-yellow-700 mt-1">
                                        Your payment details are under review. You'll be notified once verified.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                            <p className="text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {/* Success Alert */}
                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                            <p className="text-green-700">
                                Payment details saved successfully! Pending admin verification.
                            </p>
                        </div>
                    </div>
                )}

                {/* Info Note */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <strong>💡 Tip:</strong> Use the tabs below to add one or multiple payment methods. Your preferred method will be highlighted.
                    </p>
                </div>

                {/* Main Card with Tabs */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Tab Headers */}
                    <div className="border-b border-gray-200">
                        <div className="flex">
                            {tabs.map((tab) => {
                                const IconComponent = tab.icon;
                                const isActive = activeTab === tab.id;

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-1 px-6 py-4 flex items-center justify-center gap-3 transition-all relative ${isActive
                                                ? 'text-[#bb9f58] border-b-2 border-[#bb9f58] bg-[#bb9f58]/5'
                                                : 'text-gray-600 hover:text-[#336b6e] hover:bg-gray-50'
                                            }`}
                                    >
                                        <IconComponent className="w-5 h-5" />
                                        <span className="font-medium hidden sm:inline">{tab.label}</span>
                                        <span className="font-medium sm:hidden">{tab.id.toUpperCase()}</span>
                                        {tab.hasData && tab.isValid && (
                                            <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full"></span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'bank' && (
                            <div>
                                <BankDetailsForm
                                    initialData={bankData}
                                    onChange={(data, isValid) => {
                                        setBankData(data);
                                        setBankValid(isValid);
                                    }}
                                    disabled={saving}
                                />
                            </div>
                        )}

                        {activeTab === 'upi' && (
                            <div>
                                <UPIDetailsForm
                                    initialData={upiData}
                                    onChange={(data, isValid) => {
                                        setUpiData(data);
                                        setUpiValid(isValid);
                                    }}
                                    disabled={saving}
                                />
                            </div>
                        )}

                        {activeTab === 'qr_code' && (
                            <div>
                                <QRCodeUploader
                                    currentQRCodeUrl={qrCodeUrl}
                                    onUploadSuccess={setQrCodeUrl}
                                    disabled={saving}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Preferred Method Selection */}
                {(hasBankData || hasUpiData || hasQrData) && (
                    <div className="mt-6 bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Star className="w-6 h-6 text-[#bb9f58]" />
                            <h2 className="text-xl font-semibold text-[#336b6e]">Preferred Payment Method</h2>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Select your preferred payment method. Admins will see this as your primary choice.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {hasBankData && bankValid && (
                                <button
                                    onClick={() => setPreferredMethod('bank')}
                                    className={`p-4 border-2 rounded-lg transition-all ${preferredMethod === 'bank'
                                            ? 'border-[#bb9f58] bg-[#bb9f58]/10'
                                            : 'border-gray-300 hover:border-[#bb9f58]/50'
                                        }`}
                                >
                                    <CreditCard className={`w-8 h-8 mx-auto mb-2 ${preferredMethod === 'bank' ? 'text-[#bb9f58]' : 'text-gray-400'
                                        }`} />
                                    <p className="font-medium text-[#336b6e]">Bank Transfer</p>
                                    {preferredMethod === 'bank' && (
                                        <p className="text-xs text-[#bb9f58] mt-1 font-medium">✓ Preferred</p>
                                    )}
                                </button>
                            )}

                            {hasUpiData && upiValid && (
                                <button
                                    onClick={() => setPreferredMethod('upi')}
                                    className={`p-4 border-2 rounded-lg transition-all ${preferredMethod === 'upi'
                                            ? 'border-[#bb9f58] bg-[#bb9f58]/10'
                                            : 'border-gray-300 hover:border-[#bb9f58]/50'
                                        }`}
                                >
                                    <Smartphone className={`w-8 h-8 mx-auto mb-2 ${preferredMethod === 'upi' ? 'text-[#bb9f58]' : 'text-gray-400'
                                        }`} />
                                    <p className="font-medium text-[#336b6e]">UPI ID</p>
                                    {preferredMethod === 'upi' && (
                                        <p className="text-xs text-[#bb9f58] mt-1 font-medium">✓ Preferred</p>
                                    )}
                                </button>
                            )}

                            {hasQrData && (
                                <button
                                    onClick={() => setPreferredMethod('qr_code')}
                                    className={`p-4 border-2 rounded-lg transition-all ${preferredMethod === 'qr_code'
                                            ? 'border-[#bb9f58] bg-[#bb9f58]/10'
                                            : 'border-gray-300 hover:border-[#bb9f58]/50'
                                        }`}
                                >
                                    <QrCode className={`w-8 h-8 mx-auto mb-2 ${preferredMethod === 'qr_code' ? 'text-[#bb9f58]' : 'text-gray-400'
                                        }`} />
                                    <p className="font-medium text-[#336b6e]">QR Code</p>
                                    {preferredMethod === 'qr_code' && (
                                        <p className="text-xs text-[#bb9f58] mt-1 font-medium">✓ Preferred</p>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Save Button */}
                <div className="mt-6 bg-white rounded-lg shadow-md p-6">
                    <button
                        onClick={handleSave}
                        disabled={saving || (!hasBankData && !hasUpiData && !hasQrData) || (hasBankData && !bankValid) || (hasUpiData && !upiValid)}
                        className="w-full bg-[#bb9f58] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#a68a4a] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Save Payment Details
                            </>
                        )}
                    </button>

                    {/* Summary of filled methods */}
                    {(hasBankData || hasUpiData || hasQrData) && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700 font-medium mb-2">Payment methods added:</p>
                            <div className="flex flex-wrap gap-2">
                                {hasBankData && bankValid && (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">✓ Bank Transfer</span>
                                )}
                                {hasUpiData && upiValid && (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">✓ UPI ID</span>
                                )}
                                {hasQrData && (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">✓ QR Code</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Info Note */}
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>Note:</strong> Your payment details will be reviewed by admin before being approved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentSettings;

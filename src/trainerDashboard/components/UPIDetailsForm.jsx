import { useState } from 'react';
import { Smartphone, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * UPI Details Form Component
 * Collects and validates UPI ID
 */
const UPIDetailsForm = ({ initialData = {}, onChange, disabled = false }) => {
    const [upiId, setUpiId] = useState(initialData.upiId || '');
    const [error, setError] = useState('');
    const [touched, setTouched] = useState(false);

    // UPI ID validation (format: username@bankname)
    const validateUPI = (upi) => {
        const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]+$/;
        return upiRegex.test(upi);
    };

    const handleChange = (value) => {
        setUpiId(value);

        // Validate
        if (!value) {
            setError('UPI ID is required');
        } else if (!validateUPI(value)) {
            setError('Invalid UPI ID format (e.g., username@upi)');
        } else {
            setError('');
        }

        // Notify parent
        if (onChange) {
            const isValid = value && validateUPI(value);
            onChange({ upiId: value }, isValid);
        }
    };

    const handleBlur = () => {
        setTouched(true);
    };

    const isValid = upiId && validateUPI(upiId);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#bb9f58]/30">
                <Smartphone className="w-6 h-6 text-[#bb9f58]" />
                <h3 className="text-lg font-semibold text-[#336b6e]">UPI Details</h3>
            </div>

            <div>
                <label className="block text-sm font-medium text-[#336b6e] mb-2">
                    UPI ID <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={upiId}
                    onChange={(e) => handleChange(e.target.value.toLowerCase())}
                    onBlur={handleBlur}
                    disabled={disabled}
                    placeholder="e.g., yourname@paytm"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bb9f58] lowercase ${touched && error
                            ? 'border-red-500 bg-red-50'
                            : touched && isValid
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-300'
                        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />

                {touched && error && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </p>
                )}

                {touched && isValid && (
                    <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Valid UPI ID
                    </p>
                )}

                <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium mb-2">
                        Common UPI ID formats:
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>• phonenumber@paytm</li>
                        <li>• username@okaxis</li>
                        <li>• mobilenumber@ybl (PhonePe)</li>
                        <li>• accountnumber@icici</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default UPIDetailsForm;

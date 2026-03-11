import { useState } from 'react';
import { CreditCard, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Bank Details Form Component
 * Collects and validates bank account information
 */
const BankDetailsForm = ({ initialData = {}, onChange, disabled = false }) => {
    const [formData, setFormData] = useState({
        accountNumber: initialData.accountNumber || '',
        confirmAccountNumber: initialData.accountNumber || '',
        ifscCode: initialData.ifscCode || '',
        bankName: initialData.bankName || '',
        accountHolderName: initialData.accountHolderName || '',
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // IFSC Code validation (format: ABCD0123456)
    const validateIFSC = (ifsc) => {
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        return ifscRegex.test(ifsc);
    };

    // Account number validation (9-18 digits)
    const validateAccountNumber = (accountNumber) => {
        const accountRegex = /^[0-9]{9,18}$/;
        return accountRegex.test(accountNumber);
    };

    const handleChange = (field, value) => {
        const newFormData = { ...formData, [field]: value };
        setFormData(newFormData);

        // Validate on change
        validateField(field, value, newFormData);

        // Notify parent component
        if (onChange) {
            const isValid = validateAllFields(newFormData);
            onChange({
                accountNumber: newFormData.accountNumber,
                ifscCode: newFormData.ifscCode.toUpperCase(),
                bankName: newFormData.bankName,
                accountHolderName: newFormData.accountHolderName,
            }, isValid);
        }
    };

    const handleBlur = (field) => {
        setTouched({ ...touched, [field]: true });
        validateField(field, formData[field], formData);
    };

    const validateField = (field, value, currentFormData = formData) => {
        const newErrors = { ...errors };

        switch (field) {
            case 'accountNumber':
                if (!value) {
                    newErrors.accountNumber = 'Account number is required';
                } else if (!validateAccountNumber(value)) {
                    newErrors.accountNumber = 'Invalid account number (9-18 digits)';
                } else {
                    delete newErrors.accountNumber;
                }
                break;

            case 'confirmAccountNumber':
                if (value !== currentFormData.accountNumber) {
                    newErrors.confirmAccountNumber = 'Account numbers do not match';
                } else {
                    delete newErrors.confirmAccountNumber;
                }
                break;

            case 'ifscCode':
                if (!value) {
                    newErrors.ifscCode = 'IFSC code is required';
                } else if (!validateIFSC(value.toUpperCase())) {
                    newErrors.ifscCode = 'Invalid IFSC code format (e.g., SBIN0001234)';
                } else {
                    delete newErrors.ifscCode;
                }
                break;

            case 'bankName':
                if (!value || value.trim().length < 3) {
                    newErrors.bankName = 'Bank name is required';
                } else {
                    delete newErrors.bankName;
                }
                break;

            case 'accountHolderName':
                if (!value || value.trim().length < 2) {
                    newErrors.accountHolderName = 'Account holder name is required';
                } else {
                    delete newErrors.accountHolderName;
                }
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateAllFields = (data = formData) => {
        const fields = ['accountNumber', 'confirmAccountNumber', 'ifscCode', 'bankName', 'accountHolderName'];
        let isValid = true;

        fields.forEach(field => {
            if (!validateField(field, data[field], data)) {
                isValid = false;
            }
        });

        return isValid;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#bb9f58]/30">
                <CreditCard className="w-6 h-6 text-[#bb9f58]" />
                <h3 className="text-lg font-semibold text-[#336b6e]">Bank Account Details</h3>
            </div>

            {/* Account Holder Name */}
            <div>
                <label className="block text-sm font-medium text-[#336b6e] mb-2">
                    Account Holder Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={formData.accountHolderName}
                    onChange={(e) => handleChange('accountHolderName', e.target.value)}
                    onBlur={() => handleBlur('accountHolderName')}
                    disabled={disabled}
                    placeholder="Enter account holder name"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bb9f58] ${touched.accountHolderName && errors.accountHolderName
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-300'
                        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
                {touched.accountHolderName && errors.accountHolderName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.accountHolderName}
                    </p>
                )}
            </div>

            {/* Account Number */}
            <div>
                <label className="block text-sm font-medium text-[#336b6e] mb-2">
                    Account Number <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => handleChange('accountNumber', e.target.value.replace(/\D/g, ''))}
                    onBlur={() => handleBlur('accountNumber')}
                    disabled={disabled}
                    placeholder="Enter account number"
                    maxLength={18}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bb9f58] ${touched.accountNumber && errors.accountNumber
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-300'
                        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
                {touched.accountNumber && errors.accountNumber && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.accountNumber}
                    </p>
                )}
            </div>

            {/* Confirm Account Number */}
            <div>
                <label className="block text-sm font-medium text-[#336b6e] mb-2">
                    Confirm Account Number <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={formData.confirmAccountNumber}
                    onChange={(e) => handleChange('confirmAccountNumber', e.target.value.replace(/\D/g, ''))}
                    onBlur={() => handleBlur('confirmAccountNumber')}
                    disabled={disabled}
                    placeholder="Re-enter account number"
                    maxLength={18}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bb9f58] ${touched.confirmAccountNumber && errors.confirmAccountNumber
                            ? 'border-red-500 bg-red-50'
                            : formData.confirmAccountNumber && formData.accountNumber === formData.confirmAccountNumber
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-300'
                        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
                {touched.confirmAccountNumber && errors.confirmAccountNumber && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.confirmAccountNumber}
                    </p>
                )}
                {formData.confirmAccountNumber && formData.accountNumber === formData.confirmAccountNumber && !errors.confirmAccountNumber && (
                    <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Account numbers match
                    </p>
                )}
            </div>

            {/* IFSC Code */}
            <div>
                <label className="block text-sm font-medium text-[#336b6e] mb-2">
                    IFSC Code <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={formData.ifscCode}
                    onChange={(e) => handleChange('ifscCode', e.target.value.toUpperCase())}
                    onBlur={() => handleBlur('ifscCode')}
                    disabled={disabled}
                    placeholder="e.g., SBIN0001234"
                    maxLength={11}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bb9f58] uppercase ${touched.ifscCode && errors.ifscCode
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-300'
                        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
                {touched.ifscCode && errors.ifscCode && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.ifscCode}
                    </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                    11-character code (e.g., SBIN0001234)
                </p>
            </div>

            {/* Bank Name */}
            <div>
                <label className="block text-sm font-medium text-[#336b6e] mb-2">
                    Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => handleChange('bankName', e.target.value)}
                    onBlur={() => handleBlur('bankName')}
                    disabled={disabled}
                    placeholder="e.g., State Bank of India"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bb9f58] ${touched.bankName && errors.bankName
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-300'
                        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
                {touched.bankName && errors.bankName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.bankName}
                    </p>
                )}
            </div>
        </div>
    );
};

export default BankDetailsForm;

import { useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';

/**
 * QR Code Uploader Component
 * Handles QR code image upload to Cloudinary
 * Used for UPI payment QR codes
 */
const QRCodeUploader = ({ onUploadSuccess, currentQRCodeUrl, disabled = false }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(currentQRCodeUrl || null);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];

        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file (PNG, JPG, etc.)');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5MB');
            return;
        }

        setError(null);
        setUploading(true);

        try {
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);

            // Upload to Cloudinary
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
            formData.append('folder', 'yogapatha/payment_qr_codes');

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();

            // Call success callback with Cloudinary URL
            if (onUploadSuccess) {
                onUploadSuccess(data.secure_url);
            }

            setError(null);
        } catch (err) {
            console.error('Upload error:', err);
            setError('Failed to upload QR code. Please try again.');
            setPreviewUrl(currentQRCodeUrl || null);
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setPreviewUrl(null);
        if (onUploadSuccess) {
            onUploadSuccess(null);
        }
    };

    return (
        <div className="space-y-4">
            <label className="block text-sm font-medium text-[#336b6e]">
                UPI QR Code
            </label>

            {previewUrl ? (
                <div className="relative inline-block">
                    <img
                        src={previewUrl}
                        alt="UPI QR Code"
                        className="w-48 h-48 object-cover border-2 border-[#bb9f58] rounded-lg"
                    />
                    {!disabled && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                            ×
                        </button>
                    )}
                </div>
            ) : (
                <div className="border-2 border-dashed border-[#bb9f58] rounded-lg p-8 text-center hover:border-[#336b6e] transition-colors">
                    <input
                        type="file"
                        id="qr-code-upload"
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={disabled || uploading}
                        className="hidden"
                    />
                    <label
                        htmlFor="qr-code-upload"
                        className={`cursor-pointer ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Upload className="w-12 h-12 mx-auto text-[#bb9f58] mb-4" />
                        <p className="text-[#336b6e] font-medium mb-2">
                            {uploading ? 'Uploading...' : 'Click to upload QR code'}
                        </p>
                        <p className="text-sm text-gray-500">
                            PNG, JPG up to 5MB
                        </p>
                    </label>
                </div>
            )}

            {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            <p className="text-xs text-gray-500">
                Upload a screenshot or photo of your UPI QR code for easy payments
            </p>
        </div>
    );
};

export default QRCodeUploader;

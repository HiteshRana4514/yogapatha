// Cloudinary upload utility
// This handles file uploads to Cloudinary for trainer profile images and documents

const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

/**
 * Upload a file to Cloudinary
 * @param {File} file - The file to upload
 * @param {string} folder - The folder path in Cloudinary (e.g., 'trainers/avatars')
 * @param {Function} onProgress - Optional callback for upload progress (0-100)
 * @returns {Promise<string>} - The secure URL of the uploaded file
 */
export const uploadToCloudinary = async (file, folder = 'trainers', onProgress = null) => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary configuration missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env')
  }

  // Determine resource type - PDFs must use 'raw', images use 'image'
  const isPDF = file.type === 'application/pdf'
  const resourceType = isPDF ? 'raw' : 'image'

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  formData.append('folder', folder)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100
          onProgress(Math.round(percentComplete))
        }
      })
    }

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText)
        resolve(response.secure_url)
      } else {
        // Log detailed error for debugging
        console.error('Cloudinary upload failed:', xhr.status, xhr.responseText)
        try {
          const errorResponse = JSON.parse(xhr.responseText)
          reject(new Error(errorResponse.error?.message || 'Upload failed'))
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'))
    })

    // Use specific endpoint based on file type
    // PDFs go to /raw/upload, images go to /image/upload
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`)
    xhr.send(formData)
  })
}

/**
 * Upload multiple files to Cloudinary
 * @param {FileList|Array} files - The files to upload
 * @param {string} folder - The folder path in Cloudinary
 * @param {Function} onProgress - Optional callback for overall progress
 * @returns {Promise<Array>} - Array of objects with {url, name}
 */
export const uploadMultipleToCloudinary = async (files, folder = 'trainers', onProgress = null) => {
  const fileArray = Array.from(files)
  const uploadedUrls = []
  
  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i]
    
    try {
      const url = await uploadToCloudinary(file, folder, (progress) => {
        if (onProgress) {
          const overallProgress = ((i / fileArray.length) * 100) + (progress / fileArray.length)
          onProgress(Math.round(overallProgress))
        }
      })
      
      uploadedUrls.push({
        url,
        name: file.name
      })
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error)
      throw error
    }
  }
  
  return uploadedUrls
}

/**
 * Validate file before upload
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @returns {Object} - {valid: boolean, error: string}
 */
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf']
  } = options

  if (!file) {
    return { valid: false, error: 'No file provided' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: `File size must be less than ${maxSize / (1024 * 1024)}MB` }
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Allowed: JPG, PNG, WEBP, PDF' }
  }

  return { valid: true, error: null }
}

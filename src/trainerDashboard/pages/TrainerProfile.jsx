import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Award,
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Save,
  Camera,
  Building2,
  Shield,
  Eye,
  X,
  Plus,
  Share2,
  Copy,
  ExternalLink,
} from "lucide-react";
import supabase from "../../supabase/supabse";
import { useOutletContext } from "react-router-dom";
import {
  uploadToCloudinary,
  validateFile,
} from "../../utils/cloudinary";

function TrainerProfile() {
  const { userData } = useOutletContext();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    location: "",
    bio: "",
    experience: "",
    specializations: [],
    certifications: [], // Changed to array of {name, url}
    avatar: null,
    academyName: "",
    academyAddress: "",
    academyLogo: null,
    wantsPartnership: false,
    identityCard: null,
  });

  const [customSpecialization, setCustomSpecialization] = useState("");

  const [uploadProgress, setUploadProgress] = useState({});
  const [kycStatus, setKycStatus] = useState("pending"); // pending, approved, rejected
  const [partnershipStatus, setPartnershipStatus] = useState("pending"); // pending, approved, rejected
  const [trainerId, setTrainerId] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const specializationOptions = [
    "Strength Training",
    "Weight Loss",
    "Cardio Fitness",
    "Yoga",
    "HIIT",
    "Pilates",
    "Athletic Performance",
    "Rehabilitation",
    "Nutrition Counseling",
    "Senior Fitness",
    "Group Training",
    "Online Training",
  ];

  useEffect(() => {
    if (userData) {
      loadProfileData();
    }
  }, [userData]);

  const loadProfileData = async () => {
    try {
      // Fetch profile data from trainer_profiles table (only documents and partnership)
      const { data: profile, error } = await supabase
        .from("trainer_profiles")
        .select("*")
        .eq("user_id", userData.id)
        .single();

      if (profile) {
        setTrainerId(profile.id);
      }

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        throw error;
      }

      // All basic data comes from user metadata
      setFormData({
        firstName: userData.user_metadata?.firstName || "",
        lastName: userData.user_metadata?.lastName || "",
        email: userData.email || "",
        phone: userData.user_metadata?.phone || "",
        address: userData.user_metadata?.address || "",
        city: userData.user_metadata?.city || "",
        state: userData.user_metadata?.state || "",
        pincode: userData.user_metadata?.pincode || "",
        location: userData.user_metadata?.location || "",
        bio: userData.user_metadata?.bio || "",
        experience: userData.user_metadata?.experience || "",
        specializations: userData.user_metadata?.specializations || [],
        certifications: profile?.certifications || [], // Now from trainer_profiles
        avatar: profile?.avatar_url || null,
        academyName: profile?.academy_name || "",
        academyAddress: profile?.academy_address || "",
        academyLogo: profile?.academy_logo_url || null,
        wantsPartnership: profile?.wants_partnership || false,
        identityCard: profile?.identity_card_url || null,
      });

      if (profile) {
        setProfileData(profile);
        setKycStatus(profile.kyc_status || "pending");
        setPartnershipStatus(profile.partnership_status || "pending");
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      setErrorMessage("Failed to load profile data");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const toggleSpecialization = (spec) => {
    setFormData((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter((s) => s !== spec)
        : [...prev.specializations, spec],
    }));
  };

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if upload is allowed based on KYC status
    // Disable Gov ID upload when pending (under review) or approved
    // Only allow re-upload when rejected
    if (fieldName === "identityCard") {
      // Lock only if status is pending AND we already have a document (meaning it's under review)
      // OR if it's already approved.
      if (kycStatus === "pending" && profileData && formData.identityCard) {
        setErrorMessage(
          "Government ID upload is disabled while your KYC is under review. Please wait for admin verification."
        );
        return;
      }
      if (kycStatus === "approved") {
        setErrorMessage(
          "Your KYC is already approved. Government ID cannot be re-uploaded."
        );
        return;
      }
    }

    // Validate file
    const validImageTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
    ];
    const validDocTypes = [...validImageTypes, "application/pdf"];

    const allowedTypes =
      fieldName === "avatar" || fieldName === "academyLogo"
        ? validImageTypes
        : validDocTypes;

    const validation = validateFile(file, { allowedTypes });
    if (!validation.valid) {
      setErrorMessage(validation.error);
      return;
    }

    setUploadProgress((prev) => ({ ...prev, [fieldName]: 0 }));
    setErrorMessage("");

    try {
      // Determine folder based on field
      const folderMap = {
        avatar: `trainers/${userData.id}/avatar`,
        academyLogo: `trainers/${userData.id}/academy`,
        identityCard: `trainers/${userData.id}/documents`,
      };
      const folder =
        folderMap[fieldName] || `trainers/${userData.id}/documents`;

      // Upload to Cloudinary
      const url = await uploadToCloudinary(file, folder, (progress) => {
        setUploadProgress((prev) => ({ ...prev, [fieldName]: progress }));
      });

      setFormData((prev) => ({
        ...prev,
        [fieldName]: url,
      }));

      // If trainer re-uploads Gov ID after rejection, reset KYC status to pending
      if (fieldName === "identityCard" && kycStatus === "rejected") {
        setKycStatus("pending");
        // Update the DB immediately so admin sees the new pending status
        await supabase
          .from("trainer_profiles")
          .update({ kyc_status: "pending", identity_card_url: url })
          .eq("user_id", userData.id);
      }

      setTimeout(() => {
        setUploadProgress((prev) => ({ ...prev, [fieldName]: undefined }));
      }, 2000);
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMessage("Failed to upload file. Please try again.");
      setUploadProgress((prev) => ({ ...prev, [fieldName]: undefined }));
    }
  };



  // New certification management functions
  const addCertification = () => {
    setFormData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, { name: "", url: "" }],
    }));
  };

  const removeCertification = (index) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  const updateCertificationName = (index, name) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) =>
        i === index ? { ...cert, name } : cert
      ),
    }));
  };

  const handleCertificationFileUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    // No KYC restriction for certifications
    // Trainers can upload certifications anytime

    setErrorMessage("");
    setIsLoading(true);

    try {
      // Validate file
      const validation = validateFile(file, 5);
      if (!validation.valid) {
        setErrorMessage(validation.error);
        setIsLoading(false);
        return;
      }

      // Upload to Cloudinary
      const folder = `trainers/${userData.id}/certifications`;
      const url = await uploadToCloudinary(file, folder, (progress) => {
        setUploadProgress((prev) => ({
          ...prev,
          [`certification_${index}`]: progress,
        }));
      });

      // Update certification URL
      setFormData((prev) => ({
        ...prev,
        certifications: prev.certifications.map((cert, i) =>
          i === index ? { ...cert, url } : cert
        ),
      }));

      setTimeout(() => {
        setUploadProgress((prev) => ({
          ...prev,
          [`certification_${index}`]: undefined,
        }));
      }, 2000);
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMessage("Failed to upload certificate. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Validate required fields
      if (!formData.identityCard) {
        throw new Error("Government ID card is required");
      }
      // Note: Certifications are now optional - trainers can add them later
      if (formData.wantsPartnership && !formData.academyName) {
        throw new Error("Academy name is required for partnership");
      }
      if (formData.wantsPartnership && !formData.academyAddress) {
        throw new Error("Academy address is required for partnership");
      }

      // Update auth user metadata (basic info only - NO certifications)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          location: formData.location,
          bio: formData.bio,
          experience: formData.experience,
          specializations: formData.specializations,
          role: 'trainer', // Ensure role is always set
        },
      });

      if (authError) throw authError;

      // Prepare trainer profile data
      const profileData = {
        user_id: userData.id,
        avatar_url: formData.avatar,
        identity_card_url: formData.identityCard,
        certifications: formData.certifications, // Array of {name, url}
        wants_partnership: formData.wantsPartnership,
        updated_at: new Date().toISOString(),
      };

      // KYC status is always saved (for all trainers)
      profileData.kyc_status = kycStatus;

      // Add partnership fields only if wants_partnership is true
      if (formData.wantsPartnership) {
        profileData.academy_name = formData.academyName;
        profileData.academy_address = formData.academyAddress;
        profileData.academy_logo_url = formData.academyLogo;
        profileData.partnership_status = partnershipStatus || "pending";
      } else {
        // Clear partnership fields if not a partner
        profileData.academy_name = null;
        profileData.academy_address = null;
        profileData.academy_logo_url = null;
        profileData.partnership_status = null;
      }

      // Upsert trainer profile
      const { error: profileError } = await supabase
        .from("trainer_profiles")
        .upsert(profileData, {
          onConflict: "user_id",
        });

      if (profileError) throw profileError;

      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(""), 5000);

      // Reload profile data
      await loadProfileData();
    } catch (err) {
      console.error("Save error:", err);
      setErrorMessage(err.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const getKycStatusBadge = () => {
    const statusConfig = {
      pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: Clock,
        text: "KYC Pending",
      },
      approved: {
        color: "bg-green-100 text-green-800 border-green-300",
        icon: CheckCircle,
        text: "KYC Approved",
      },
      rejected: {
        color: "bg-red-100 text-red-800 border-red-300",
        icon: XCircle,
        text: "KYC Rejected",
      },
    };

    const config = statusConfig[kycStatus] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${config.color} font-semibold`}
      >
        <Icon className="w-5 h-5" />
        {config.text}
      </div>
    );
  };

  const getPartnershipStatusBadge = () => {
    const statusConfig = {
      pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: Clock,
        text: "Partnership Pending",
      },
      approved: {
        color: "bg-green-100 text-green-800 border-green-300",
        icon: CheckCircle,
        text: "Partnership Approved",
      },
      rejected: {
        color: "bg-red-100 text-red-800 border-red-300",
        icon: XCircle,
        text: "Partnership Rejected",
      },
    };

    const config = statusConfig[partnershipStatus] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${config.color} font-semibold`}
      >
        <Icon className="w-5 h-5" />
        {config.text}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#336b6e] to-[#2a5557] rounded-2xl p-8 text-white">
        <div className="block md:flex items-center justify-between ">
          <div className="mb-4">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <User className="w-8 h-8" />
              My Profile
            </h1>
            <p className="text-lg text-white/80">
              View and manage your professional profile
            </p>
          </div>
          <div className="flex gap-3">
            {trainerId && (
              <button
                onClick={() => setShowShareModal(true)}
                className="bg-white/10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                Share Profile
              </button>
            )}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-[#bb9f58] text-[#336b6e] px-6 py-3 rounded-xl font-semibold hover:bg-[#a08a4a] transition-all"
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Avatar & Basic Info */}
        <div className="space-y-6">
          {/* Avatar */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-[#336b6e] mb-4">
              Profile Picture
            </h3>
            <div className="flex flex-col items-center">
              <div className="relative">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-[#bb9f58]"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#336b6e] to-[#2a5557] flex items-center justify-center border-4 border-[#bb9f58]">
                    <User className="w-16 h-16 text-[#bb9f58]" />
                  </div>
                )}
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-[#bb9f58] p-2 rounded-full cursor-pointer hover:bg-[#a08a4a] transition-all">
                    <Camera className="w-5 h-5 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "avatar")}
                    />
                  </label>
                )}
              </div>
              {uploadProgress.avatar !== undefined && (
                <div className="w-full mt-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#bb9f58] h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress.avatar}%` }}
                    ></div>
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-4 text-center">
                {isEditing
                  ? "Click camera icon to upload"
                  : "Your profile picture"}
              </p>
            </div>
          </div>

          {/* KYC Status - Always visible */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-[#336b6e] mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#bb9f58]" />
              KYC Verification Status
            </h3>
            <div className="text-center">
              {getKycStatusBadge()}
              <p className="text-sm text-gray-600 mt-4">
                {!profileData &&
                  "Complete your profile and upload documents to get verified."}
                {profileData && kycStatus === "pending" &&
                  "Your documents are under review by admin. Government ID upload is disabled."}
                {kycStatus === "approved" &&
                  "Your profile is verified and approved!"}
                {kycStatus === "rejected" &&
                  "Your KYC verification was rejected. You can now re-upload your Government ID."}
              </p>
              {profileData?.admin_notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-[#336b6e] mb-1">
                    Admin Notes:
                  </p>
                  <p className="text-sm text-gray-700">
                    {profileData.admin_notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Partnership Status - Only if wants partnership */}
          {formData.wantsPartnership && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-[#336b6e] mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#bb9f58]" />
                Partnership Status
              </h3>
              <div className="text-center">
                {getPartnershipStatusBadge()}
                <p className="text-sm text-gray-600 mt-4">
                  {partnershipStatus === "pending" &&
                    "Your partnership request is under review"}
                  {partnershipStatus === "approved" &&
                    "Congratulations! You are now a partner"}
                  {partnershipStatus === "rejected" &&
                    "Your partnership request was not approved"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Middle & Right Columns - Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-[#336b6e] mb-6">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#336b6e] mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#336b6e] mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#336b6e] mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#336b6e] mb-2">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#336b6e] mb-2">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 w-5 h-5 text-[#336b6e] opacity-50" />
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    rows={2}
                    placeholder="Street address, apartment, suite, etc."
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all resize-vertical disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#336b6e] mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="City"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#336b6e] mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="State"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#336b6e] mb-2">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Pincode"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#336b6e] mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all resize-vertical disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-[#336b6e] mb-6 flex items-center gap-2">
              <Award className="w-6 h-6 text-[#bb9f58]" />
              Professional Information
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#336b6e] mb-2">
                  Experience Level
                </label>
                <select
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select experience level</option>
                  <option value="1-2 years">1-2 years</option>
                  <option value="3-5 years">3-5 years</option>
                  <option value="5-10 years">5-10 years</option>
                  <option value="10+ years">10+ years</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#336b6e] mb-2">
                  Specializations
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                  {specializationOptions.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => isEditing && toggleSpecialization(spec)}
                      disabled={!isEditing}
                      className={`px-3 py-2 text-sm rounded-lg border-2 transition-all ${formData.specializations.includes(spec)
                        ? "bg-[#336b6e] text-[#bb9f58] border-[#336b6e]"
                        : "bg-white text-[#336b6e] border-gray-200 hover:border-[#bb9f58]"
                        } ${!isEditing
                          ? "cursor-not-allowed opacity-70"
                          : "cursor-pointer"
                        }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>

                {/* Custom Specializations */}
                {formData.specializations.filter(
                  (s) => !specializationOptions.includes(s)
                ).length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-[#336b6e] mb-2">
                        Custom Specializations:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {formData.specializations
                          .filter((s) => !specializationOptions.includes(s))
                          .map((spec, index) => (
                            <div
                              key={index}
                              className="inline-flex items-center gap-2 px-3 py-1 bg-[#bb9f58] text-white rounded-lg text-sm"
                            >
                              <span>{spec}</span>
                              {isEditing && (
                                <button
                                  type="button"
                                  onClick={() => toggleSpecialization(spec)}
                                  className="hover:text-red-200 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                {/* Add Custom Specialization */}
                {isEditing && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customSpecialization}
                      onChange={(e) => setCustomSpecialization(e.target.value)}
                      placeholder="Add custom specialization..."
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all text-sm"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (
                            customSpecialization.trim() &&
                            !formData.specializations.includes(
                              customSpecialization.trim()
                            )
                          ) {
                            setFormData((prev) => ({
                              ...prev,
                              specializations: [
                                ...prev.specializations,
                                customSpecialization.trim(),
                              ],
                            }));
                            setCustomSpecialization("");
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          customSpecialization.trim() &&
                          !formData.specializations.includes(
                            customSpecialization.trim()
                          )
                        ) {
                          setFormData((prev) => ({
                            ...prev,
                            specializations: [
                              ...prev.specializations,
                              customSpecialization.trim(),
                            ],
                          }));
                          setCustomSpecialization("");
                        }
                      }}
                      className="px-4 py-2 bg-[#336b6e] text-[#bb9f58] rounded-lg hover:bg-[#2a5557] transition-all text-sm font-medium"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#336b6e] mb-2">
                  Government Issued ID Card{" "}
                  <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  Required for all trainers for verification
                </p>
                {uploadProgress.identityCard !== undefined ? (
                  <div className="flex items-center justify-center p-8 bg-[#fdfcf3] rounded-lg">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-[#336b6e] animate-spin mx-auto mb-2" />
                      <p className="text-sm text-[#336b6e] font-medium">
                        Uploading Government ID...
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {uploadProgress.identityCard}%
                      </p>
                    </div>
                  </div>
                ) : formData.identityCard ? (
                  <div className="flex items-center justify-between p-4 bg-[#fdfcf3] rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-6 h-6 text-[#336b6e]" />
                      <div>
                        <p className="text-sm font-medium text-[#336b6e]">
                          ID Card Uploaded
                        </p>
                        <a
                          href={formData.identityCard}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#bb9f58] hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View Document
                        </a>
                      </div>
                    </div>
                    {isEditing && (
                      (kycStatus === "pending" || kycStatus === "approved") ? (
                        // Locked: cannot re-upload while pending or approved
                        <div
                          title={
                            kycStatus === "approved"
                              ? "KYC approved – re-upload not allowed"
                              : "KYC under review – re-upload disabled"
                          }
                          className="flex items-center gap-2 bg-gray-200 text-gray-400 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed select-none"
                        >
                          <Shield className="w-4 h-4" />
                          {kycStatus === "approved" ? "Approved" : "Under Review"}
                        </div>
                      ) : (
                        // Allowed: rejected state – let trainer re-upload
                        <label className="cursor-pointer">
                          <div className="bg-[#336b6e] text-[#bb9f58] px-4 py-2 rounded-lg hover:bg-[#2a5557] transition-all text-sm font-medium flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Re-upload
                          </div>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, "identityCard")}
                          />
                        </label>
                      )
                    )}
                  </div>
                ) : isEditing ? (
                  // No ID uploaded yet – only lock if status is approved
                  // If pending and no ID, allow the first upload
                  kycStatus === "approved" ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50 cursor-not-allowed">
                      <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400 font-medium">
                        Upload locked – KYC approved
                      </p>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-[#bb9f58] transition-all text-center">
                        <Shield className="w-8 h-8 text-[#336b6e] mx-auto mb-2" />
                        <p className="text-sm text-[#336b6e] font-medium">
                          Upload Government ID
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Aadhar, PAN, Driving License, etc.
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF, JPG, PNG up to 5MB
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "identityCard")}
                      />
                    </label>
                  )
                ) : (
                  <p className="text-sm text-gray-500">No ID card uploaded</p>
                )}
              </div>

              {/* Certifications Section - NEW */}
              <div>
                <label className="block text-sm font-medium text-[#336b6e] mb-2">
                  Certifications
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  Add your professional certifications with supporting documents
                </p>

                {formData.certifications.length > 0 ? (
                  <div className="space-y-3">
                    {formData.certifications.map((cert, index) => (
                      <div
                        key={index}
                        className="p-4 bg-[#fdfcf3] rounded-lg border border-gray-200"
                      >
                        <div className="flex items-start gap-3">
                          <Award className="w-5 h-5 text-[#336b6e] mt-1 flex-shrink-0" />
                          <div className="flex-1 space-y-2">
                            {isEditing ? (
                              <>
                                <input
                                  type="text"
                                  value={cert.name}
                                  onChange={(e) =>
                                    updateCertificationName(index, e.target.value)
                                  }
                                  placeholder="Certification name (e.g., NASM-CPT, RYT-200)"
                                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:border-[#bb9f58] focus:outline-none transition-all text-sm"
                                />
                                <div className="flex items-center gap-2">
                                  {uploadProgress[`certification_${index}`] !==
                                    undefined ? (
                                    <div className="flex items-center gap-2 text-xs text-[#336b6e]">
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      <span>
                                        Uploading... {uploadProgress[`certification_${index}`]}%
                                      </span>
                                    </div>
                                  ) : cert.url ? (
                                    <>
                                      <a
                                        href={cert.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-[#bb9f58] hover:underline flex items-center gap-1"
                                      >
                                        <Eye className="w-3 h-3" />
                                        View Certificate
                                      </a>
                                      <label className="cursor-pointer text-xs text-[#336b6e] hover:text-[#bb9f58] flex items-center gap-1">
                                        <Upload className="w-3 h-3" />
                                        Replace
                                        <input
                                          type="file"
                                          accept="image/*,application/pdf"
                                          className="hidden"
                                          onChange={(e) =>
                                            handleCertificationFileUpload(e, index)
                                          }
                                        />
                                      </label>
                                    </>
                                  ) : (
                                    <label className="cursor-pointer text-xs text-[#336b6e] hover:text-[#bb9f58] flex items-center gap-1">
                                      <Upload className="w-3 h-3" />
                                      Upload Certificate
                                      <input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        className="hidden"
                                        onChange={(e) =>
                                          handleCertificationFileUpload(e, index)
                                        }
                                      />
                                    </label>
                                  )}
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="text-sm font-medium text-[#336b6e]">
                                  {cert.name || "Unnamed Certification"}
                                </p>
                                {cert.url && (
                                  <a
                                    href={cert.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-[#bb9f58] hover:underline flex items-center gap-1"
                                  >
                                    <Eye className="w-3 h-3" />
                                    View Certificate
                                  </a>
                                )}
                              </>
                            )}
                          </div>
                          {isEditing && (
                            <button
                              onClick={() => removeCertification(index)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    No certifications added yet
                  </p>
                )}

                {isEditing && (
                  <button
                    onClick={addCertification}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-[#336b6e] text-[#bb9f58] rounded-lg hover:bg-[#2a5557] transition-all text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Certification
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Partnership & Documents */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-[#336b6e] mb-6 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-[#bb9f58]" />
              Partnership & Verification
            </h3>

            <div className="space-y-6">
              {/* Partnership Toggle */}
              <div className="flex items-center justify-between p-4 bg-[#fdfcf3] rounded-lg">
                <div>
                  <p className="font-semibold text-[#336b6e]">
                    Become a Partner
                  </p>
                  <p className="text-sm text-gray-600">
                    Join our partner network with your academy
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="wantsPartnership"
                    checked={formData.wantsPartnership}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#bb9f58]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#336b6e]"></div>
                </label>
              </div>

              {formData.wantsPartnership && (
                <>
                  {/* Academy Name */}
                  <div>
                    <label className="block text-sm font-medium text-[#336b6e] mb-2">
                      Academy/Institute Name{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="academyName"
                      value={formData.academyName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter your academy name"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Academy Address */}
                  <div>
                    <label className="block text-sm font-medium text-[#336b6e] mb-2">
                      Academy Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="academyAddress"
                      value={formData.academyAddress}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      rows={3}
                      placeholder="Enter complete address of your academy/institute"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all resize-vertical disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Academy Logo */}
                  <div>
                    <label className="block text-sm font-medium text-[#336b6e] mb-2">
                      Academy Logo (Optional)
                    </label>
                    {formData.academyLogo ? (
                      <div className="flex items-center gap-4">
                        <img
                          src={formData.academyLogo}
                          alt="Academy Logo"
                          className="w-20 h-20 object-contain border-2 border-gray-200 rounded-lg"
                        />
                        {isEditing && (
                          <label className="flex-1 cursor-pointer">
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-[#bb9f58] transition-all text-center">
                              <Upload className="w-6 h-6 text-[#336b6e] mx-auto mb-2" />
                              <p className="text-sm text-[#336b6e]">
                                Change Logo
                              </p>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handleFileUpload(e, "academyLogo")
                              }
                            />
                          </label>
                        )}
                      </div>
                    ) : isEditing ? (
                      <label className="cursor-pointer block">
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-[#bb9f58] transition-all text-center">
                          <Upload className="w-8 h-8 text-[#336b6e] mx-auto mb-2" />
                          <p className="text-sm text-[#336b6e] font-medium">
                            Upload Academy Logo
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG up to 5MB
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "academyLogo")}
                        />
                      </label>
                    ) : (
                      <p className="text-sm text-gray-500">No logo uploaded</p>
                    )}
                  </div>
                </>
              )}

              {/* Identity Card - Required for ALL trainers */}



            </div>
          </div>

          {/* Save Button */}
          {isEditing && (
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 border-2 border-gray-300 text-[#336b6e] rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="px-6 py-3 bg-[#336b6e] text-[#bb9f58] rounded-xl font-semibold hover:bg-[#2a5557] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Share Profile Modal */}
      {showShareModal && trainerId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-[#336b6e]">Share Your Profile</h3>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setLinkCopied(false);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              Share this link with potential clients so they can view your professional profile
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 break-all">
              <p className="text-sm text-gray-700 font-mono">
                {window.location.origin}/trainer/{trainerId}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/trainer/${trainerId}`);
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#336b6e] text-white rounded-lg font-semibold hover:bg-[#2a5557] transition-colors"
              >
                {linkCopied ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy Link
                  </>
                )}
              </button>
              <a
                href={`${window.location.origin}/trainer/${trainerId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#336b6e] text-[#336b6e] rounded-lg font-semibold hover:bg-[#336b6e] hover:text-white transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                Preview
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainerProfile;

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Award,
  Star,
  CheckCircle,
  Calendar,
  Briefcase,
  ArrowLeft,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Sparkles,
  Target,
  Heart,
  Shield,
  Users,
  Zap,
  Quote,
} from 'lucide-react';
import supabase from '../supabase/supabse';
import BookingModal from '../components/BookingModal';
import SEO from '../components/SEO';
import { getTrainerSchema } from '../utils/SchemaUtils';

const PublicTrainerProfile = () => {
  const { trainerId } = useParams();
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    fetchTrainerProfile();
  }, [trainerId]);

  useEffect(() => {
    if (!loading && trainer) {
      // Notify prerenderer that dynamic content is ready
      const timer = setTimeout(() => {
        window.prerenderReady = true;
        window.dispatchEvent(new Event('render-event'));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, trainer]);

  const fetchTrainerProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .rpc('get_public_trainer_profile', { trainer_profile_id: trainerId });

      if (fetchError) {
        setError('Trainer not found or profile is not active');
        return;
      }

      if (!data) {
        setError('Trainer not found or profile is not active');
        return;
      }

      setTrainer(data);
    } catch (err) {
      console.error('Error fetching trainer profile:', err);
      setError('Failed to load trainer profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const phoneNumber = '918529897856';
    const message = `Hi! I came across ${trainer?.first_name}'s profile on YogaPatha and I'm interested in training sessions. Could you help me get started?`;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const parseCertifications = (certs) => {
    if (!certs) return [];
    if (Array.isArray(certs)) return certs;
    if (typeof certs === 'string') {
      try { return JSON.parse(certs); } catch { return []; }
    }
    return [];
  };

  // Generic filler content shown on every profile
  const approach = [
    { icon: Target, title: 'Goal-Oriented Training', desc: 'Every session is designed around your personal goals — from weight loss to strength, flexibility, and beyond.' },
    { icon: Heart, title: 'Holistic Wellness', desc: 'We believe true fitness combines movement, mindset, and nutrition for lasting, meaningful transformation.' },
    { icon: Zap, title: 'Science-Backed Methods', desc: 'Training programs grounded in the latest fitness research to maximize results safely and efficiently.' },
    { icon: Shield, title: 'Safe & Supported', desc: 'Your safety is our top priority. All programs are designed to minimize injury and build sustainable habits.' },
  ];

  const whyChooseUs = [
    'Personalized training plans tailored to your unique body and goals',
    'Flexible scheduling to fit your busy lifestyle',
    'Ongoing motivation and accountability from your dedicated trainer',
    'Access to a supportive community of fellow fitness enthusiasts',
    'Regular progress tracking and plan adjustments',
    'Expert guidance on nutrition, recovery, and lifestyle habits',
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfcf3] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#336b6e] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#336b6e] font-semibold text-lg">Loading trainer profile...</p>
          <p className="text-gray-500 text-sm mt-1">Preparing your experience</p>
        </div>
      </div>
    );
  }

  if (error || !trainer) {
    return (
      <div className="min-h-screen bg-[#fdfcf3] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-[#336b6e]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-12 h-12 text-[#336b6e]" />
          </div>
          <h2 className="text-2xl font-bold text-[#336b6e] mb-3">Profile Not Found</h2>
          <p className="text-gray-600 mb-8">{error || 'This trainer profile is not available'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-[#336b6e] text-[#bb9f58] rounded-full font-semibold hover:bg-[#2a5557] transition-all duration-300 hover:scale-105 shadow-lg"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const certifications = parseCertifications(trainer.certificate_documents);
  const trainerName = `${trainer.first_name} ${trainer.last_name}`;

  return (
    <>
      <SEO
        title={`${trainerName} - Certified Yoga Trainer | YogaPatha`}
        description={trainer.bio || `Connect with ${trainerName}, a certified yoga trainer at YogaPatha for personalized wellness programs.`}
        ogImage={trainer.avatar_url}
        ogType="profile"
        canonicalUrl={`https://www.yogapatha.in/trainer/${trainerId}`}
        schemaData={getTrainerSchema({
          full_name: trainerName,
          bio: trainer.bio,
          profile_image: trainer.avatar_url,
        })}
      />
      <div className="min-h-screen bg-gradient-to-br from-[#fdfcf3] via-white to-[#f5f5f0]">
        {/* Top Nav Bar */}
        <div className="bg-gradient-to-r from-[#336b6e] via-[#2a5557] to-[#336b6e] text-white py-4 px-4 shadow-2xl sticky top-0 z-40">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white hover:text-[#bb9f58] transition-all duration-300 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-semibold">YogaPatha</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-5 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all duration-300 hover:scale-105 border border-white/20 text-sm font-semibold"
            >
              {copied ? <><Check className="w-4 h-4" /><span>Copied!</span></> : <><Share2 className="w-4 h-4" /><span>Share</span></>}
            </button>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="relative bg-gradient-to-br from-[#336b6e] to-[#1e4040] overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#bb9f58]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-[#bb9f58]/5 rounded-full" />

          <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 relative z-10">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
              {/* Avatar */}
              <div className="flex-shrink-0 relative">
                {trainer.avatar_url ? (
                  <img
                    src={trainer.avatar_url}
                    alt={trainerName}
                    className="w-44 h-44 rounded-full border-4 border-[#bb9f58] shadow-2xl object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${trainer.first_name}+${trainer.last_name}&background=bb9f58&color=fff&size=176`;
                    }}
                  />
                ) : (
                  <div className="w-44 h-44 rounded-full border-4 border-[#bb9f58] shadow-2xl bg-gradient-to-br from-[#bb9f58] to-[#a08a4a] flex items-center justify-center">
                    <span className="text-6xl font-bold text-white">
                      {trainer.first_name.charAt(0)}{trainer.last_name.charAt(0)}
                    </span>
                  </div>
                )}
                {trainer.kyc_status === 'approved' && (
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center border-3 border-white shadow-lg" title="Verified Trainer">
                    <CheckCircle className="w-7 h-7 text-white" />
                  </div>
                )}
              </div>

              {/* Hero Text */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                  <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">{trainerName}</h1>
                  {trainer.kyc_status === 'approved' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-semibold border border-green-400/30">
                      <CheckCircle className="w-4 h-4" /> Verified
                    </span>
                  )}
                </div>

                {/* Tagline */}
                <p className="text-[#bb9f58] font-semibold text-lg mb-4">
                  Certified Fitness & Wellness Coach · YogaPatha Partner
                </p>

                {/* Specialization Tags */}
                {trainer.specializations && trainer.specializations.length > 0 && (
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
                    {trainer.specializations.map((spec, idx) => (
                      <span key={idx} className="px-4 py-1.5 bg-[#bb9f58]/20 text-[#bb9f58] border border-[#bb9f58]/40 rounded-full text-sm font-semibold backdrop-blur-sm">
                        {spec}
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick Meta */}
                <div className="flex flex-wrap justify-center md:justify-start gap-5 text-white/70 mb-8">
                  {trainer.experience && (
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-[#bb9f58]" />
                      <span className="text-sm font-medium">{trainer.experience} Experience</span>
                    </div>
                  )}
                  {trainer.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#bb9f58]" />
                      <span className="text-sm font-medium">{trainer.location}</span>
                    </div>
                  )}
                  {certifications.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#bb9f58]" />
                      <span className="text-sm font-medium">{certifications.length} Certifications</span>
                    </div>
                  )}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-3">
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className="flex items-center justify-center gap-2 px-7 py-3.5 bg-[#bb9f58] hover:bg-[#a08a4a] text-white font-bold rounded-full transition-all duration-300 hover:scale-105 shadow-lg shadow-[#bb9f58]/30"
                  >
                    <Calendar className="w-5 h-5" />
                    Book Now
                  </button>
                  <button
                    onClick={handleWhatsApp}
                    className="flex items-center justify-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold rounded-full transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Contact on WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column — Main */}
            <div className="lg:col-span-2 space-y-8">

              {/* Bio / About */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-[#336b6e] mb-5 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-[#bb9f58]" />
                  About {trainer.first_name}
                </h2>
                {trainer.bio ? (
                  <p className="text-gray-700 leading-relaxed text-base">{trainer.bio}</p>
                ) : (
                  <p className="text-gray-600 leading-relaxed text-base">
                    Passionate about transforming lives through the power of movement, {trainer.first_name} brings a holistic approach to fitness and wellness. With a deep commitment to understanding each client's unique journey, {trainer.first_name} crafts personalized programs that deliver real, lasting results — whether you're just starting out or looking to take your performance to the next level.
                  </p>
                )}

                {/* Quote */}
                <div className="mt-6 p-5 bg-gradient-to-r from-[#336b6e]/5 to-[#bb9f58]/5 rounded-xl border-l-4 border-[#bb9f58]">
                  <Quote className="w-6 h-6 text-[#bb9f58] mb-2" />
                  <p className="text-[#336b6e] font-semibold italic text-base leading-relaxed">
                    "Your fitness journey is unique. My job is to make sure every step you take moves you closer to the best version of yourself."
                  </p>
                  <p className="text-sm text-[#bb9f58] mt-2 font-medium">— {trainerName}</p>
                </div>
              </div>

              {/* Training Approach */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-[#336b6e] mb-6 flex items-center gap-2">
                  <Target className="w-6 h-6 text-[#bb9f58]" />
                  Training Approach
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {approach.map(({ icon: Icon, title, desc }, idx) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-xl bg-[#fdfcf3] border border-gray-100 hover:border-[#bb9f58]/30 transition-colors duration-300">
                      <div className="w-10 h-10 rounded-xl bg-[#336b6e]/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-[#336b6e]" />
                      </div>
                      <div>
                        <p className="font-bold text-[#336b6e] text-sm mb-1">{title}</p>
                        <p className="text-gray-600 text-xs leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              {certifications.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-2xl font-bold text-[#336b6e] mb-6 flex items-center gap-2">
                    <Award className="w-6 h-6 text-[#bb9f58]" />
                    Certifications & Credentials
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {certifications.map((cert, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:border-[#bb9f58]/40 transition-all duration-300 bg-[#fdfcf3]">
                        <div className="w-9 h-9 rounded-lg bg-[#bb9f58]/10 flex items-center justify-center flex-shrink-0">
                          <Award className="w-5 h-5 text-[#bb9f58]" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#336b6e] text-sm">{cert.name || `Certificate ${idx + 1}`}</p>
                          {cert.url && (
                            <a href={cert.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#bb9f58] hover:underline mt-0.5 inline-block">
                              View Certificate →
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Academy Partner */}
              {trainer.wants_partnership && trainer.partnership_status === 'approved' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-2xl font-bold text-[#336b6e] mb-6 flex items-center gap-2">
                    <Star className="w-6 h-6 text-[#bb9f58]" />
                    Academy Partner
                  </h2>
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    {trainer.academy_logo_url && (
                      <img src={trainer.academy_logo_url} alt="Academy Logo" className="h-20 object-contain rounded-lg border border-gray-200 p-2" />
                    )}
                    <div className="space-y-2">
                      {trainer.academy_name && (
                        <div>
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Academy</p>
                          <p className="font-bold text-[#336b6e] text-lg">{trainer.academy_name}</p>
                        </div>
                      )}
                      {trainer.academy_address && (
                        <div className="flex items-start gap-2 text-gray-600">
                          <MapPin className="w-4 h-4 text-[#336b6e] mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{trainer.academy_address}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">

              {/* Book Card */}
              <div className="bg-gradient-to-br from-[#336b6e] to-[#1e4040] rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#bb9f58]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                  <Calendar className="w-10 h-10 text-[#bb9f58] mb-4" />
                  <h3 className="text-xl font-bold mb-2">Start Your Journey</h3>
                  <p className="text-white/70 text-sm mb-6 leading-relaxed">
                    Ready to transform your fitness? Book a consultation with {trainer.first_name} today — it's free!
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowBookingModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#bb9f58] hover:bg-[#a08a4a] text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                    >
                      <Calendar className="w-4 h-4" />
                      Book Now — It's Free
                    </button>
                    <button
                      onClick={handleWhatsApp}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat on WhatsApp
                    </button>
                  </div>
                </div>
              </div>

              {/* Why Choose This Trainer */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-[#336b6e] mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-[#bb9f58]" />
                  Why Train with Us?
                </h3>
                <ul className="space-y-3">
                  {whyChooseUs.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-[#336b6e] mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stats Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-[#336b6e] mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#bb9f58]" />
                  At a Glance
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: '100%', label: 'Personalized', icon: Target },
                    { value: trainer.experience || '5+ yrs', label: 'Experience', icon: Briefcase },
                    { value: certifications.length > 0 ? `${certifications.length}+` : 'Pro', label: 'Certifications', icon: Award },
                    { value: '24/7', label: 'Support', icon: Shield },
                  ].map(({ value, label, icon: Icon }, idx) => (
                    <div key={idx} className="text-center p-3 bg-[#fdfcf3] rounded-xl border border-gray-100">
                      <Icon className="w-5 h-5 text-[#bb9f58] mx-auto mb-1" />
                      <p className="font-bold text-[#336b6e] text-lg leading-none">{value}</p>
                      <p className="text-xs text-gray-500 mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Share Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-[#336b6e] mb-2">Share This Profile</h3>
                <p className="text-sm text-gray-500 mb-4">Know someone who could benefit? Share {trainer.first_name}'s profile!</p>
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#336b6e] text-[#336b6e] rounded-xl font-semibold hover:bg-[#336b6e] hover:text-white transition-all duration-300"
                >
                  {copied ? <><Check className="w-5 h-5" />Link Copied!</> : <><Copy className="w-5 h-5" />Copy Profile Link</>}
                </button>
              </div>
            </div>
          </div>

          {/* Bottom CTA Banner */}
          <div className="mt-12 bg-gradient-to-r from-[#336b6e] to-[#2a5557] rounded-3xl p-8 md:p-12 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-4 right-4 w-32 h-32 border-2 border-white rounded-full" />
              <div className="absolute bottom-4 left-4 w-24 h-24 border-2 border-white rounded-full" />
            </div>
            <div className="relative z-10">
              <Heart className="w-12 h-12 text-[#bb9f58] mx-auto mb-4" />
              <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Life?</h3>
              <p className="text-white/80 max-w-xl mx-auto mb-8">
                Take the first step toward a healthier, stronger, more confident you. Book a free consultation with {trainer.first_name} today!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-[#bb9f58] hover:bg-[#a08a4a] text-white font-bold rounded-full transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  <Calendar className="w-5 h-5" />
                  Book Free Consultation
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="flex items-center justify-center gap-2 px-8 py-4 border-2 border-[#bb9f58] text-[#bb9f58] font-bold rounded-full hover:bg-[#bb9f58] hover:text-white transition-all duration-300 hover:scale-105"
                >
                  <MessageCircle className="w-5 h-5" />
                  Contact on WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Modal */}
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          service={{ title: `Training Inquiry — ${trainerName}` }}
        />
      </div>
    </>
  );
};

export default PublicTrainerProfile;

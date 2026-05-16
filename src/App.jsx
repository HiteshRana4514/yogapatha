import './App.css'
import LandingPage from './pages/LandingPage'
import ServicesPage from './pages/ServicesPage'
import AboutUsPage from './pages/AboutUsPage'
import ContactUsPage from './pages/ContactUsPage'
import MediaPage from './pages/MediaPage'
import BlogsPage from './pages/BlogsPage'
import BlogDetailPage from './pages/BlogDetailPage'
import YTTCPage from './pages/YTTCPage'
import YTTCDetailPage from './pages/YTTCDetailPage'
import TrainerAuthPage from './pages/TrainerAuthPage'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsAndConditions from './pages/TermsAndConditions'
import TrainerCodeOfConduct from './pages/TrainerCodeOfConduct'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import EmailConfirmed from './pages/EmailConfirmed'
import Layout from './pages/Layout'
import ForgotPasswordComponent from './pages/ForgotPasswordComponent'
import TrainerDashboard from './trainerDashboard/pages/TrainerDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLoginPage from '../Admin_Panel/pages/AdminLoginPage'
import AdminDashboard from '../Admin_Panel/pages/AdminDashboard'
import DashboardContent from './trainerDashboard/components/DashboardContent'
import DemoClients from './trainerDashboard/pages/DemoClients'
import PermanentClients from './trainerDashboard/pages/PermanentClients'
import ClientDetail from './trainerDashboard/pages/ClientDetail'
import TrainerSettings from './trainerDashboard/pages/TrainerSettings'
import TrainerProfile from './trainerDashboard/pages/TrainerProfile'
import HelpSupport from './trainerDashboard/pages/HelpSupport'
import PaymentSettings from './trainerDashboard/pages/PaymentSettings'
import PaymentHistory from './trainerDashboard/pages/PaymentHistory'
import ClientsQueryPage from '../Admin_Panel/pages/ClientsQueryPage'
import AdminDashboardContent from '../Admin_Panel/components/AdminDashboardContent'
import TrainerManagement from '../Admin_Panel/pages/TrainerManagement'
import AdminDemoClients from '../Admin_Panel/pages/AdminDemoClients'
import AdminPermanentClients from '../Admin_Panel/pages/AdminPermanentClients'
import AdminClientDetailView from '../Admin_Panel/components/AdminClientDetailView'
import AdminSettings from '../Admin_Panel/pages/AdminSettings'
import ServiceManagement from '../Admin_Panel/pages/ServiceManagement'
import SupportTickets from '../Admin_Panel/pages/SupportTickets'
import MediaManagement from '../Admin_Panel/pages/MediaManagement'
import BlogManagement from '../Admin_Panel/pages/BlogManagement'
import TrainerAttendanceCalendar from '../Admin_Panel/pages/TrainerAttendanceCalendar'
import LocationsPage from './pages/LocationsPage'
import StatePage from './pages/StatePage'
import CityPage from './pages/CityPage'
import PublicTrainerProfile from './pages/PublicTrainerProfile'
import ServiceDetailPage from './pages/ServiceDetailPage'
import LocationManagement from '../Admin_Panel/pages/LocationManagement'
import AdminTransactions from '../Admin_Panel/pages/AdminTransactions'
import AdminInvoiceSettings from '../Admin_Panel/pages/AdminInvoiceSettings'
import ClientPayments from '../Admin_Panel/pages/ClientPayments'
import AdminTestimonials from '../Admin_Panel/pages/AdminTestimonials'
import AdminTeam from '../Admin_Panel/pages/AdminTeam'
import LandingPageCMS from '../Admin_Panel/pages/LandingPageCMS'
import AboutUsCMS from '../Admin_Panel/pages/AboutUsCMS'
import ContactUsCMS from '../Admin_Panel/pages/ContactUsCMS'
import CourseManagement from '../Admin_Panel/pages/CourseManagement'
import FooterCMS from '../Admin_Panel/pages/FooterCMS'
import GeneralQueryPage from '../Admin_Panel/pages/GeneralQueryPage'
import FAQManagement from '../Admin_Panel/pages/FAQManagement'
import ScrollToTop from './components/ScrollToTop'
import NotFound from './pages/NotFound'

function App() {

  return (
    <>
      <div>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Pages with header/footer */}
            <Route element={<Layout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/about_us" element={<AboutUsPage />} />
              <Route path="/contact_us" element={<ContactUsPage />} />
              <Route path="/media" element={<MediaPage />} />
              <Route path="/blogs" element={<BlogsPage />} />
              <Route path="/blogs/:slug" element={<BlogDetailPage />} />
              <Route path="/locations" element={<LocationsPage />} />
              <Route path="/locations/:stateSlug" element={<StatePage />} />
              <Route path="/locations/:stateSlug/:citySlug" element={<CityPage />} />
              <Route path="/services/:serviceId" element={<ServiceDetailPage />} />
              <Route path="/yttc" element={<YTTCPage />} />
              <Route path="/yttc/:slug" element={<YTTCDetailPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
              <Route path="/trainer-code-of-conduct" element={<TrainerCodeOfConduct />} />
            </Route>

            {/* Pages without header/footer */}
            <Route path="/trainer_login" element={<TrainerAuthPage />} />
            <Route path='/admin-login' element={<AdminLoginPage />} />
            <Route path="/email_confirmed" element={<EmailConfirmed />} />
            <Route path="/forgot_password" element={<ForgotPasswordComponent />} />
            <Route path="/trainer/:trainerId" element={<PublicTrainerProfile />} />

            {/* Trainer Dashboard - Protected Route */}
            <Route
              path="/trainer_dashboard"
              element={
                <ProtectedRoute role="trainer">
                  <TrainerDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardContent />} />
              <Route path="demo-clients" element={<DemoClients />} />
              <Route path="permanent-clients" element={<PermanentClients />} />
              <Route path="client/:clientId" element={<ClientDetail />} />
              <Route path="settings" element={<TrainerSettings />} />
              <Route path="profile" element={<TrainerProfile />} />
              <Route path="help-support" element={<HelpSupport />} />
              <Route path="payment-settings" element={<PaymentSettings />} />
              <Route path="payment-history" element={<PaymentHistory />} />
              <Route path="schedule" element={<TrainerAttendanceCalendar />} />
            </Route>

            {/* Admin Dashboard - Protected Route */}
            <Route
              path="/admin_dashboard"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboardContent />} />

              <Route path='clients_querry' element={<ClientsQueryPage />} />
              <Route path='general_queries' element={<GeneralQueryPage />} />
              <Route path="client_payments" element={<ClientPayments />} />
              <Route path="transactions" element={<AdminTransactions />} />
              <Route path="trainer_management" element={<TrainerManagement />} />
              <Route path="demo_clients" element={<AdminDemoClients />} />
              <Route path="permanent_clients" element={<AdminPermanentClients />} />
              <Route path="client/:clientId" element={<AdminClientDetailView />} />
              <Route path="service_management" element={<ServiceManagement />} />
              <Route path="media_management" element={<MediaManagement />} />
              <Route path="blog_management" element={<BlogManagement />} />
              <Route path="location_management" element={<LocationManagement />} />
              <Route path="course_management" element={<CourseManagement />} />
              <Route path="support_tickets" element={<SupportTickets />} />
              <Route path="testimonials" element={<AdminTestimonials />} />
              <Route path="team" element={<AdminTeam />} />
              <Route path="landing_cms" element={<LandingPageCMS />} />
              <Route path="faq_management" element={<FAQManagement />} />
              <Route path="about_cms" element={<AboutUsCMS />} />
              <Route path="contact_cms" element={<ContactUsCMS />} />
              <Route path="footer_cms" element={<FooterCMS />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="invoice_settings" element={<AdminInvoiceSettings />} />
            </Route>

            {/* Catch-all 404 Page */}
            <Route path="*" element={<NotFound />} />
          </Routes>

          {/* Floating button always visible */}

        </Router>
      </div>
    </>
  )
}

export default App

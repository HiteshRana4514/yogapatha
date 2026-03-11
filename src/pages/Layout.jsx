import { Outlet } from "react-router-dom";
import WhatsAppFloatingButton from "../components/WhatsAppFloatingButton";
import Header from "../components/Header";
import FooterSection from "../components/FooterSection";
export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Outlet /> 
      </main>
      <FooterSection />
      <WhatsAppFloatingButton
        phoneNumber="8529897856"
        message="Hello! I'm interested in your yoga services."
        companyName="YogaPatha Support"
      />
    </div>
  );
}

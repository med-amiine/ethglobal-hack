import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { RecentCases } from "./components/RecentCases";
import { Features } from "./components/Features";
import { ProtocolStandards } from "./components/ProtocolStandards";
import { Footer } from "./components/Footer";

function SectionDivider() {
  return (
    <div className="section-divider" aria-hidden="true">
      <div className="section-divider-inner">
        <div className="section-divider-line" />
        <div className="section-divider-mark">
          <span className="section-divider-dot" />
          <span className="section-divider-dot" />
          <span className="section-divider-dot" />
        </div>
        <div className="section-divider-line" />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <SectionDivider />
        <Features />
        <SectionDivider />
        <ProtocolStandards />
        <SectionDivider />
        <RecentCases />
      </main>
      <Footer />
    </div>
  );
}

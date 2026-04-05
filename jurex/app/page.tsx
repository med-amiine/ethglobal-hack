import { JurexHero } from "./components/JurexHero";
import { Footer } from "./components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <JurexHero />
      </main>
      <Footer />
    </div>
  );
}

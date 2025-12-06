import { Header } from '@/components/header';
import { Hero } from '@/components/hero';
import { Problem } from '@/components/problem';
import { HowItWorks } from '@/components/how-it-works';
import { Features } from '@/components/features';
import { LogoMarquee } from '@/components/tech-logos';
import { CTA } from '@/components/cta';
import { Footer } from '@/components/footer';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <LogoMarquee />
        <Problem />
        <HowItWorks />
        <Features />
        <CTA />
      </main>
      <Footer />
    </>
  );
}

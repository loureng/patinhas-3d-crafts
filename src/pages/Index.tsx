import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import CategoriesSection from "@/components/CategoriesSection";
import FeaturedProducts from "@/components/FeaturedProducts";
import HowItWorks from "@/components/HowItWorks";
import ProductionLoggerTest from "@/components/ProductionLoggerTest";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        {import.meta.env.DEV && (
          <div className="container mx-auto px-4 py-8">
            <ProductionLoggerTest />
          </div>
        )}
        <CategoriesSection />
        <FeaturedProducts />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

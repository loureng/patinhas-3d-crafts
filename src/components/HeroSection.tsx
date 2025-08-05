import { Link } from "react-router-dom";
import { ArrowRight, Star, Users, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-primary opacity-10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-secondary opacity-10 rounded-full blur-2xl" />

      <div className="container mx-auto px-4 py-16 md:py-24 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <Badge className="bg-gradient-primary text-primary-foreground px-4 py-1">
                ✨ Personalização 3D Disponível
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                <span className="text-foreground">Jardim das</span>{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Patinhas
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                Produtos únicos e personalizados para seus pets, casa e jardim. 
                Com impressão 3D, transformamos suas ideias em realidade.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow"
                asChild
              >
                <Link to="/personalizacao">
                  Personalizar Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                asChild
              >
                <Link to="/produtos">
                  Ver Catálogo
                </Link>
              </Button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">4.9/5</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">2.000+ clientes</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-secondary" />
                <span className="text-sm text-muted-foreground">Frete grátis</span>
              </div>
            </div>
          </div>

          {/* Right content - Hero image */}
          <div className="relative">
            <div className="relative z-10 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="bg-gradient-primary p-1 rounded-2xl shadow-glow">
                <div className="bg-background rounded-xl p-8">
                  <div className="text-center space-y-6">
                    <div className="mx-auto w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                      <img 
                        src="/lovable-uploads/6e03e475-6083-4d29-be79-60c3f1ffef52.png" 
                        alt="Jardim das Patinhas" 
                        className="w-20 h-20 animate-bounce-subtle"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-foreground">
                        Impressão 3D Personalizada
                      </h3>
                      <p className="text-muted-foreground">
                        Transforme suas ideias em produtos únicos para seus pets
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 pt-4">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <span className="text-2xl">🐕</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Pets</span>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <span className="text-2xl">🏠</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Casa</span>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <span className="text-2xl">🌿</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Jardim</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-secondary rounded-full animate-bounce-subtle opacity-60" />
            <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-primary rounded-full animate-bounce-subtle opacity-80" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 -right-8 w-4 h-4 bg-gradient-primary rounded-full animate-bounce-subtle opacity-70" style={{ animationDelay: '0.5s' }} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
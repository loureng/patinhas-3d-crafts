import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CategoriesSection = () => {
  const categories = [
    {
      id: "pets",
      name: "Pets",
      description: "Acessórios únicos para seu melhor amigo",
      icon: "🐕",
      image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop",
      itemCount: "150+ produtos",
      href: "/pets",
      gradient: "from-orange-400 to-orange-600",
    },
    {
      id: "casa",
      name: "Casa",
      description: "Decoração personalizada para seu lar",
      icon: "🏠",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
      itemCount: "200+ produtos",
      href: "/casa",
      gradient: "from-blue-400 to-blue-600",
    },
    {
      id: "jardim",
      name: "Jardim",
      description: "Tudo para seu espaço verde",
      icon: "🌿",
      image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop",
      itemCount: "100+ produtos",
      href: "/jardim",
      gradient: "from-green-400 to-green-600",
    },
    {
      id: "personalizacao",
      name: "Impressão 3D",
      description: "Crie produtos únicos com nossa tecnologia",
      icon: "🎯",
      image: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop",
      itemCount: "Ilimitado",
      href: "/personalizacao",
      gradient: "from-purple-400 to-purple-600",
      special: true,
    },
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Explore Nossas Categorias
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Encontre produtos únicos para cada necessidade do seu pet, casa e jardim
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Card 
              key={category.id}
              className={`group relative overflow-hidden border-0 shadow-lg hover:shadow-elegant transition-all duration-300 hover:scale-105 ${
                category.special ? 'ring-2 ring-primary/20' : ''
              }`}
            >
              <div className="relative">
                {/* Background image */}
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${category.gradient} opacity-80`} />
                </div>

                {/* Special badge */}
                {category.special && (
                  <div className="absolute top-3 right-3">
                    <div className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-bold">
                      NOVO
                    </div>
                  </div>
                )}

                {/* Content overlay */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{category.icon}</span>
                      <h3 className="text-xl font-bold">{category.name}</h3>
                    </div>
                    
                    <p className="text-sm opacity-90">
                      {category.description}
                    </p>
                    
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs opacity-75">
                        {category.itemCount}
                      </span>
                      
                      <Button
                        size="sm"
                        variant="secondary"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0"
                        asChild
                      >
                        <a href={category.href}>
                          Ver produtos
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-4 p-6 bg-gradient-primary rounded-2xl text-primary-foreground shadow-glow">
            <div className="text-left">
              <h3 className="text-lg font-bold">Não encontrou o que procura?</h3>
              <p className="text-sm opacity-90">Personalize um produto exclusivo para você!</p>
            </div>
            <Button 
              variant="secondary" 
              className="bg-white text-primary hover:bg-white/90"
            >
              Personalizar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
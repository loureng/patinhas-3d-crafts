import { Upload, Palette, Printer, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const HowItWorks = () => {
  const steps = [
    {
      step: 1,
      title: "Escolha ou Envie",
      description: "Selecione um produto do catálogo ou envie sua própria ideia/arquivo 3D",
      icon: Upload,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      step: 2,
      title: "Personalize",
      description: "Customize cores, textos, dimensões e materiais conforme sua preferência",
      icon: Palette,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      step: 3,
      title: "Impressão 3D",
      description: "Nossos especialistas imprimem seu produto com tecnologia de ponta",
      icon: Printer,
      color: "text-primary",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
    },
    {
      step: 4,
      title: "Receba em Casa",
      description: "Produto único entregue em sua casa com total segurança e rapidez",
      icon: Truck,
      color: "text-secondary",
      bgColor: "bg-green-50 dark:bg-green-950/30",
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <Badge className="bg-gradient-primary text-primary-foreground mb-4">
            Como Funciona
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Da Ideia ao Produto em 4 Passos
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transformamos sua criatividade em produtos únicos através da impressão 3D. 
            Um processo simples, rápido e totalmente personalizado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="relative">
                <Card className="group hover:shadow-elegant transition-all duration-300 hover:scale-105 border-0 shadow-lg">
                  <CardContent className="p-6 text-center space-y-4">
                    {/* Step number */}
                    <div className="relative">
                      <div className={`w-16 h-16 mx-auto ${step.bgColor} rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className={`h-8 w-8 ${step.color}`} />
                      </div>
                      <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs font-bold">
                        {step.step}
                      </Badge>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-foreground">
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Arrow connector (desktop only) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <div className="w-8 h-px bg-gradient-to-r from-primary to-transparent"></div>
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex flex-col items-center space-y-4 p-8 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl border border-primary/20">
            <h3 className="text-xl font-bold text-foreground">
              Pronto para criar algo único?
            </h3>
            <p className="text-muted-foreground max-w-md">
              Comece agora mesmo e veja sua ideia ganhar vida com nossa impressão 3D
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="px-6 py-3 bg-gradient-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity shadow-glow">
                Começar Personalização
              </button>
              <button className="px-6 py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
                Ver Exemplos
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
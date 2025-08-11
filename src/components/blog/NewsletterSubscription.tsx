import { useState } from "react";
import { Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface NewsletterSubscriptionProps {
  variant?: "default" | "compact" | "sidebar";
  className?: string;
}

const NewsletterSubscription = ({ 
  variant = "default", 
  className = "" 
}: NewsletterSubscriptionProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast.error("Por favor, insira um email válido");
      return;
    }

    setIsLoading(true);

    try {
      // Here you would integrate with Supabase to save the email
      // For now, simulating API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSubscribed(true);
      setEmail("");
      toast.success("Inscrição realizada com sucesso!");
    } catch (error) {
      toast.error("Erro ao inscrever. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="font-semibold text-green-800 mb-2">
            Inscrição Confirmada!
          </h3>
          <p className="text-sm text-muted-foreground">
            Obrigado por se inscrever em nossa newsletter. 
            Você receberá novidades em breve!
          </p>
        </CardContent>
      </Card>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`flex gap-2 ${className}`}>
        <Input
          type="email"
          placeholder="Seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          onClick={handleSubmit}
          disabled={isLoading}
        >
          <Mail className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <Card className={className}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Newsletter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Receba novidades sobre pets, jardim e decoração 3D!
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="Seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Inscrevendo..." : "Inscrever-se"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="rounded-full bg-primary/10 p-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl mb-2">
          Inscreva-se na Nossa Newsletter
        </CardTitle>
        <p className="text-muted-foreground">
          Receba dicas exclusivas sobre pets, jardim e as últimas novidades 
          em personalização 3D diretamente no seu email.
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Digite seu melhor email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="text-center"
          />
          
          <Button 
            type="submit" 
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? "Inscrevendo..." : "Quero Receber Novidades"}
          </Button>
          
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <Badge variant="secondary">Dicas de Jardim</Badge>
            <Badge variant="secondary">Novidades 3D</Badge>
            <Badge variant="secondary">Cuidados Pet</Badge>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Prometemos não fazer spam. Você pode cancelar a qualquer momento.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default NewsletterSubscription;
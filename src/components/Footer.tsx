import { Heart, Mail, Phone, MapPin, Facebook, Instagram, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img 
                src="/lovable-uploads/6e03e475-6083-4d29-be79-60c3f1ffef52.png" 
                alt="Jardim das Patinhas" 
                className="h-8 w-8"
              />
              <span className="text-lg font-bold text-primary">
                Jardim das Patinhas
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Produtos personalizados para pets, casa e jardim com impressão 3D. 
              Transformamos suas ideias em realidade com qualidade e carinho.
            </p>
            <div className="flex space-x-3">
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Twitter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Products */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Produtos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/pets" className="text-muted-foreground hover:text-primary transition-colors">
                  Acessórios para Pets
                </a>
              </li>
              <li>
                <a href="/casa" className="text-muted-foreground hover:text-primary transition-colors">
                  Decoração Casa
                </a>
              </li>
              <li>
                <a href="/jardim" className="text-muted-foreground hover:text-primary transition-colors">
                  Jardinagem
                </a>
              </li>
              <li>
                <a href="/personalizacao" className="text-muted-foreground hover:text-primary transition-colors">
                  Impressão 3D
                </a>
              </li>
              <li>
                <a href="/promocoes" className="text-muted-foreground hover:text-primary transition-colors">
                  Promoções
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Suporte</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="/como-funciona" className="text-muted-foreground hover:text-primary transition-colors">
                  Como Funciona
                </a>
              </li>
              <li>
                <a href="/envios" className="text-muted-foreground hover:text-primary transition-colors">
                  Envios e Entregas
                </a>
              </li>
              <li>
                <a href="/trocas" className="text-muted-foreground hover:text-primary transition-colors">
                  Trocas e Devoluções
                </a>
              </li>
              <li>
                <a href="/contato" className="text-muted-foreground hover:text-primary transition-colors">
                  Contato
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Newsletter</h3>
            <p className="text-sm text-muted-foreground">
              Receba ofertas exclusivas e novidades em primeira mão!
            </p>
            <div className="space-y-2">
              <Input 
                placeholder="Seu e-mail" 
                type="email"
                className="w-full"
              />
              <Button className="w-full bg-gradient-primary hover:opacity-90 transition-opacity">
                <Mail className="h-4 w-4 mr-2" />
                Inscrever-se
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Contact info */}
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>(11) 9999-9999</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>contato@jardimdaspatinhas.com.br</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>São Paulo, SP</span>
            </div>
          </div>

          {/* Payment methods */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">Pagamento:</span>
            <div className="flex space-x-2">
              <div className="w-8 h-5 bg-primary rounded text-xs text-primary-foreground flex items-center justify-center font-bold">
                PIX
              </div>
              <div className="w-8 h-5 bg-blue-600 rounded text-xs text-white flex items-center justify-center font-bold">
                MP
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <span>© 2024 Jardim das Patinhas. Feito com</span>
            <Heart className="h-4 w-4 text-red-500 fill-current" />
            <span>para pets, casa e jardim.</span>
          </div>
          
          <div className="flex space-x-6">
            <a href="/privacidade" className="hover:text-primary transition-colors">
              Privacidade
            </a>
            <a href="/termos" className="hover:text-primary transition-colors">
              Termos de Uso
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
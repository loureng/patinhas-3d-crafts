import { useState } from "react";
import { MessageCircle, X, Send, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAnalytics } from "@/hooks/useAnalytics";

interface WhatsAppSupportProps {
  phoneNumber?: string;
  businessName?: string;
  className?: string;
}

const WhatsAppSupport = ({ 
  phoneNumber = "5511999999999", // Default phone number
  businessName = "Jardim das Patinhas",
  className = ""
}: WhatsAppSupportProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isOnline, setIsOnline] = useState(true); // Simulated online status
  const { trackWhatsAppClick } = useAnalytics();

  const predefinedMessages = [
    "Olá! Gostaria de saber mais sobre os produtos.",
    "Tenho dúvidas sobre personalização 3D.",
    "Quero informações sobre entrega.",
    "Preciso de ajuda com meu pedido."
  ];

  const handleSendMessage = (customMessage?: string) => {
    const messageToSend = customMessage || message;
    if (!messageToSend.trim()) {
      toast.error("Digite uma mensagem primeiro");
      return;
    }

    const encodedMessage = encodeURIComponent(messageToSend);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    // Track WhatsApp click
    trackWhatsAppClick();
    
    window.open(whatsappUrl, '_blank');
    setMessage("");
    setIsOpen(false);
    
    toast.success("Redirecionando para o WhatsApp...");
  };

  const handleQuickMessage = (msg: string) => {
    handleSendMessage(msg);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        {!isOpen && (
          <Button
            onClick={() => setIsOpen(true)}
            className="rounded-full w-14 h-14 bg-green-500 hover:bg-green-600 shadow-lg"
            size="icon"
          >
            <MessageCircle className="w-6 h-6 text-white" />
            {isOnline && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
            )}
          </Button>
        )}

        {/* Chat Widget */}
        {isOpen && (
          <Card className="w-80 shadow-xl animate-slide-up">
            <CardHeader className="bg-green-500 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    {isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white"></div>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{businessName}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-green-100">
                      <Clock className="w-3 h-3" />
                      {isOnline ? "Online agora" : "Responde em breve"}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Olá! Como podemos ajudar você hoje?
                </p>
                
                {/* Quick Messages */}
                <div className="space-y-2 mb-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Mensagens rápidas:
                  </p>
                  {predefinedMessages.map((msg, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full text-left justify-start h-auto p-2 text-xs"
                      onClick={() => handleQuickMessage(msg)}
                    >
                      {msg}
                    </Button>
                  ))}
                </div>

                {/* Custom Message */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Ou digite sua mensagem:
                  </p>
                  <Textarea
                    placeholder="Digite sua mensagem..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[80px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button 
                    onClick={() => handleSendMessage()}
                    className="w-full bg-green-500 hover:bg-green-600"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Enviar via WhatsApp
                  </Button>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-center pt-2">
                  <Badge variant="secondary" className="text-xs">
                    Resposta em até 1 hora
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default WhatsAppSupport;
import React from 'react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Heart, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface WishlistButtonProps {
  productId: string;
  productName?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({
  productId,
  productName = 'Produto',
  variant = 'outline',
  size = 'default',
  className = ''
}) => {
  const { user } = useAuth();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [isLoading, setIsLoading] = useState(false);

  const isInList = isInWishlist(productId);

  const handleToggleWishlist = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para adicionar produtos à lista de desejos.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isInList) {
        await removeFromWishlist(productId);
        toast({
          title: "Removido da lista de desejos",
          description: `${productName} foi removido da sua lista de desejos.`
        });
      } else {
        await addToWishlist(productId);
        toast({
          title: "Adicionado à lista de desejos",
          description: `${productName} foi adicionado à sua lista de desejos.`
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar lista de desejos.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (size === 'icon') {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleToggleWishlist}
        disabled={isLoading}
        className={`${className} ${isInList ? 'text-red-500 hover:text-red-600' : ''}`}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart className={`h-4 w-4 ${isInList ? 'fill-current' : ''}`} />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleWishlist}
      disabled={isLoading}
      className={`${className} ${isInList ? 'text-red-500 hover:text-red-600' : ''}`}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Heart className={`mr-2 h-4 w-4 ${isInList ? 'fill-current' : ''}`} />
      )}
      {isInList ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
    </Button>
  );
};

export default WishlistButton;
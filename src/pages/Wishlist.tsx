import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Heart, ShoppingCart, Trash2, Star } from 'lucide-react';
import Header from '@/components/Header';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { WishlistItem } from '@/services/clienteAPI';

const Wishlist = () => {
  const { items, loading, removeFromWishlist, moveToCart } = useWishlist();
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const handleMoveToCart = async (item: WishlistItem) => {
    try {
      // Adicionar ao carrinho
      addItem({
        id: item.product_id,
        name: item.product?.name || 'Produto',
        price: item.product?.price || 0,
        image: item.product?.image_url || '/placeholder.svg'
      });

      // Remover da wishlist
      await removeFromWishlist(item.product_id);
      
      toast({
        title: "Produto movido para o carrinho",
        description: `${item.product?.name || 'Produto'} foi adicionado ao carrinho.`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível mover o produto para o carrinho.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveFromWishlist = async (productId: string, productName: string) => {
    try {
      await removeFromWishlist(productId);
      toast({
        title: "Produto removido",
        description: `${productName} foi removido da sua lista de desejos.`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o produto da lista.",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Heart className="mx-auto h-24 w-24 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Faça login para ver sua lista de desejos</h2>
            <p className="text-muted-foreground mb-6">
              Entre na sua conta para salvar e gerenciar seus produtos favoritos
            </p>
            <Button onClick={() => navigate('/auth')}>
              Fazer Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando sua lista de desejos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Heart className="mx-auto h-24 w-24 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sua lista de desejos está vazia</h2>
            <p className="text-muted-foreground mb-6">
              Explore nossos produtos e adicione seus favoritos aqui
            </p>
            <Button onClick={() => navigate('/produtos')}>
              Explorar Produtos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Minha Lista de Desejos</h1>
            <p className="text-muted-foreground">
              {items.length} {items.length === 1 ? 'produto' : 'produtos'} salvos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                <div className="relative aspect-square overflow-hidden rounded-t-lg">
                  <img
                    src={item.product?.image_url || '/placeholder.svg'}
                    alt={item.product?.name || 'Produto'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                    onClick={() => handleRemoveFromWishlist(item.product_id, item.product?.name || 'Produto')}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold line-clamp-2">
                      {item.product?.name || 'Produto'}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {item.product?.category || 'Categoria'}
                    </p>
                  </div>

                  {item.product?.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{item.product.rating}</span>
                      <span className="text-sm text-muted-foreground">
                        ({item.product.reviews || 0} avaliações)
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">
                      R$ {(item.product?.price || 0).toFixed(2)}
                    </span>
                    {item.product?.original_price && item.product.original_price > item.product.price && (
                      <Badge variant="destructive" className="text-xs">
                        -{Math.round(((item.product.original_price - item.product.price) / item.product.original_price) * 100)}%
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleMoveToCart(item)}
                      className="flex-1"
                      size="sm"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Adicionar ao Carrinho
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/produto/${item.product_id}`)}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-xl font-semibold mb-4">Continue explorando</h2>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate('/produtos')}>
              Ver Todos os Produtos
            </Button>
            <Button onClick={() => navigate('/cart')}>
              Ir para o Carrinho ({items.length > 0 ? '1+' : '0'} itens)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wishlist;

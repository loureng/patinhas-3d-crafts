import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { ArrowLeft, Star, Truck, Shield, RotateCcw } from 'lucide-react';
import StlViewer from '@/components/StlViewer';
import { useAuth } from '@/contexts/AuthContext';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  customizable: boolean;
  stock: number;
  rating: number;
  review_count: number;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [customization, setCustomization] = useState({
    text: '',
    color: '',
    material: '',
    dimensions: { width: 0, height: 0, depth: 0 }
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [stlLocalUrl, setStlLocalUrl] = useState<string | null>(null);
  const [stlPath, setStlPath] = useState<string | null>(null);
  const [stlSizeMB, setStlSizeMB] = useState<number>(0);
  const [priceEstimate, setPriceEstimate] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching product:', error);
      } else {
        setProduct(data);
        if (data?.image_url) setSelectedImage(data.image_url);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  const computeEstimate = () => {
    if (!product) return null;
    let price = Number(product.price);
    const mat = customization.material;
    const mult = mat === 'petg' ? 1.15 : mat === 'tpu' ? 1.2 : mat === 'abs' ? 1.1 : 1;
    price = price * mult;
    if (customization.text && customization.text.length > 0) price += 5;
    if (logoUrl) price += 3;
    if (stlSizeMB > 0) price += Math.max(2, stlSizeMB * 2);
    return Number(price.toFixed(2));
  };

  const handleAddToCart = () => {
    if (!product) return;

    const estimated = computeEstimate() ?? Number(product.price);

    const cartItem = {
      id: product.id,
      name: product.name,
      price: estimated,
      image: product.image_url,
      customization: product.customizable
        ? {
            ...customization,
            logoUrl: logoUrl || undefined,
            stlPath: stlPath || undefined,
            priceEstimate: estimated,
          }
        : undefined,
    };

    addItem(cartItem);
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="h-96 bg-muted rounded"></div>
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-12 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Produto não encontrado</h2>
          <Link to="/produtos">
            <Button>Voltar aos Produtos</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Link to="/produtos" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" />
          Voltar aos produtos
        </Link>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div>
            <div className="space-y-3">
              <div
                className="group rounded-lg overflow-hidden border bg-muted/10 cursor-zoom-in"
                onClick={() => setIsZoomOpen(true)}
              >
                <AspectRatio ratio={1}>
                  <img
                    src={selectedImage || '/placeholder.svg'}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                  />
                </AspectRatio>
              </div>
              <div className="flex gap-2">
                {[product.image_url].filter(Boolean).map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`h-16 w-16 rounded overflow-hidden border ${selectedImage === src ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedImage(src!)}
                    aria-label={`Selecionar imagem ${idx + 1}`}
                  >
                    <img src={src!} alt="Miniatura" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
              <DialogContent className="p-0 sm:max-w-3xl">
                <img
                  src={selectedImage || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-2">{product.category}</Badge>
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${i < product.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">({product.review_count} avaliações)</span>
              </div>
            </div>

<p className="text-xl font-bold text-primary">
  {computeEstimate() ? (
    <>
      R$ {computeEstimate()!.toFixed(2)} <span className="text-sm text-muted-foreground">(estimado)</span>
    </>
  ) : (
    <>R$ {product.price.toFixed(2)}</>
  )}
</p>

            {product.customizable && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Personalização</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="text">Texto personalizado</Label>
                      <Input
                        id="text"
                        value={customization.text}
                        onChange={(e) => setCustomization(prev => ({ ...prev, text: e.target.value }))}
                        placeholder="Digite seu texto aqui"
                      />
                    </div>
                    <div>
                      <Label htmlFor="color">Cor</Label>
                      <Select onValueChange={(value) => setCustomization(prev => ({ ...prev, color: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma cor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vermelho">Vermelho</SelectItem>
                          <SelectItem value="azul">Azul</SelectItem>
                          <SelectItem value="verde">Verde</SelectItem>
                          <SelectItem value="amarelo">Amarelo</SelectItem>
                          <SelectItem value="preto">Preto</SelectItem>
                          <SelectItem value="branco">Branco</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="material">Material</Label>
                      <Select onValueChange={(value) => setCustomization(prev => ({ ...prev, material: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um material" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pla">PLA</SelectItem>
                          <SelectItem value="abs">ABS</SelectItem>
                          <SelectItem value="petg">PETG</SelectItem>
                          <SelectItem value="tpu">TPU</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Upload de logo/imagem</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setLogoPreview(URL.createObjectURL(file));
                          const { data } = await supabase.auth.getUser();
                          const uid = data.user?.id;
                          if (!uid) return;
                          const path = `${uid}/${Date.now()}-${file.name}`;
                          const { error } = await supabase.storage.from('customizations').upload(path, file);
                          if (!error) setLogoUrl(path);
                        }}
                      />
                      {logoPreview && (
                        <div className="mt-2 flex items-center gap-2">
                          <img src={logoPreview} alt="Pré-visualização do logo" className="h-12 w-12 rounded-md object-cover border" />
                          <span className="text-xs text-muted-foreground">Imagem salva ao adicionar ao carrinho</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Upload de modelo 3D (STL)</Label>
                        {stlSizeMB > 0 && (
                          <span className="text-xs text-muted-foreground">{stlSizeMB} MB</span>
                        )}
                      </div>
                      <Input
                        type="file"
                        accept=".stl"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setStlLocalUrl(URL.createObjectURL(file));
                          const sizeMB = Math.round((file.size / 1024 / 1024) * 100) / 100;
                          setStlSizeMB(sizeMB);
                          const { data } = await supabase.auth.getUser();
                          const uid = data.user?.id;
                          if (!uid) return;
                          const path = `${uid}/${Date.now()}-${file.name}`;
                          const { error } = await supabase.storage.from('stl-files').upload(path, file, { contentType: 'application/sla' });
                          if (!error) setStlPath(path);
                        }}
                      />
                      {stlLocalUrl && (
                        <div className="mt-3">
                          {(() => {
                            const colorMap: Record<string, string> = {
                              vermelho: '#ff4d4f',
                              azul: '#3b82f6',
                              verde: '#22c55e',
                              amarelo: '#f59e0b',
                              preto: '#111827',
                              branco: '#f9fafb',
                            };
                            const chosen = customization.color?.toLowerCase?.();
                            const hex = chosen && colorMap[chosen] ? colorMap[chosen] : '#FF9800';
                            return <StlViewer stlUrl={stlLocalUrl} color={hex} />;
                          })()}
                          <p className="mt-2 text-xs text-muted-foreground">Pré-visualização local. O arquivo STL foi enviado com segurança.</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">Preço estimado com personalização:</p>
                      <p className="text-lg font-semibold">R$ {computeEstimate()?.toFixed(2) || product.price.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button 
              size="lg" 
              className="w-full"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              {product.stock === 0 ? 'Fora de Estoque' : 'Adicionar ao Carrinho'}
            </Button>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <Truck className="h-6 w-6 text-primary" />
                <span className="text-sm">Frete Grátis</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <span className="text-sm">Garantia</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <RotateCcw className="h-6 w-6 text-primary" />
                <span className="text-sm">30 dias</span>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="description" className="w-full">
          <TabsList>
            <TabsTrigger value="description">Descrição</TabsTrigger>
            <TabsTrigger value="specifications">Especificações</TabsTrigger>
            <TabsTrigger value="reviews">Avaliações</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="specifications" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Categoria:</span>
                    <span>{product.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Personalizável:</span>
                    <span>{product.customizable ? 'Sim' : 'Não'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estoque:</span>
                    <span>{product.stock} unidades</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <p>Avaliações em breve</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductDetail;
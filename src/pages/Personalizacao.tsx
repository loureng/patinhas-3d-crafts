import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FileUpload from '@/components/FileUpload';
import StlViewer from '@/components/StlViewer';
import { toast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { Calculator, Palette, Ruler, Settings } from 'lucide-react';

const PersonalizacaoPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(undefined);
  const [customization, setCustomization] = useState({
    material: 'PLA',
    color: '#FF6B35',
    scale: [100],
    text: '',
    textSize: 12,
    textDepth: 1
  });
  const [priceEstimate, setPriceEstimate] = useState(0);
  const { addItem } = useCart();

  const materials = [
    { value: 'PLA', label: 'PLA', priceMultiplier: 1.0, description: 'Biodegradável, fácil impressão' },
    { value: 'PETG', label: 'PETG', priceMultiplier: 1.3, description: 'Resistente, transparente' },
    { value: 'ABS', label: 'ABS', priceMultiplier: 1.2, description: 'Durável, resistente ao calor' },
    { value: 'TPU', label: 'TPU', priceMultiplier: 1.8, description: 'Flexível, borracha' }
  ];

  const colors = [
    '#FF6B35', '#F7931E', '#FFD23F', '#27AE60', 
    '#3498DB', '#9B59B6', '#E74C3C', '#1ABC9C',
    '#34495E', '#95A5A6', '#FFFFFF', '#000000'
  ];

  const calculatePrice = () => {
    const baseCost = 25.00; // Base cost for printing
    const materialMultiplier = materials.find(m => m.value === customization.material)?.priceMultiplier || 1;
    const scaleMultiplier = Math.pow(customization.scale[0] / 100, 3); // Volume scales cubically
    const textCost = customization.text ? 5.00 : 0;
    
    const total = (baseCost * materialMultiplier * scaleMultiplier) + textCost;
    setPriceEstimate(total);
    return total;
  };

  React.useEffect(() => {
    calculatePrice();
  }, [customization]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === undefined || prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setUploadProgress(undefined);
  };

  const handleAddToCart = () => {
    if (!selectedFile) {
      toast({
        title: "Arquivo necessário",
        description: "Por favor, faça upload de um arquivo 3D primeiro.",
        variant: "destructive"
      });
      return;
    }

    const customProduct = {
      id: `custom-${Date.now()}`,
      name: `Impressão 3D Personalizada - ${selectedFile.name}`,
      price: priceEstimate,
      image: '/lovable-uploads/6e03e475-6083-4d29-be79-60c3f1ffef52.png', // Default image
      customization: {
        ...customization,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        priceEstimate
      }
    };

    addItem(customProduct);
    
    toast({
      title: "Produto adicionado ao carrinho!",
      description: `${customProduct.name} - R$ ${priceEstimate.toFixed(2)}`
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Personalização 3D</h1>
          <p className="text-lg text-muted-foreground">
            Transforme suas ideias em realidade com nossa impressão 3D personalizada
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Upload and Configuration */}
          <div className="space-y-6">
            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Upload do Arquivo 3D
                </CardTitle>
                <CardDescription>
                  Envie seu arquivo STL, OBJ ou 3MF para começar a personalização
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFileSelect={handleFileSelect}
                  onFileRemove={handleFileRemove}
                  uploadedFile={selectedFile}
                  uploadProgress={uploadProgress}
                  acceptedTypes={['.stl', '.obj', '.3mf']}
                  maxSize={50}
                />
              </CardContent>
            </Card>

            {/* Customization Options */}
            {selectedFile && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Opções de Personalização
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="material" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="material">Material</TabsTrigger>
                      <TabsTrigger value="appearance">Aparência</TabsTrigger>
                      <TabsTrigger value="text">Texto</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="material" className="space-y-4">
                      <div>
                        <Label htmlFor="material">Material de Impressão</Label>
                        <Select 
                          value={customization.material}
                          onValueChange={(value) => setCustomization(prev => ({ ...prev, material: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map(material => (
                              <SelectItem key={material.value} value={material.value}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{material.label}</span>
                                  <span className="text-xs text-muted-foreground">{material.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Escala ({customization.scale[0]}%)</Label>
                        <Slider
                          value={customization.scale}
                          onValueChange={(value) => setCustomization(prev => ({ ...prev, scale: value }))}
                          max={200}
                          min={50}
                          step={10}
                          className="mt-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>50%</span>
                          <span>200%</span>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="appearance" className="space-y-4">
                      <div>
                        <Label>Cor do Material</Label>
                        <div className="grid grid-cols-6 gap-2 mt-2">
                          {colors.map(color => (
                            <button
                              key={color}
                              className={`w-8 h-8 rounded border-2 ${
                                customization.color === color ? 'border-primary' : 'border-gray-200'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => setCustomization(prev => ({ ...prev, color }))}
                            />
                          ))}
                        </div>
                        <Input
                          type="color"
                          value={customization.color}
                          onChange={(e) => setCustomization(prev => ({ ...prev, color: e.target.value }))}
                          className="mt-2 h-10"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="text" className="space-y-4">
                      <div>
                        <Label htmlFor="text">Texto Personalizado (opcional)</Label>
                        <Input
                          id="text"
                          placeholder="Digite o texto..."
                          value={customization.text}
                          onChange={(e) => setCustomization(prev => ({ ...prev, text: e.target.value }))}
                        />
                      </div>
                      
                      {customization.text && (
                        <>
                          <div>
                            <Label>Tamanho do Texto: {customization.textSize}mm</Label>
                            <Slider
                              value={[customization.textSize]}
                              onValueChange={(value) => setCustomization(prev => ({ ...prev, textSize: value[0] }))}
                              max={30}
                              min={5}
                              step={1}
                              className="mt-2"
                            />
                          </div>
                          
                          <div>
                            <Label>Profundidade: {customization.textDepth}mm</Label>
                            <Slider
                              value={[customization.textDepth]}
                              onValueChange={(value) => setCustomization(prev => ({ ...prev, textDepth: value[0] }))}
                              max={5}
                              min={0.5}
                              step={0.5}
                              className="mt-2"
                            />
                          </div>
                        </>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* Price Estimate */}
            {selectedFile && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Estimativa de Preço
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Impressão base:</span>
                      <span>R$ 25,00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Material ({customization.material}):</span>
                      <span>+{((materials.find(m => m.value === customization.material)?.priceMultiplier || 1) * 100 - 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Escala ({customization.scale[0]}%):</span>
                      <span>×{Math.pow(customization.scale[0] / 100, 3).toFixed(2)}</span>
                    </div>
                    {customization.text && (
                      <div className="flex justify-between">
                        <span>Texto personalizado:</span>
                        <span>+ R$ 5,00</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>R$ {priceEstimate.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full mt-4" 
                    size="lg"
                    onClick={handleAddToCart}
                  >
                    Adicionar ao Carrinho
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5" />
                  Pré-visualização 3D
                </CardTitle>
                <CardDescription>
                  Visualize como seu produto ficará após a impressão
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedFile ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 border rounded-lg p-8 text-center">
                      <p className="text-gray-500">
                        Visualização 3D estará disponível após o upload completo
                      </p>
                      {uploadProgress === 100 && (
                        <Badge variant="secondary" className="mt-2">
                          Arquivo processado: {selectedFile.name}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Arquivo:</span>
                        <span className="font-mono">{selectedFile.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tamanho:</span>
                        <span>{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Material:</span>
                        <span>{customization.material}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cor:</span>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: customization.color }}
                          />
                          <span>{customization.color}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <Ruler className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Faça upload de um arquivo 3D para ver a pré-visualização
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Importantes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <strong>Tempo de produção:</strong> 2-5 dias úteis
                </div>
                <div>
                  <strong>Precisão:</strong> ±0.1mm
                </div>
                <div>
                  <strong>Camada:</strong> 0.2mm padrão
                </div>
                <div>
                  <strong>Suporte:</strong> Incluído quando necessário
                </div>
                <div>
                  <strong>Pós-processamento:</strong> Lixamento básico incluído
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PersonalizacaoPage;
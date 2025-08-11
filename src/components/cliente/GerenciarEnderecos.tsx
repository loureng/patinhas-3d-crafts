import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useEnderecos, Endereco, EnderecoForm } from '@/hooks/useEnderecos';
import FormularioEndereco from './FormularioEndereco';
import { toast } from '@/hooks/use-toast';
import { 
  MapPin,
  Plus,
  Edit,
  Trash2,
  Star,
  Home,
  AlertCircle
} from 'lucide-react';

const GerenciarEnderecos = () => {
  const { 
    enderecos, 
    loading, 
    error, 
    addEndereco, 
    updateEndereco, 
    deleteEndereco, 
    setAsDefault 
  } = useEnderecos();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEndereco, setEditingEndereco] = useState<Endereco | null>(null);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted rounded mb-4"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-destructive">Erro ao carregar endereços: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleAddEndereco = async (data: EnderecoForm) => {
    try {
      await addEndereco(data);
      setShowAddForm(false);
      toast({
        title: "Endereço adicionado",
        description: "Novo endereço foi adicionado com sucesso."
      });
    } catch (error) {
      throw error; // Será tratado pelo FormularioEndereco
    }
  };

  const handleUpdateEndereco = async (data: EnderecoForm) => {
    if (!editingEndereco) return;
    
    try {
      await updateEndereco(editingEndereco.id, data);
      setEditingEndereco(null);
      toast({
        title: "Endereço atualizado",
        description: "Endereço foi atualizado com sucesso."
      });
    } catch (error) {
      throw error; // Será tratado pelo FormularioEndereco
    }
  };

  const handleDeleteEndereco = async (endereco: Endereco) => {
    try {
      await deleteEndereco(endereco.id);
      toast({
        title: "Endereço removido",
        description: `${endereco.name} foi removido com sucesso.`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o endereço.",
        variant: "destructive"
      });
    }
  };

  const handleSetAsDefault = async (endereco: Endereco) => {
    try {
      await setAsDefault(endereco.id);
      toast({
        title: "Endereço padrão definido",
        description: `${endereco.name} agora é seu endereço padrão.`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível definir como endereço padrão.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center">
            <MapPin className="mr-2 h-6 w-6" />
            Gerenciar Endereços
          </h2>
          <p className="text-muted-foreground">
            {enderecos.length} {enderecos.length === 1 ? 'endereço cadastrado' : 'endereços cadastrados'}
          </p>
        </div>
        
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Endereço
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Endereço</DialogTitle>
            </DialogHeader>
            <FormularioEndereco
              onSubmit={handleAddEndereco}
              onCancel={() => setShowAddForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {enderecos.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Home className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum endereço cadastrado</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Adicione um endereço para facilitar suas compras e entregas.
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Primeiro Endereço
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {enderecos.map((endereco) => (
            <Card key={endereco.id} className={`relative ${endereco.is_default ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <CardTitle className="text-lg">{endereco.name}</CardTitle>
                    {endereco.is_default && (
                      <Badge variant="default" className="text-xs">
                        <Star className="mr-1 h-3 w-3" />
                        Padrão
                      </Badge>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <Dialog open={editingEndereco?.id === endereco.id} onOpenChange={(open) => !open && setEditingEndereco(null)}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setEditingEndereco(endereco)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Editar Endereço</DialogTitle>
                        </DialogHeader>
                        <FormularioEndereco
                          onSubmit={handleUpdateEndereco}
                          onCancel={() => setEditingEndereco(null)}
                          initialData={endereco}
                          isEditing={true}
                        />
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover Endereço</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover o endereço "{endereco.name}"? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteEndereco(endereco)}>
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="text-sm space-y-1">
                  <p className="font-medium">
                    {endereco.address}, {endereco.number}
                    {endereco.complement && ` - ${endereco.complement}`}
                  </p>
                  <p>{endereco.neighborhood}</p>
                  <p>{endereco.city} - {endereco.state}</p>
                  <p className="text-muted-foreground">CEP: {endereco.cep}</p>
                </div>

                {!endereco.is_default && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleSetAsDefault(endereco)}
                    className="w-full"
                  >
                    <Star className="mr-2 h-3 w-3" />
                    Definir como Padrão
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {enderecos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• O endereço padrão será usado automaticamente em novos pedidos</p>
            <p>• Você pode ter quantos endereços quiser cadastrados</p>
            <p>• Endereços podem ser editados ou removidos a qualquer momento</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GerenciarEnderecos;
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { usePedidos } from '@/hooks/usePedidos';

interface EditarEnderecoPedidoProps {
  pedidoId: string | null;
  enderecoAtual: any;
  open: boolean;
  onClose: () => void;
}

const EditarEnderecoPedido: React.FC<EditarEnderecoPedidoProps> = ({
  pedidoId,
  enderecoAtual,
  open,
  onClose
}) => {
  const { alterarEnderecoPedido } = usePedidos();
  const [loading, setLoading] = useState(false);
  const [endereco, setEndereco] = useState({
    street: enderecoAtual?.street || '',
    number: enderecoAtual?.number || '',
    complement: enderecoAtual?.complement || '',
    neighborhood: enderecoAtual?.neighborhood || '',
    city: enderecoAtual?.city || '',
    state: enderecoAtual?.state || '',
    zipCode: enderecoAtual?.zipCode || '',
    ...enderecoAtual
  });

  const handleSave = async () => {
    if (!pedidoId) return;

    // Validações básicas
    if (!endereco.street || !endereco.number || !endereco.neighborhood || 
        !endereco.city || !endereco.state || !endereco.zipCode) {
      toast.error('Todos os campos obrigatórios devem ser preenchidos');
      return;
    }

    try {
      setLoading(true);
      await alterarEnderecoPedido(pedidoId, endereco);
      toast.success('Endereço atualizado com sucesso');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar endereço');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setEndereco(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Endereço de Entrega</DialogTitle>
          <DialogDescription>
            Atualize o endereço de entrega do seu pedido. Só é possível alterar antes do envio.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-3">
              <Label htmlFor="street">Rua/Avenida *</Label>
              <Input
                id="street"
                value={endereco.street}
                onChange={(e) => handleChange('street', e.target.value)}
                placeholder="Nome da rua"
              />
            </div>
            <div className="col-span-1">
              <Label htmlFor="number">Número *</Label>
              <Input
                id="number"
                value={endereco.number}
                onChange={(e) => handleChange('number', e.target.value)}
                placeholder="123"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="complement">Complemento</Label>
            <Input
              id="complement"
              value={endereco.complement}
              onChange={(e) => handleChange('complement', e.target.value)}
              placeholder="Apartamento, casa, etc."
            />
          </div>

          <div>
            <Label htmlFor="neighborhood">Bairro *</Label>
            <Input
              id="neighborhood"
              value={endereco.neighborhood}
              onChange={(e) => handleChange('neighborhood', e.target.value)}
              placeholder="Nome do bairro"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="city">Cidade *</Label>
              <Input
                id="city"
                value={endereco.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Nome da cidade"
              />
            </div>
            <div>
              <Label htmlFor="state">Estado *</Label>
              <Input
                id="state"
                value={endereco.state}
                onChange={(e) => handleChange('state', e.target.value)}
                placeholder="SP"
                maxLength={2}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="zipCode">CEP *</Label>
            <Input
              id="zipCode"
              value={endereco.zipCode}
              onChange={(e) => handleChange('zipCode', e.target.value)}
              placeholder="12345-678"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditarEnderecoPedido;
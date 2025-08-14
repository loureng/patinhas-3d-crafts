import { useState, useEffect } from "react";
import { Shield, Users, Database, Settings as SettingsIcon, Save, Key, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AdminSettings {
  store_name: string;
  store_description: string;
  contact_email: string;
  contact_phone: string;
  store_address: string;
  currency: string;
  tax_rate: number;
  shipping_fee: number;
  free_shipping_threshold: number;
  maintenance_mode: boolean;
  allow_guest_checkout: boolean;
  require_email_verification: boolean;
}

interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  active: boolean;
  created_at: string;
}

export default function AdminSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AdminSettings>({
    store_name: "Jardim das Patinhas",
    store_description: "Produtos personalizados para pets, casa e jardim",
    contact_email: "contato@jardimdaspatinhas.com.br",
    contact_phone: "(11) 9999-9999",
    store_address: "São Paulo, SP",
    currency: "BRL",
    tax_rate: 0,
    shipping_fee: 15.00,
    free_shipping_threshold: 199.00,
    maintenance_mode: false,
    allow_guest_checkout: true,
    require_email_verification: false
  });

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
    loadAdminUsers();

    // Real-time subscription para mudanças nas configurações
    const subscription = supabase
      .channel('settings-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'settings' }, 
        (payload) => {
          console.log('Configuração atualizada em tempo real:', payload);
          loadSettings(); // Recarregar configurações quando houver mudanças
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);

      // Carregar configurações do Supabase
      const { data: settingsData, error } = await supabase
        .from('settings')
        .select('key, value');

      if (error) throw error;

      // Converter para objeto de configurações
      const settingsObject: Partial<AdminSettings> = {};
      settingsData.forEach(setting => {
        // Parse JSON values
        try {
          settingsObject[setting.key as keyof AdminSettings] = JSON.parse(setting.value);
        } catch {
          settingsObject[setting.key as keyof AdminSettings] = setting.value;
        }
      });

      setSettings(prev => ({ ...prev, ...settingsObject }));
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      // Manter configurações padrão em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const loadAdminUsers = async () => {
    try {
      // Simular lista de usuários admin
      // Em produção, você teria uma tabela admin_users ou campo role
      const mockAdmins: AdminUser[] = [
        {
          id: user?.id || "1",
          email: user?.email || "admin@exemplo.com",
          display_name: user?.user_metadata?.display_name || "Administrador",
          role: "super_admin",
          active: true,
          created_at: new Date().toISOString()
        }
      ];
      setAdminUsers(mockAdmins);
    } catch (error) {
      console.error('Erro ao carregar usuários admin:', error);
      toast.error('Erro ao carregar usuários admin');
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      // Salvar cada configuração individualmente
      const settingsToSave = [
        { key: 'store_name', value: JSON.stringify(settings.store_name) },
        { key: 'store_description', value: JSON.stringify(settings.store_description) },
        { key: 'contact_email', value: JSON.stringify(settings.contact_email) },
        { key: 'contact_phone', value: JSON.stringify(settings.contact_phone) },
        { key: 'store_address', value: JSON.stringify(settings.store_address) },
        { key: 'currency', value: JSON.stringify(settings.currency) },
        { key: 'tax_rate', value: settings.tax_rate.toString() },
        { key: 'shipping_fee', value: settings.shipping_fee.toString() },
        { key: 'free_shipping_threshold', value: settings.free_shipping_threshold.toString() },
        { key: 'maintenance_mode', value: settings.maintenance_mode.toString() },
        { key: 'allow_guest_checkout', value: settings.allow_guest_checkout.toString() },
        { key: 'require_email_verification', value: settings.require_email_verification.toString() }
      ];

      // Atualizar todas as configurações
      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('settings')
          .upsert({ 
            key: setting.key, 
            value: setting.value 
          }, { 
            onConflict: 'key' 
          });

        if (error) throw error;
      }
      
      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdmin = async () => {
    try {
      if (!newAdminEmail.trim()) {
        toast.error('Email é obrigatório');
        return;
      }

      // Verificar se usuário existe
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', newAdminEmail.trim());

      if (!profiles || profiles.length === 0) {
        toast.error('Usuário não encontrado');
        return;
      }

      // Em produção, você adicionaria o usuário à tabela admin_users
      const newAdmin: AdminUser = {
        id: profiles[0].id,
        email: newAdminEmail.trim(),
        display_name: profiles[0].display_name,
        role: "admin",
        active: true,
        created_at: new Date().toISOString()
      };

      setAdminUsers(prev => [...prev, newAdmin]);
      setNewAdminEmail("");
      toast.success('Administrador adicionado com sucesso');
    } catch (error) {
      console.error('Erro ao adicionar administrador:', error);
      toast.error('Erro ao adicionar administrador');
    }
  };

  const toggleAdminStatus = async (adminId: string, active: boolean) => {
    try {
      // Em produção, você atualizaria o status na tabela admin_users
      setAdminUsers(prev => 
        prev.map(admin => 
          admin.id === adminId ? { ...admin, active } : admin
        )
      );
      toast.success(`Administrador ${active ? 'ativado' : 'desativado'} com sucesso`);
    } catch (error) {
      console.error('Erro ao alterar status do administrador:', error);
      toast.error('Erro ao alterar status do administrador');
    }
  };

  const removeAdmin = async (adminId: string) => {
    try {
      if (adminId === user?.id) {
        toast.error('Você não pode remover a si mesmo');
        return;
      }

      // Em produção, você removeria o usuário da tabela admin_users
      setAdminUsers(prev => prev.filter(admin => admin.id !== adminId));
      toast.success('Administrador removido com sucesso');
    } catch (error) {
      console.error('Erro ao remover administrador:', error);
      toast.error('Erro ao remover administrador');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">
            <SettingsIcon className="mr-2 h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="store">
            <Database className="mr-2 h-4 w-4" />
            Loja
          </TabsTrigger>
          <TabsTrigger value="admins">
            <Shield className="mr-2 h-4 w-4" />
            Administradores
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="mr-2 h-4 w-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Loja</CardTitle>
              <CardDescription>
                Configure as informações básicas da sua loja
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="store_name">Nome da Loja</Label>
                  <Input
                    id="store_name"
                    value={settings.store_name}
                    onChange={(e) => setSettings(prev => ({ ...prev, store_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email">Email de Contato</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={settings.contact_email}
                    onChange={(e) => setSettings(prev => ({ ...prev, contact_email: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="store_description">Descrição da Loja</Label>
                <Textarea
                  id="store_description"
                  value={settings.store_description}
                  onChange={(e) => setSettings(prev => ({ ...prev, store_description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_phone">Telefone de Contato</Label>
                  <Input
                    id="contact_phone"
                    value={settings.contact_phone}
                    onChange={(e) => setSettings(prev => ({ ...prev, contact_phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="store_address">Endereço</Label>
                  <Input
                    id="store_address"
                    value={settings.store_address}
                    onChange={(e) => setSettings(prev => ({ ...prev, store_address: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="store" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações da Loja</CardTitle>
              <CardDescription>
                Configure preços, taxas e políticas da loja
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="currency">Moeda</Label>
                  <Input
                    id="currency"
                    value={settings.currency}
                    onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))}
                    placeholder="BRL"
                  />
                </div>
                <div>
                  <Label htmlFor="tax_rate">Taxa de Imposto (%)</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    step="0.01"
                    value={settings.tax_rate}
                    onChange={(e) => setSettings(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="shipping_fee">Taxa de Envio (R$)</Label>
                  <Input
                    id="shipping_fee"
                    type="number"
                    step="0.01"
                    value={settings.shipping_fee}
                    onChange={(e) => setSettings(prev => ({ ...prev, shipping_fee: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="free_shipping_threshold">Frete Grátis Acima de (R$)</Label>
                <Input
                  id="free_shipping_threshold"
                  type="number"
                  step="0.01"
                  value={settings.free_shipping_threshold}
                  onChange={(e) => setSettings(prev => ({ ...prev, free_shipping_threshold: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Modo Manutenção</Label>
                    <p className="text-sm text-muted-foreground">
                      Desabilita acesso público à loja
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenance_mode}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenance_mode: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Permitir Checkout como Convidado</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite compras sem cadastro
                    </p>
                  </div>
                  <Switch
                    checked={settings.allow_guest_checkout}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allow_guest_checkout: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Exigir Verificação de Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Usuários devem verificar email antes de comprar
                    </p>
                  </div>
                  <Switch
                    checked={settings.require_email_verification}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, require_email_verification: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Administrador</CardTitle>
              <CardDescription>
                Adicione novos usuários como administradores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Email do usuário"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                />
                <Button onClick={handleAddAdmin}>
                  <Users className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Administradores Atuais</CardTitle>
              <CardDescription>
                Lista de usuários com acesso administrativo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {adminUsers.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                        {admin.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{admin.display_name || admin.email}</div>
                        <div className="text-sm text-muted-foreground">{admin.email}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={admin.role === 'super_admin' ? 'default' : 'secondary'}>
                            {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                          </Badge>
                          <Badge variant={admin.active ? 'default' : 'secondary'}>
                            {admin.active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={admin.active}
                        onCheckedChange={(checked) => toggleAdminStatus(admin.id, checked)}
                        disabled={admin.id === user?.id}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAdmin(admin.id)}
                        disabled={admin.id === user?.id || admin.role === 'super_admin'}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>
                Configure políticas de segurança e acesso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Autenticação de Dois Fatores</Label>
                    <p className="text-sm text-muted-foreground">
                      Exigir 2FA para administradores
                    </p>
                  </div>
                  <Switch disabled />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sessão Segura</Label>
                    <p className="text-sm text-muted-foreground">
                      Forçar HTTPS para área administrativa
                    </p>
                  </div>
                  <Switch defaultChecked disabled />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Log de Auditoria</Label>
                    <p className="text-sm text-muted-foreground">
                      Registrar todas as ações administrativas
                    </p>
                  </div>
                  <Switch defaultChecked disabled />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Backup do Banco de Dados</Label>
                <p className="text-sm text-muted-foreground">
                  Última execução: {new Date().toLocaleDateString('pt-BR')}
                </p>
                <Button variant="outline" disabled>
                  <Database className="mr-2 h-4 w-4" />
                  Executar Backup
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botão de salvar fixo */}
      <div className="fixed bottom-6 right-6">
        <Button 
          size="lg" 
          onClick={handleSaveSettings}
          disabled={saving}
          className="shadow-lg"
        >
          {saving ? (
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}
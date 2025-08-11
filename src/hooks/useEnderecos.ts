import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface Endereco {
  id: string;
  user_id: string;
  name: string;
  cep: string;
  address: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  is_default: boolean;
  created_at: string;
}

export interface EnderecoForm {
  name: string;
  cep: string;
  address: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  is_default: boolean;
}

export const useEnderecos = () => {
  const { user } = useAuth();
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnderecos = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEnderecos(data || []);
    } catch (err) {
      console.error('Erro ao buscar endereços:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnderecos();
  }, [user]);

  const addEndereco = async (endereco: EnderecoForm) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      // Se este endereço for marcado como padrão, desmarcar os outros
      if (endereco.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('addresses')
        .insert({
          ...endereco,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      await fetchEnderecos();
      return data;
    } catch (err) {
      console.error('Erro ao adicionar endereço:', err);
      throw err;
    }
  };

  const updateEndereco = async (id: string, endereco: Partial<EnderecoForm>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      // Se este endereço for marcado como padrão, desmarcar os outros
      if (endereco.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('addresses')
        .update(endereco)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      await fetchEnderecos();
      return data;
    } catch (err) {
      console.error('Erro ao atualizar endereço:', err);
      throw err;
    }
  };

  const deleteEndereco = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchEnderecos();
    } catch (err) {
      console.error('Erro ao deletar endereço:', err);
      throw err;
    }
  };

  const setAsDefault = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      // Desmarcar todos como padrão
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Marcar o selecionado como padrão
      await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', user.id);

      await fetchEnderecos();
    } catch (err) {
      console.error('Erro ao definir endereço padrão:', err);
      throw err;
    }
  };

  return {
    enderecos,
    loading,
    error,
    addEndereco,
    updateEndereco,
    deleteEndereco,
    setAsDefault,
    refetch: fetchEnderecos
  };
};
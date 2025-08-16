# 📱 Guia de Acesso Mobile - Jardim das Patinhas

## ✅ Configurações Aplicadas

### Vite Config Atualizado
- `host: true` - Permite acesso externo
- `strictPort: false` - Busca porta automaticamente se ocupada
- Portas: 8080-8090 (faixa de fallback)

## 🔧 Passos para Acesso Mobile

### 1. Reiniciar o Servidor
```powershell
# Parar o servidor atual (Ctrl+C)
# Restart com nova config
npm run dev
```

### 2. Verificar IPs Disponíveis
O Vite vai mostrar:
```
➜  Local:   http://localhost:8082/
➜  Network: http://192.168.0.130:8082/
➜  Network: http://172.25.32.1:8082/
```

### 3. Testar no Celular
- Conectar no mesmo WiFi
- Usar IP: `http://192.168.0.130:8082/`
- Ou: `http://172.25.32.1:8082/`

## 🛠️ Solução de Problemas

### Se ainda não funcionar:

#### Opção A: Configurar Firewall (Como Admin)
```powershell
# Executar PowerShell como Administrador
netsh advfirewall firewall add rule name="Vite Dev Server" dir=in action=allow protocol=TCP localport=8080-8090
```

#### Opção B: Verificar Windows Defender
1. Windows Security → Firewall & network protection
2. Allow an app through firewall
3. Procurar "Node.js" e marcar "Public networks"

#### Opção C: Usar Ngrok (Alternativa)
```powershell
# Instalar ngrok
npm install -g ngrok

# Em outro terminal, com servidor rodando:
ngrok http 8082
```

## 📋 Checklist de Validação

- [ ] Servidor reiniciado com nova config
- [ ] IPs mostrados no terminal
- [ ] Celular na mesma rede WiFi
- [ ] Firewall configurado se necessário
- [ ] Página carrega no mobile

## 🎯 URLs de Teste

- **Local**: http://localhost:8082/
- **Mobile**: http://192.168.0.130:8082/
- **Alt Mobile**: http://172.25.32.1:8082/

---
*Configuração otimizada para desenvolvimento mobile*
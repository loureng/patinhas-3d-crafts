# 🚀 ACESSO MOBILE CONFIGURADO

## ✅ Servidor Ativo

**URLs para teste no celular:**

📱 **Principal**: `http://192.168.0.130:5173/`

📱 **Alternativo**: `http://172.25.32.1:5173/`

💻 **Local**: `http://localhost:5173/`

---

## 📋 Instruções para Celular

1. **Conecte no mesmo WiFi** que o PC
2. **Abra o navegador** no celular  
3. **Digite**: `192.168.0.130:5173`
4. **Acesse** o site completo

## 🛠️ Se ainda não funcionar

### Opção 1: Firewall Windows
Execute como **Administrador**:
```cmd
netsh advfirewall firewall add rule name="Vite Mobile" dir=in action=allow protocol=TCP localport=5173
```

### Opção 2: Verificar Rede
- Confirme se celular e PC estão na mesma rede WiFi
- Teste ping do celular para o PC

### Opção 3: Usar Ngrok
```bash
# Terminal adicional
npx ngrok http 5173
```

---

**🎯 Status Atual:** Servidor rodando na porta **5173** com acesso de rede habilitado
# Debug Email - Checklist

## ✅ **O que já fizemos:**
1. Edge function deployed ✅
2. Código reativado ✅
3. Fetch para edge function ativado ✅

## 🔍 **Próximos passos para debug:**

### **1. Verificar variáveis no Supabase**
- Dashboard → Settings → Edge Functions
- Adicionar variáveis:
  ```
  SITE_URL=http://localhost:3000
  FROM_EMAIL=noreply@resend.dev
  RESEND_API_KEY=re_sua_api_key (opcional para teste)
  ```

### **2. Ver logs da Edge Function**
- Dashboard → Functions → send-approval-email → Logs
- Criar uma service sheet e verificar se aparece log

### **3. Testar Edge Function diretamente**
```bash
curl -X POST 'https://SUPABASE_URL/functions/v1/send-approval-email' \
  -H 'Authorization: Bearer SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "serviceSheet": {
      "project_name": "Teste",
      "client_contact_email": "teste@teste.com",
      "client_contact_name": "Teste",
      "technician_name": "Técnico",
      "service_date": "2024-01-01",
      "start_time": "09:00",
      "end_time": "17:00",
      "activity_description": "Teste",
      "approval_token": "123e4567-e89b-12d3-a456-426614174000"
    }
  }'
```

### **4. Verificar se fetch está sendo executado**
- Adicionar mais logs no código
- Verificar se a função `sendApprovalEmail` está sendo chamada

### **5. Configurar Resend (Recomendado)**
1. Ir em https://resend.com
2. Criar conta grátis
3. Usar domínio resend.dev para testes
4. Copiar API key
5. Configurar no Supabase

## **🚨 Debug Rápido:**
1. Crie uma service sheet
2. Verifique os logs do Supabase Functions
3. Me diga qual erro aparece nos logs
# API REST - Sistema de Service Sheets
## Documentação para Implementação em Spring Boot

---

## 1. VISÃO GERAL

Esta API substitui o Supabase e implementa um sistema completo de gerenciamento de folhas de serviço (service sheets) com aprovação por email, controle de projetos e gestão de usuários.

### Stack Recomendada
- **Spring Boot 3.x**
- **Spring Security** (JWT Authentication)
- **Spring Data JPA** (PostgreSQL)
- **Lombok** (Reduzir boilerplate)

### Arquitetura
- **Database:** PostgreSQL
- **Autenticação:** JWT Bearer Tokens
- **Autorização:** Role-Based Access Control (RBAC)
- **Email:** SMTP (Resend API ou similar)

---

## 1.1 NOVAS FUNCIONALIDADES (UPDATE)

### 🆕 Múltiplas Linhas de Serviço

**Problema Resolvido:**
- Antes: 1 service sheet = 1 dia de trabalho
- Problema: Trabalhos de múltiplos dias geravam múltiplas aprovações
- Solução: 1 service sheet pode ter N linhas (N dias)

**Implementação:**
- Nova tabela: `service_sheet_lines`
- Campos movidos: `service_date`, `start_time`, `end_time` (agora nas linhas)
- Cálculo: Horas totais = soma de todas as linhas
- Aprovação única para todo o pacote de trabalho

**Exemplo:**
```json
{
  "subject": "Implementação Feature X",
  "lines": [
    {"serviceDate": "2024-01-15", "startTime": "09:00", "endTime": "17:00"},
    {"serviceDate": "2024-01-16", "startTime": "09:00", "endTime": "13:00"},
    {"serviceDate": "2024-01-17", "startTime": "14:00", "endTime": "18:00"}
  ]
}
// Total: 16 horas, 1 aprovação
```

---

### 🆕 CC Emails (Carbon Copy)

**Problema Resolvido:**
- Outras pessoas precisam acompanhar o trabalho
- Mas não devem poder aprovar
- Apenas 1 pessoa autorizada para aprovar

**Implementação:**
- Campo novo: `ccEmails` (array de strings, JSONB)
- Email principal: `clientContactEmail` (pode aprovar)
- Emails CC: `ccEmails` (apenas visualizar)
- Validação na aprovação: apenas email principal autorizado

**Exemplo:**
```json
{
  "clientContactEmail": "gerente@cliente.com",  // ✓ Pode aprovar
  "ccEmails": [
    "supervisor@cliente.com",    // ✗ Não pode aprovar
    "diretor@cliente.com"        // ✗ Não pode aprovar
  ]
}
```

**Fluxo de Aprovação:**
1. Todos recebem o email (TO + CC)
2. Página de aprovação pede confirmação de email
3. Sistema valida: email == clientContactEmail?
4. Se não, retorna 403: "Você não tem permissão"

**Ver Seção 13 para detalhes completos**

---

## 2. AUTENTICAÇÃO E AUTORIZAÇÃO

### 2.1 POST /api/auth/register
Registra um novo usuário no sistema.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "fullName": "Nome Completo"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "Nome Completo",
  "role": "technician",
  "createdAt": "2024-01-01T10:00:00Z"
}
```

**Regras:**
- Senha deve ter mínimo 8 caracteres
- Email deve ser único
- Role padrão: `technician`
- **EXCEÇÃO:** Email `nlanga@prifuturoconsultoria.com` recebe role `admin` automaticamente
- Criar registro em `profiles` automaticamente

**Errors:**
- `400` - Email já existe
- `400` - Senha inválida (menos de 8 caracteres)

---

### 2.2 POST /api/auth/login
Autentica usuário e retorna JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Nome Completo",
    "role": "technician"
  }
}
```

**Regras:**
- JWT com expiração de 1 hora
- Refresh token com expiração de 7 dias
- Atualizar `lastSignInAt` no perfil do usuário

**Errors:**
- `401` - Credenciais inválidas
- `404` - Usuário não encontrado

---

### 2.3 POST /api/auth/refresh
Renova o access token usando refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600
}
```

**Errors:**
- `401` - Refresh token inválido ou expirado

---

### 2.4 POST /api/auth/logout
Invalida o refresh token atual.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (204 No Content)**

---

### 2.5 GET /api/auth/me
Retorna informações do usuário autenticado.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "Nome Completo",
  "role": "technician",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z"
}
```

**Errors:**
- `401` - Token inválido ou ausente

---

## 3. SERVICE SHEETS

Todos os endpoints requerem autenticação via `Authorization: Bearer {token}`.

### 3.1 POST /api/service-sheets (ATUALIZADO)
Cria uma nova folha de serviço com múltiplas linhas (dias de trabalho).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "projectId": "uuid",
  "clientContactName": "João Silva",
  "clientContactEmail": "joao@client.com",
  "clientContactPhone": "+55 11 98888-7777",
  "ccEmails": [
    "supervisor@client.com",
    "gerente@client.com"
  ],
  "activityDescription": "Implementação de nova funcionalidade XYZ ao longo de 3 dias",
  "subject": "Sprint 1 - Feature XYZ",
  "lines": [
    {
      "serviceDate": "2024-01-15",
      "startTime": "09:00:00",
      "endTime": "17:00:00"
    },
    {
      "serviceDate": "2024-01-16",
      "startTime": "09:00:00",
      "endTime": "13:00:00"
    },
    {
      "serviceDate": "2024-01-17",
      "startTime": "14:00:00",
      "endTime": "18:00:00"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "project": {
    "id": "uuid",
    "name": "Projeto ABC",
    "company": "Empresa Cliente LTDA"
  },
  "clientContactName": "João Silva",
  "clientContactEmail": "joao@client.com",
  "clientContactPhone": "+55 11 98888-7777",
  "ccEmails": [
    "supervisor@client.com",
    "gerente@client.com"
  ],
  "lines": [
    {
      "id": "uuid",
      "lineNumber": 1,
      "serviceDate": "2024-01-15",
      "startTime": "09:00:00",
      "endTime": "17:00:00",
      "hours": 8.0
    },
    {
      "id": "uuid",
      "lineNumber": 2,
      "serviceDate": "2024-01-16",
      "startTime": "09:00:00",
      "endTime": "13:00:00",
      "hours": 4.0
    },
    {
      "id": "uuid",
      "lineNumber": 3,
      "serviceDate": "2024-01-17",
      "startTime": "14:00:00",
      "endTime": "18:00:00",
      "hours": 4.0
    }
  ],
  "totalHours": 16.0,
  "activityDescription": "Implementação de nova funcionalidade XYZ ao longo de 3 dias",
  "subject": "Sprint 1 - Feature XYZ",
  "status": "pending",
  "approvalToken": "uuid",
  "clientFeedback": null,
  "approvedAt": null,
  "createdBy": {
    "id": "uuid",
    "fullName": "Técnico Responsável",
    "email": "tecnico@example.com"
  },
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z"
}
```

**Regras de Negócio:**
1. **Validação de Linhas:**
   - **Obrigatório:** Pelo menos 1 linha
   - **Máximo recomendado:** 30 linhas
   - Cada linha deve ter: `serviceDate`, `startTime`, `endTime`
   - Validar `endTime > startTime` em **cada** linha

2. **Cálculo de Horas Total:**
   - `totalHours = sum(linha1.hours + linha2.hours + ... + linhaN.hours)`
   - Exemplo: 8h + 4h + 4h = 16 horas totais

3. **Validação de Horas do Projeto:**
   - Buscar projeto: `totalHours` e `usedHours`
   - Calcular: `availableHours = totalHours - usedHours`
   - **VALIDAR:** `totalHours <= availableHours`
   - Se inválido, retornar erro 400 com detalhes

4. **Atualização do Projeto:**
   - Incrementar `project.usedHours += totalHours`

5. **Token de Aprovação:**
   - Gerar UUID único para `approvalToken`

6. **CC Emails (Opcional):**
   - Lista de emails que receberão cópia (CC)
   - **IMPORTANTE:** Pessoas em CC **NÃO podem aprovar**
   - Validar formato de cada email
   - Permitir array vazio

7. **Envio de Email:**
   - **TO:** `clientContactEmail` (pode aprovar)
   - **CC:** `ccEmails` (apenas visualizar)
   - Ver seção 8.1 para template atualizado

8. **Criador:**
   - `createdBy` = usuário autenticado (do JWT)

9. **Line Numbers:**
   - Auto-atribuir números sequenciais (1, 2, 3...)
   - Ordenar por `lineNumber` na resposta

**Validações:**
```java
// Validar número mínimo de linhas
if (lines == null || lines.isEmpty()) {
  throw new BadRequestException("Deve haver pelo menos 1 linha de serviço");
}

// Validar cada linha
for (ServiceSheetLineDto line : lines) {
  if (line.getEndTime().isBefore(line.getStartTime()) ||
      line.getEndTime().equals(line.getStartTime())) {
    throw new BadRequestException(
      "Linha " + line.getLineNumber() +
      ": Horário de término deve ser maior que horário de início"
    );
  }
}

// Validar emails CC
if (ccEmails != null) {
  for (String email : ccEmails) {
    if (!EmailValidator.isValid(email)) {
      throw new BadRequestException("Email CC inválido: " + email);
    }
  }
}
```

**Errors:**
- `400` - Validação falhou (campos obrigatórios, formato de data/hora)
- `400` - Nenhuma linha fornecida
- `400` - Horário inválido em uma ou mais linhas
- `400` - Email CC inválido
- `400` - Horas insuficientes no projeto
- `404` - Projeto não encontrado
- `401` - Não autenticado

---

### 3.2 GET /api/service-sheets
Lista folhas de serviço (com filtro por role).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `page` (opcional, default=0): Número da página
- `size` (opcional, default=20): Tamanho da página
- `status` (opcional): Filtrar por status (pending, approved, rejected)
- `projectId` (opcional): Filtrar por projeto

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "project": {
        "id": "uuid",
        "name": "Projeto ABC",
        "company": "Empresa Cliente LTDA"
      },
      "clientContactName": "João Silva",
      "clientContactEmail": "joao@client.com",
      "clientContactPhone": "+55 11 98888-7777",
      "serviceDate": "2024-01-15",
      "startTime": "09:00:00",
      "endTime": "17:00:00",
      "hours": 8.0,
      "activityDescription": "Implementação de nova funcionalidade XYZ",
      "subject": "Sprint 1 - Feature XYZ",
      "status": "approved",
      "approvalToken": "uuid",
      "clientFeedback": "Excelente trabalho!",
      "approvedAt": "2024-01-16T08:00:00Z",
      "createdBy": {
        "id": "uuid",
        "fullName": "Técnico Responsável",
        "email": "tecnico@example.com"
      },
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-16T08:00:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 45,
  "totalPages": 3
}
```

**Regras de Negócio (IMPORTANTE - Filtro por Role):**
1. **Technician:** Retornar apenas service sheets onde `createdBy = userId do JWT`
2. **Admin:** Retornar todas as service sheets
3. **Observer:** Retornar todas as service sheets (read-only)

**Ordenação:**
- Ordenar por `createdAt DESC` (mais recentes primeiro)

**Errors:**
- `401` - Não autenticado

---

### 3.3 GET /api/service-sheets/{id}
Busca uma folha de serviço por ID.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "project": {
    "id": "uuid",
    "name": "Projeto ABC",
    "company": "Empresa Cliente LTDA",
    "clientResponsible": "Gerente Cliente",
    "partnerResponsible": "Gerente Parceiro",
    "totalHours": 160.0,
    "usedHours": 45.5
  },
  "clientContactName": "João Silva",
  "clientContactEmail": "joao@client.com",
  "clientContactPhone": "+55 11 98888-7777",
  "serviceDate": "2024-01-15",
  "startTime": "09:00:00",
  "endTime": "17:00:00",
  "hours": 8.0,
  "activityDescription": "Implementação de nova funcionalidade XYZ",
  "subject": "Sprint 1 - Feature XYZ",
  "status": "approved",
  "approvalToken": "uuid",
  "clientFeedback": "Excelente trabalho!",
  "approvedAt": "2024-01-16T08:00:00Z",
  "createdBy": {
    "id": "uuid",
    "fullName": "Técnico Responsável",
    "email": "tecnico@example.com"
  },
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-16T08:00:00Z"
}
```

**Regras:**
- Retornar dados completos do projeto (JOIN)
- Retornar dados do criador (JOIN com profiles)

**Errors:**
- `404` - Service sheet não encontrado
- `401` - Não autenticado

---

### 3.4 PUT /api/service-sheets/{id}
Atualiza uma folha de serviço.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "projectId": "uuid",
  "clientContactName": "João Silva",
  "clientContactEmail": "joao@client.com",
  "clientContactPhone": "+55 11 98888-7777",
  "serviceDate": "2024-01-15",
  "startTime": "09:00:00",
  "endTime": "18:00:00",
  "activityDescription": "Implementação de nova funcionalidade XYZ - Atualizado",
  "subject": "Sprint 1 - Feature XYZ"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "project": {
    "id": "uuid",
    "name": "Projeto ABC",
    "company": "Empresa Cliente LTDA"
  },
  "clientContactName": "João Silva",
  "clientContactEmail": "joao@client.com",
  "clientContactPhone": "+55 11 98888-7777",
  "serviceDate": "2024-01-15",
  "startTime": "09:00:00",
  "endTime": "18:00:00",
  "hours": 9.0,
  "activityDescription": "Implementação de nova funcionalidade XYZ - Atualizado",
  "subject": "Sprint 1 - Feature XYZ",
  "status": "pending",
  "approvalToken": "uuid",
  "clientFeedback": null,
  "approvedAt": null,
  "createdBy": {
    "id": "uuid",
    "fullName": "Técnico Responsável",
    "email": "tecnico@example.com"
  },
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T11:00:00Z"
}
```

**Regras de Negócio (COMPLEXAS):**

1. **Buscar Service Sheet Antiga:**
   ```java
   oldServiceSheet = repository.findById(id);
   oldHours = calculateHours(oldServiceSheet.startTime, oldServiceSheet.endTime);
   oldProjectId = oldServiceSheet.projectId;
   ```

2. **Calcular Novas Horas:**
   ```java
   newHours = calculateHours(request.startTime, request.endTime);
   ```

3. **Cenário 1: Mesmo Projeto (oldProjectId == newProjectId)**
   ```java
   hoursDifference = newHours - oldHours;

   if (hoursDifference > 0) {
     // Validar se há horas disponíveis
     availableHours = project.totalHours - project.usedHours;
     if (hoursDifference > availableHours) {
       throw new BadRequestException("Horas insuficientes");
     }
   }

   // Atualizar projeto
   project.usedHours += hoursDifference;
   ```

4. **Cenário 2: Projeto Diferente (oldProjectId != newProjectId)**
   ```java
   // Devolver horas ao projeto antigo
   oldProject.usedHours -= oldHours;

   // Validar horas no novo projeto
   newProject = projectRepository.findById(newProjectId);
   availableHours = newProject.totalHours - newProject.usedHours;
   if (newHours > availableHours) {
     throw new BadRequestException("Horas insuficientes no novo projeto");
   }

   // Adicionar horas ao novo projeto
   newProject.usedHours += newHours;

   // Salvar ambos os projetos
   projectRepository.save(oldProject);
   projectRepository.save(newProject);
   ```

5. **Atualizar Service Sheet:**
   - Atualizar todos os campos
   - Setar `updatedAt = NOW()`

**Errors:**
- `400` - Horas insuficientes
- `404` - Service sheet ou projeto não encontrado
- `401` - Não autenticado

---

### 3.5 DELETE /api/service-sheets/{id}
Deleta uma folha de serviço.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (204 No Content)**

**Regras de Negócio:**

1. **Buscar Service Sheet:**
   ```java
   serviceSheet = repository.findById(id);
   ```

2. **Calcular Horas:**
   ```java
   hours = calculateHours(serviceSheet.startTime, serviceSheet.endTime);
   ```

3. **Atualizar Projeto:**
   ```java
   project = projectRepository.findById(serviceSheet.projectId);
   project.usedHours -= hours;
   projectRepository.save(project);
   ```

4. **Deletar Service Sheet:**
   ```java
   repository.delete(serviceSheet);
   ```

**Errors:**
- `404` - Service sheet não encontrado
- `401` - Não autenticado

---

### 3.6 POST /api/service-sheets/{id}/resend-approval
Reenvia o email de aprovação.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "message": "Email de aprovação reenviado com sucesso"
}
```

**Regras:**
- Buscar service sheet por ID
- **VALIDAR:** Status não pode ser "approved"
- Se status = "approved", retornar erro 400
- Reenviar email de aprovação (ver seção 8.1)

**Errors:**
- `400` - Service sheet já aprovado
- `404` - Service sheet não encontrado
- `401` - Não autenticado

---

### 3.7 GET /api/service-sheets/token/{token}
Busca service sheet pelo token de aprovação (público - sem autenticação).

**Response (200 OK):**
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "project": {
    "id": "uuid",
    "name": "Projeto ABC",
    "company": "Empresa Cliente LTDA"
  },
  "clientContactName": "João Silva",
  "clientContactEmail": "joao@client.com",
  "clientContactPhone": "+55 11 98888-7777",
  "serviceDate": "2024-01-15",
  "startTime": "09:00:00",
  "endTime": "17:00:00",
  "hours": 8.0,
  "activityDescription": "Implementação de nova funcionalidade XYZ",
  "subject": "Sprint 1 - Feature XYZ",
  "status": "pending",
  "createdBy": {
    "id": "uuid",
    "fullName": "Técnico Responsável",
    "email": "tecnico@example.com"
  },
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z"
}
```

**Nota:**
- **NÃO REQUER AUTENTICAÇÃO** (usado na página pública de aprovação)
- **NÃO RETORNAR** `approvalToken` na resposta (segurança)

**Errors:**
- `404` - Token inválido ou não encontrado

---

### 3.8 POST /api/service-sheets/token/{token}/approve (ATUALIZADO)
Aprova ou rejeita uma folha de serviço (público - sem autenticação).

**Request:**
```json
{
  "approved": true,
  "feedback": "Excelente trabalho! Tudo conforme esperado.",
  "approverEmail": "joao@client.com"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "approved",
  "clientFeedback": "Excelente trabalho! Tudo conforme esperado.",
  "approvedAt": "2024-01-16T08:00:00Z"
}
```

**Regras de Negócio:**

1. **Buscar por Token:**
   ```java
   serviceSheet = repository.findByApprovalToken(token);
   ```

2. **VALIDAR PERMISSÃO DE APROVAÇÃO (NOVO):**
   ```java
   // Apenas o email principal pode aprovar (não CC)
   String normalizedApprover = request.approverEmail.toLowerCase().trim();
   String normalizedClient = serviceSheet.clientContactEmail.toLowerCase().trim();

   if (!normalizedApprover.equals(normalizedClient)) {
     throw new ForbiddenException(
       "Apenas o contato principal (" + serviceSheet.clientContactEmail +
       ") pode aprovar esta folha de serviço. " +
       "Você está usando um email em cópia (CC) e não tem permissão para aprovar."
     );
   }
   ```

3. **Validar Status:**
   ```java
   if (serviceSheet.status != ServiceSheetStatus.PENDING) {
     throw new BadRequestException(
       "Esta folha de serviço já foi " +
       (serviceSheet.status == ServiceSheetStatus.APPROVED ? "aprovada" : "rejeitada")
     );
   }
   ```

4. **Atualizar Status:**
   ```java
   if (request.approved) {
     serviceSheet.status = ServiceSheetStatus.APPROVED;
   } else {
     serviceSheet.status = ServiceSheetStatus.REJECTED;
   }
   ```

5. **Atualizar Campos:**
   ```java
   serviceSheet.clientFeedback = request.feedback;
   serviceSheet.approvedAt = LocalDateTime.now();
   serviceSheet.updatedAt = LocalDateTime.now();
   ```

6. **Enviar Notificação:**
   - Enviar email para o técnico (`createdBy.email`)
   - Informar aprovação ou rejeição
   - Ver seção 8.2 para template

**Validação no Frontend:**
```javascript
// Página de aprovação deve pedir confirmação do email
const approverEmail = prompt("Digite seu email para confirmar:");

await fetch(`/api/service-sheets/token/${token}/approve`, {
  method: 'POST',
  body: JSON.stringify({
    approved: true,
    feedback: feedbackText,
    approverEmail: approverEmail
  })
});
```

**Nota:**
- **NÃO REQUER AUTENTICAÇÃO** (usado na página pública de aprovação)
- Campo `feedback` é opcional
- Campo `approverEmail` é **obrigatório** (para validar permissão)
- **APENAS `clientContactEmail` pode aprovar**
- Emails em `ccEmails` **NÃO podem aprovar**

**Errors:**
- `404` - Token inválido
- `400` - Service sheet já aprovado/rejeitado
- `400` - approverEmail não fornecido
- `403` - Email não autorizado para aprovar (é CC, não o contato principal)

---

## 4. PROJECTS

Todos os endpoints requerem autenticação.

### 4.1 POST /api/projects
Cria um novo projeto.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "name": "Projeto ABC",
  "company": "Empresa Cliente LTDA",
  "clientResponsible": "Gerente Cliente",
  "partnerResponsible": "Gerente Parceiro",
  "totalHours": 160.0
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "Projeto ABC",
  "company": "Empresa Cliente LTDA",
  "clientResponsible": "Gerente Cliente",
  "partnerResponsible": "Gerente Parceiro",
  "totalHours": 160.0,
  "usedHours": 0.0,
  "availableHours": 160.0,
  "createdBy": {
    "id": "uuid",
    "fullName": "Admin User",
    "email": "admin@example.com"
  },
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z"
}
```

**Regras:**
- `usedHours` inicia em 0.0
- `createdBy` = usuário autenticado (do JWT)
- `totalHours` deve ser >= 0

**Validações:**
- Todos os campos são obrigatórios
- `totalHours` >= 0

**Errors:**
- `400` - Validação falhou
- `401` - Não autenticado

---

### 4.2 GET /api/projects
Lista todos os projetos.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `page` (opcional, default=0)
- `size` (opcional, default=20)

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": "uuid",
      "name": "Projeto ABC",
      "company": "Empresa Cliente LTDA",
      "clientResponsible": "Gerente Cliente",
      "partnerResponsible": "Gerente Parceiro",
      "totalHours": 160.0,
      "usedHours": 45.5,
      "availableHours": 114.5,
      "createdBy": {
        "id": "uuid",
        "fullName": "Admin User",
        "email": "admin@example.com"
      },
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-01T10:00:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 15,
  "totalPages": 1
}
```

**Regras:**
- **TODOS os usuários** (technician, admin, observer) veem **TODOS os projetos**
- Não há filtro por role aqui (diferente de service-sheets)
- Calcular `availableHours = totalHours - usedHours` em tempo real

**Errors:**
- `401` - Não autenticado

---

### 4.3 GET /api/projects/{id}
Busca um projeto por ID.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Projeto ABC",
  "company": "Empresa Cliente LTDA",
  "clientResponsible": "Gerente Cliente",
  "partnerResponsible": "Gerente Parceiro",
  "totalHours": 160.0,
  "usedHours": 45.5,
  "availableHours": 114.5,
  "createdBy": {
    "id": "uuid",
    "fullName": "Admin User",
    "email": "admin@example.com"
  },
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z"
}
```

**Errors:**
- `404` - Projeto não encontrado
- `401` - Não autenticado

---

### 4.4 GET /api/projects/{id}/hours-info
Retorna informações detalhadas de horas do projeto.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "projectId": "uuid",
  "projectName": "Projeto ABC",
  "totalHours": 160.0,
  "usedHours": 45.5,
  "availableHours": 114.5,
  "percentageUsed": 28.44
}
```

**Cálculos:**
```java
availableHours = totalHours - usedHours;
percentageUsed = (usedHours / totalHours) * 100;
```

**Errors:**
- `404` - Projeto não encontrado
- `401` - Não autenticado

---

### 4.5 GET /api/projects/{id}/service-sheets-count
Retorna a contagem de service sheets do projeto.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "projectId": "uuid",
  "serviceSheetsCount": 12
}
```

**Regras:**
- Contar todos os service sheets onde `projectId = id`

**Errors:**
- `404` - Projeto não encontrado
- `401` - Não autenticado

---

### 4.6 PUT /api/projects/{id}
Atualiza um projeto.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "name": "Projeto ABC - Atualizado",
  "company": "Empresa Cliente LTDA",
  "clientResponsible": "Novo Gerente",
  "partnerResponsible": "Gerente Parceiro",
  "totalHours": 200.0
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Projeto ABC - Atualizado",
  "company": "Empresa Cliente LTDA",
  "clientResponsible": "Novo Gerente",
  "partnerResponsible": "Gerente Parceiro",
  "totalHours": 200.0,
  "usedHours": 45.5,
  "availableHours": 154.5,
  "createdBy": {
    "id": "uuid",
    "fullName": "Admin User",
    "email": "admin@example.com"
  },
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-02T10:00:00Z"
}
```

**Regras:**
- Atualizar `updatedAt = NOW()`
- **VALIDAR:** `totalHours >= usedHours` (não pode reduzir abaixo do usado)

**Errors:**
- `400` - totalHours menor que usedHours
- `404` - Projeto não encontrado
- `401` - Não autenticado

---

### 4.7 DELETE /api/projects/{id}
Deleta um projeto.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (204 No Content)**

**Regras de Negócio (IMPORTANTE):**

1. **Verificar Dependências:**
   ```java
   count = serviceSheetRepository.countByProjectId(projectId);

   if (count > 0) {
     throw new BadRequestException(
       "Não é possível deletar o projeto. " +
       "Existem " + count + " folhas de serviço associadas."
     );
   }
   ```

2. **Deletar Projeto:**
   ```java
   projectRepository.delete(project);
   ```

**Errors:**
- `400` - Projeto tem service sheets associados
- `404` - Projeto não encontrado
- `401` - Não autenticado

---

## 5. PROFILES (USUÁRIOS)

### 5.1 GET /api/profiles/me
Retorna o perfil do usuário autenticado.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "Nome Completo",
  "role": "technician",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z"
}
```

**Errors:**
- `401` - Não autenticado

---

### 5.2 PUT /api/profiles/me
Atualiza o perfil do usuário autenticado.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "fullName": "Novo Nome Completo"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "Novo Nome Completo",
  "role": "technician",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-02T10:00:00Z"
}
```

**Regras:**
- Usuário **NÃO pode** alterar próprio `role`
- Usuário **NÃO pode** alterar próprio `email`
- Apenas `fullName` é editável

**Errors:**
- `401` - Não autenticado

---

## 6. ADMIN - GERENCIAMENTO DE USUÁRIOS

**TODOS os endpoints desta seção requerem role = "admin".**

### 6.1 GET /api/admin/users
Lista todos os usuários (apenas admin).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `page` (opcional, default=0)
- `size` (opcional, default=20)

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "Nome Completo",
      "role": "technician",
      "lastSignInAt": "2024-01-05T10:00:00Z",
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-01T10:00:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 45,
  "totalPages": 3
}
```

**Regras:**
- **VALIDAR:** Usuário autenticado tem `role = admin`
- Se não admin, retornar `403 Forbidden`

**Errors:**
- `403` - Usuário não é admin
- `401` - Não autenticado

---

### 6.2 POST /api/admin/users
Cria um novo usuário (apenas admin).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "fullName": "Novo Usuário",
  "role": "technician"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "email": "newuser@example.com",
  "fullName": "Novo Usuário",
  "role": "technician",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z"
}
```

**Regras:**
- **VALIDAR:** Usuário autenticado tem `role = admin`
- Validar role: deve ser `admin`, `technician`, ou `observer`
- Criar usuário e perfil
- **NÃO** enviar email de confirmação (criação pelo admin)

**Errors:**
- `403` - Usuário não é admin
- `400` - Email já existe
- `400` - Role inválido
- `401` - Não autenticado

---

### 6.3 PUT /api/admin/users/{userId}/role
Atualiza a role de um usuário (apenas admin).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "role": "admin"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "Nome Completo",
  "role": "admin",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-02T10:00:00Z"
}
```

**Regras:**
- **VALIDAR:** Usuário autenticado tem `role = admin`
- Validar role: deve ser `admin`, `technician`, ou `observer`

**Errors:**
- `403` - Usuário não é admin
- `400` - Role inválido
- `404` - Usuário não encontrado
- `401` - Não autenticado

---

### 6.4 DELETE /api/admin/users/{userId}
Deleta um usuário (apenas admin).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (204 No Content)**

**Regras:**
- **VALIDAR:** Usuário autenticado tem `role = admin`
- Deletar perfil (cascata para service sheets via `created_by`)
- **Considerar:** Soft delete ao invés de hard delete?

**Errors:**
- `403` - Usuário não é admin
- `404` - Usuário não encontrado
- `401` - Não autenticado

---

### 6.5 POST /api/admin/users/{userId}/reset-password
Reseta a senha de um usuário (apenas admin).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "newPassword": "newSecurePassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Senha resetada com sucesso"
}
```

**Regras:**
- **VALIDAR:** Usuário autenticado tem `role = admin`
- Atualizar senha do usuário
- **Opcional:** Enviar email notificando a mudança

**Errors:**
- `403` - Usuário não é admin
- `400` - Senha inválida (menos de 8 caracteres)
- `404` - Usuário não encontrado
- `401` - Não autenticado

---

### 6.6 POST /api/admin/users/{userId}/send-magic-link
Envia um link mágico de login para o usuário (apenas admin).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "message": "Link mágico enviado com sucesso para user@example.com"
}
```

**Regras:**
- **VALIDAR:** Usuário autenticado tem `role = admin`
- Gerar token temporário (válido por 1 hora)
- Enviar email com link: `{SITE_URL}/auth/magic-link?token={token}`
- Ver seção 8.3 para template de email

**Errors:**
- `403` - Usuário não é admin
- `404` - Usuário não encontrado
- `401` - Não autenticado

---

### 6.7 POST /api/auth/magic-link
Autentica usuário via magic link (público).

**Request:**
```json
{
  "token": "magic-link-token"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Nome Completo",
    "role": "technician"
  }
}
```

**Regras:**
- **NÃO REQUER AUTENTICAÇÃO** (público)
- Validar token não expirado (1 hora)
- Invalidar token após uso
- Gerar JWT tokens normais

**Errors:**
- `401` - Token inválido ou expirado

---

## 7. REGRAS DE AUTORIZAÇÃO (RBAC)

### Roles e Permissões

| Recurso | Admin | Technician | Observer |
|---------|-------|------------|----------|
| **Service Sheets - Create** | ✅ | ✅ | ❌ |
| **Service Sheets - Read All** | ✅ | ❌ (apenas próprios) | ✅ |
| **Service Sheets - Update** | ✅ | ✅ (apenas próprios) | ❌ |
| **Service Sheets - Delete** | ✅ | ✅ (apenas próprios) | ❌ |
| **Projects - Create** | ✅ | ✅ | ❌ |
| **Projects - Read** | ✅ | ✅ | ✅ |
| **Projects - Update** | ✅ | ✅ | ❌ |
| **Projects - Delete** | ✅ | ✅ | ❌ |
| **Users - Manage** | ✅ | ❌ | ❌ |
| **Profile - Update Own** | ✅ | ✅ | ✅ |

### Implementação em Spring Security

```java
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) {
    http
      .authorizeHttpRequests(auth -> auth
        // Public endpoints
        .requestMatchers("/api/auth/register").permitAll()
        .requestMatchers("/api/auth/login").permitAll()
        .requestMatchers("/api/auth/magic-link").permitAll()
        .requestMatchers("/api/service-sheets/token/**").permitAll()

        // Admin only
        .requestMatchers("/api/admin/**").hasRole("ADMIN")

        // Authenticated
        .anyRequest().authenticated()
      )
      .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }
}
```

### Anotações nos Controllers

```java
@RestController
@RequestMapping("/api/service-sheets")
public class ServiceSheetController {

  // Todos podem criar (authenticated)
  @PostMapping
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<ServiceSheetDto> create(...) { }

  // Apenas admin ou owner
  @PutMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN') or @securityService.isServiceSheetOwner(#id, authentication)")
  public ResponseEntity<ServiceSheetDto> update(...) { }

  // Apenas admin ou owner
  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN') or @securityService.isServiceSheetOwner(#id, authentication)")
  public ResponseEntity<Void> delete(...) { }
}
```

---

## 8. EMAIL SERVICE

### 8.1 Email de Aprovação (Cliente) - ATUALIZADO

**Trigger:** Criação de service sheet ou reenvio

**Destinatários:**
- **TO (Para):** `serviceSheet.clientContactEmail` - Pode aprovar/rejeitar
- **CC (Cópia):** `serviceSheet.ccEmails` - Apenas visualização, **não pode aprovar**

**Assunto:** `Aprovação de Folha de Serviço - {projectName}`

**Estrutura do Email:**

1. **Cabeçalho:**
   - Título: "Aprovação de Folha de Serviço"
   - Saudação personalizada com nome do cliente

2. **Informações do Projeto:**
   - Nome do projeto
   - Empresa
   - Técnico responsável
   - Assunto/Objetivo do trabalho

3. **Tabela de Dias de Serviço (NOVO):**
   - Lista todas as linhas de serviço
   - Para cada linha: Data, Horário Início, Horário Fim, Horas
   - Linha de total: Soma de todas as horas
   - Exemplo:
     ```
     | Data       | Início | Fim   | Horas |
     |------------|--------|-------|-------|
     | 15/01/2024 | 09:00  | 17:00 | 8.00h |
     | 16/01/2024 | 09:00  | 13:00 | 4.00h |
     | 17/01/2024 | 14:00  | 18:00 | 4.00h |
     |------------|--------|-------|-------|
     | TOTAL      |        |       | 16.00h|
     ```

4. **Descrição das Atividades:**
   - Texto completo da descrição do trabalho realizado

5. **Botões de Ação:**
   - ✓ Aprovar (verde)
   - ✗ Rejeitar (vermelho)
   - Link direto para página de aprovação

6. **Aviso Importante (NOVO):**
   - **Se o email foi enviado para CC:**
     ```
     ⚠️ ATENÇÃO: Você está recebendo este email em cópia (CC).
     Apenas o contato principal ({clientContactEmail}) pode aprovar esta folha de serviço.
     ```
   - Este aviso só aparece para emails em ccEmails

7. **Rodapé:**
   - Email automático, não responder
   - Informações de contato se necessário

**Comportamento:**
- Quando usuário clica em aprovar/rejeitar, a página pede confirmação do email
- Sistema valida se o email é o `clientContactEmail`
- Se for email CC, mostra mensagem de erro: "Você não tem permissão para aprovar"

**Variáveis do Template:**
- `{clientContactName}` - Nome do contato principal
- `{projectName}` - Nome do projeto
- `{company}` - Empresa cliente
- `{technicianName}` - Nome do técnico (createdBy.fullName)
- `{subject}` - Assunto da folha de serviço
- `{activityDescription}` - Descrição detalhada
- `{lines}` - Array de linhas (loop para gerar tabela)
  - Para cada linha: `{serviceDate}`, `{startTime}`, `{endTime}`, `{hours}`
- `{totalHours}` - Soma de todas as horas
- `{approvalUrl}` - `{SITE_URL}/approval/{approvalToken}`
- `{isCcRecipient}` - Boolean para mostrar aviso de CC

---

### 8.2 Email de Notificação (Técnico)

**Trigger:** Cliente aprova ou rejeita service sheet

**Para:** `createdBy.email` (técnico)

**Assunto:**
- Aprovado: `✓ Folha de Serviço Aprovada - {projectName}`
- Rejeitado: `✗ Folha de Serviço Rejeitada - {projectName}`

**Template HTML (Aprovado):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
    .feedback { background-color: #e8f5e9; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Folha de Serviço Aprovada</h1>
    </div>

    <div class="content">
      <p>Olá <strong>{technicianName}</strong>,</p>

      <p>Sua folha de serviço foi <strong style="color: #4CAF50;">aprovada</strong> pelo cliente!</p>

      <div class="details">
        <h3>Detalhes do Serviço</h3>
        <p><strong>Projeto:</strong> {projectName}</p>
        <p><strong>Cliente:</strong> {clientContactName}</p>
        <p><strong>Data:</strong> {serviceDate}</p>
        <p><strong>Horário:</strong> {startTime} - {endTime} ({hours}h)</p>
        <p><strong>Assunto:</strong> {subject}</p>
      </div>

      {if clientFeedback}
      <div class="feedback">
        <h3>Feedback do Cliente</h3>
        <p>{clientFeedback}</p>
      </div>
      {endif}

      <p style="margin-top: 30px;">
        <a href="{serviceSheetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Ver Folha de Serviço</a>
      </p>
    </div>

    <div class="footer">
      <p>Este é um email automático. Por favor, não responda.</p>
    </div>
  </div>
</body>
</html>
```

**Template HTML (Rejeitado):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #f44336; }
    .feedback { background-color: #ffebee; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✗ Folha de Serviço Rejeitada</h1>
    </div>

    <div class="content">
      <p>Olá <strong>{technicianName}</strong>,</p>

      <p>Sua folha de serviço foi <strong style="color: #f44336;">rejeitada</strong> pelo cliente.</p>

      <div class="details">
        <h3>Detalhes do Serviço</h3>
        <p><strong>Projeto:</strong> {projectName}</p>
        <p><strong>Cliente:</strong> {clientContactName}</p>
        <p><strong>Data:</strong> {serviceDate}</p>
        <p><strong>Horário:</strong> {startTime} - {endTime} ({hours}h)</p>
        <p><strong>Assunto:</strong> {subject}</p>
      </div>

      {if clientFeedback}
      <div class="feedback">
        <h3>Motivo da Rejeição</h3>
        <p>{clientFeedback}</p>
      </div>
      {endif}

      <p style="margin-top: 30px;">
        <a href="{serviceSheetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #f44336; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Ver Folha de Serviço</a>
      </p>
    </div>

    <div class="footer">
      <p>Este é um email automático. Por favor, não responda.</p>
    </div>
  </div>
</body>
</html>
```

**Variáveis:**
- `{technicianName}` - createdBy.fullName
- `{projectName}` - project.name
- `{clientContactName}` - serviceSheet.clientContactName
- `{serviceDate}` - serviceSheet.serviceDate (formato: dd/MM/yyyy)
- `{startTime}` - serviceSheet.startTime (formato: HH:mm)
- `{endTime}` - serviceSheet.endTime (formato: HH:mm)
- `{hours}` - horas calculadas
- `{subject}` - serviceSheet.subject
- `{clientFeedback}` - serviceSheet.clientFeedback (opcional)
- `{serviceSheetUrl}` - `{SITE_URL}/service-sheets/{id}`

---

### 8.3 Email de Magic Link (Admin)

**Trigger:** Admin envia magic link para usuário

**Para:** `user.email`

**Assunto:** `Link de Acesso ao Sistema`

**Template HTML:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Link de Acesso ao Sistema</h1>
    </div>

    <div class="content">
      <p>Olá <strong>{fullName}</strong>,</p>

      <p>Você recebeu um link de acesso direto ao sistema.</p>

      <div style="text-align: center;">
        <a href="{magicLinkUrl}" class="button">Acessar Sistema</a>
      </div>

      <div class="warning">
        <strong>⚠️ Atenção:</strong>
        <ul>
          <li>Este link é válido por <strong>1 hora</strong></li>
          <li>Pode ser usado apenas <strong>uma vez</strong></li>
          <li>Não compartilhe este link com ninguém</li>
        </ul>
      </div>

      <p style="font-size: 12px; color: #666; word-break: break-all;">
        Ou copie e cole o link: {magicLinkUrl}
      </p>
    </div>

    <div class="footer">
      <p>Este é um email automático. Por favor, não responda.</p>
      <p>Se você não solicitou este acesso, ignore este email.</p>
    </div>
  </div>
</body>
</html>
```

**Variáveis:**
- `{fullName}` - user.fullName
- `{magicLinkUrl}` - `{SITE_URL}/auth/magic-link?token={magicToken}`

---

## 9. MODELOS DE DADOS (Entities)

### 9.1 ServiceSheetLine (NOVO - Linhas de Serviço)

```java
@Entity
@Table(name = "service_sheet_lines")
public class ServiceSheetLine {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "service_sheet_id", nullable = false)
  private ServiceSheet serviceSheet;

  @Column(name = "line_number", nullable = false)
  private Integer lineNumber; // Ordem das linhas (1, 2, 3...)

  @Column(name = "service_date", nullable = false)
  private LocalDate serviceDate;

  @Column(name = "start_time", nullable = false)
  private LocalTime startTime;

  @Column(name = "end_time", nullable = false)
  private LocalTime endTime;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  @Transient
  public double getHours() {
    return Duration.between(startTime, endTime).toMinutes() / 60.0;
  }
}
```

**Importante:**
- Cada linha representa um dia de trabalho
- `lineNumber` define a ordem de exibição
- Validar `endTime > startTime` em cada linha

---

### 9.2 Profile (User)

```java
@Entity
@Table(name = "profiles")
public class Profile {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(unique = true, nullable = false)
  private String email;

  @Column(nullable = false)
  private String password;

  @Column(name = "full_name")
  private String fullName;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Role role = Role.TECHNICIAN;

  @Column(name = "last_sign_in_at")
  private LocalDateTime lastSignInAt;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  @OneToMany(mappedBy = "createdBy", cascade = CascadeType.ALL)
  private List<ServiceSheet> serviceSheets;

  @OneToMany(mappedBy = "createdBy", cascade = CascadeType.ALL)
  private List<Project> projects;
}

public enum Role {
  ADMIN, TECHNICIAN, OBSERVER
}
```

---

### 9.2 Project

```java
@Entity
@Table(name = "projects")
public class Project {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private String company;

  @Column(name = "client_responsible", nullable = false)
  private String clientResponsible;

  @Column(name = "partner_responsible", nullable = false)
  private String partnerResponsible;

  @Column(name = "total_hours", nullable = false, precision = 10, scale = 2)
  private BigDecimal totalHours;

  @Column(name = "used_hours", nullable = false, precision = 10, scale = 2)
  private BigDecimal usedHours = BigDecimal.ZERO;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "created_by")
  private Profile createdBy;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  @OneToMany(mappedBy = "project", cascade = CascadeType.ALL)
  private List<ServiceSheet> serviceSheets;

  @Transient
  public BigDecimal getAvailableHours() {
    return totalHours.subtract(usedHours);
  }
}
```

---

### 9.4 ServiceSheet (ATUALIZADO)

```java
@Entity
@Table(name = "service_sheets")
public class ServiceSheet {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "project_id", nullable = false)
  private Project project;

  @Column(name = "client_contact_name", nullable = false)
  private String clientContactName;

  @Column(name = "client_contact_email", nullable = false)
  private String clientContactEmail;

  @Column(name = "client_contact_phone")
  private String clientContactPhone;

  // NOVO: CC emails (array PostgreSQL ou JSON)
  @Type(type = "json")
  @Column(name = "cc_emails", columnDefinition = "jsonb")
  private List<String> ccEmails = new ArrayList<>();

  @Column(name = "activity_description", nullable = false, columnDefinition = "TEXT")
  private String activityDescription;

  @Column(columnDefinition = "TEXT")
  private String subject;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ServiceSheetStatus status = ServiceSheetStatus.PENDING;

  @Column(name = "approval_token", unique = true)
  private UUID approvalToken;

  @Column(name = "client_feedback", columnDefinition = "TEXT")
  private String clientFeedback;

  @Column(name = "approved_at")
  private LocalDateTime approvedAt;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "created_by")
  private Profile createdBy;

  // NOVO: Relacionamento com linhas de serviço
  @OneToMany(mappedBy = "serviceSheet", cascade = CascadeType.ALL, orphanRemoval = true)
  @OrderBy("lineNumber ASC")
  private List<ServiceSheetLine> lines = new ArrayList<>();

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  // ATUALIZADO: Calcular horas somando todas as linhas
  @Transient
  public double getTotalHours() {
    if (lines == null || lines.isEmpty()) {
      return 0.0;
    }
    return lines.stream()
      .mapToDouble(ServiceSheetLine::getHours)
      .sum();
  }

  // Helper para adicionar linha
  public void addLine(ServiceSheetLine line) {
    lines.add(line);
    line.setServiceSheet(this);
    line.setLineNumber(lines.size()); // Auto-incrementar número da linha
  }

  // Helper para remover linha
  public void removeLine(ServiceSheetLine line) {
    lines.remove(line);
    line.setServiceSheet(null);
    // Reordenar números das linhas
    for (int i = 0; i < lines.size(); i++) {
      lines.get(i).setLineNumber(i + 1);
    }
  }
}

public enum ServiceSheetStatus {
  PENDING, APPROVED, REJECTED
}
```

**Mudanças principais:**
- ❌ **REMOVIDOS**: `service_date`, `start_time`, `end_time` (agora nas linhas)
- ✅ **ADICIONADO**: `ccEmails` (lista de emails CC)
- ✅ **ADICIONADO**: `lines` (relacionamento OneToMany)
- ✅ **ATUALIZADO**: `getTotalHours()` soma todas as linhas

---

### 9.4 MagicToken (Opcional - para magic links)

```java
@Entity
@Table(name = "magic_tokens")
public class MagicToken {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private Profile user;

  @Column(nullable = false)
  private String token;

  @Column(name = "expires_at", nullable = false)
  private LocalDateTime expiresAt;

  @Column(nullable = false)
  private Boolean used = false;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;
}
```

---

## 10. CONFIGURAÇÕES E VARIÁVEIS DE AMBIENTE

### application.properties / application.yml

```yaml
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/service_sheets
spring.datasource.username=postgres
spring.datasource.password=postgres

# JPA
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=true

# JWT
jwt.secret=${JWT_SECRET:your-secret-key-change-in-production}
jwt.expiration=3600000  # 1 hour in ms
jwt.refresh-expiration=604800000  # 7 days in ms

# Email (SMTP)
spring.mail.host=smtp.resend.com
spring.mail.port=587
spring.mail.username=resend
spring.mail.password=${RESEND_API_KEY}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true

# App Config
app.site-url=${SITE_URL:http://localhost:3000}
app.from-email=${FROM_EMAIL:noreply@example.com}

# Admin Default
app.admin-email=nlanga@prifuturoconsultoria.com
```

---

## 11. MIGRATIONS (Flyway/Liquibase)

### V001__create_profiles_table.sql

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'technician',
  last_sign_in_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_role CHECK (role IN ('admin', 'technician', 'observer'))
);

CREATE INDEX idx_profiles_email ON profiles(email);
```

---

### V002__create_projects_table.sql

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  client_responsible TEXT NOT NULL,
  partner_responsible TEXT NOT NULL,
  total_hours DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total_hours >= 0),
  used_hours DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (used_hours >= 0 AND used_hours <= total_hours),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_hours ON projects(total_hours, used_hours);
CREATE INDEX idx_projects_created_by ON projects(created_by);
```

---

### V003__create_service_sheets_table.sql (ATUALIZADO)

```sql
CREATE TABLE service_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  client_contact_name TEXT NOT NULL,
  client_contact_email TEXT NOT NULL,
  client_contact_phone TEXT,
  cc_emails JSONB DEFAULT '[]'::jsonb,  -- NOVO: Array de emails CC
  activity_description TEXT NOT NULL,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approval_token UUID UNIQUE DEFAULT gen_random_uuid(),
  client_feedback TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX idx_service_sheets_project_id ON service_sheets(project_id);
CREATE INDEX idx_service_sheets_approval_token ON service_sheets(approval_token);
CREATE INDEX idx_service_sheets_created_by ON service_sheets(created_by);
CREATE INDEX idx_service_sheets_status ON service_sheets(status);
```

**Mudanças:**
- ❌ **REMOVIDOS:** `service_date`, `start_time`, `end_time` (movidos para service_sheet_lines)
- ✅ **ADICIONADO:** `cc_emails` (JSONB array)

---

### V004__create_service_sheet_lines_table.sql (NOVO)

```sql
CREATE TABLE service_sheet_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_sheet_id UUID NOT NULL REFERENCES service_sheets(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  service_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_line_number CHECK (line_number > 0),
  CONSTRAINT chk_end_time_after_start_time CHECK (end_time > start_time)
);

CREATE INDEX idx_service_sheet_lines_sheet_id ON service_sheet_lines(service_sheet_id);
CREATE INDEX idx_service_sheet_lines_date ON service_sheet_lines(service_date);

-- Garantir ordenação consistente
CREATE UNIQUE INDEX idx_service_sheet_lines_unique_line
  ON service_sheet_lines(service_sheet_id, line_number);
```

**Importante:**
- `ON DELETE CASCADE`: Quando service sheet é deletado, linhas são deletadas automaticamente
- `line_number` único por service sheet (não pode ter duas linha 1 no mesmo sheet)
- Constraint garante `end_time > start_time` no nível do banco

---

### V005__create_magic_tokens_table.sql

```sql
CREATE TABLE magic_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_magic_tokens_token ON magic_tokens(token);
CREATE INDEX idx_magic_tokens_user_id ON magic_tokens(user_id);
```

---

## 12. REGRAS DE NEGÓCIO COMPLEMENTARES

Esta seção documenta regras de negócio adicionais e comportamentos importantes que devem ser implementados:

### 12.1 Profile Auto-Creation

**Contexto:** Quando um usuário é autenticado mas não tem profile associado.

**Regra:**
```java
// Antes de qualquer operação que requer profile
Profile profile = profileRepository.findById(userId).orElse(null);

if (profile == null) {
  // Auto-criar profile
  profile = new Profile();
  profile.setId(userId);
  profile.setEmail(user.getEmail());
  profile.setFullName(user.getFullName() != null ? user.getFullName() : user.getEmail());

  // Verificar email especial para admin
  if ("nlanga@prifuturoconsultoria.com".equals(user.getEmail())) {
    profile.setRole(Role.ADMIN);
  } else {
    profile.setRole(Role.TECHNICIAN);
  }

  profileRepository.save(profile);
}
```

**Aplicável em:**
- POST /api/service-sheets (antes de criar)
- Qualquer operação que lê user profile

**Importante:** Esta criação deve ser silenciosa (não retornar erro se já existe).

---

### 12.2 Email Failures - Non-Blocking

**Regra:** Falhas no envio de email **NÃO devem** bloquear a operação principal.

**Implementação:**
```java
// Após criar/aprovar service sheet
try {
  emailService.sendApprovalEmail(serviceSheet);
} catch (Exception e) {
  // Log error mas NÃO throw exception
  logger.error("Falha ao enviar email de aprovação: {}", e.getMessage());
  // Operação continua normalmente
}
```

**Aplicável em:**
- POST /api/service-sheets (email de aprovação)
- POST /api/service-sheets/token/{token}/approve (email de notificação)
- POST /api/service-sheets/{id}/resend-approval
- POST /api/admin/users/{userId}/send-magic-link

**Justificativa:** Email é uma funcionalidade auxiliar. A operação de negócio (criar service sheet, aprovar, etc.) é mais importante que o email.

---

### 12.3 Mensagens de Erro Detalhadas

**Regra:** Mensagens de erro devem ser informativas e incluir contexto.

**Exemplo - Horas Insuficientes:**
```java
if (newUsedHours > project.getTotalHours()) {
  BigDecimal available = project.getTotalHours().subtract(project.getUsedHours());
  throw new BadRequestException(
    String.format(
      "Horas insuficientes no projeto \"%s\". Disponível: %.2fh, Solicitado: %.2fh",
      project.getName(),
      available,
      hoursToAdd
    )
  );
}
```

**Outras mensagens importantes:**
```java
// Service sheet não encontrado
"Folha de serviço não encontrada"

// Projeto não encontrado
"Projeto não encontrado"

// Não pode deletar projeto
"Não é possível deletar o projeto \"%s\". Existem %d folhas de serviço associadas."

// Service sheet já aprovado
"Esta folha de serviço já foi aprovada e não pode ser reenviada"

// Token inválido
"Token de aprovação inválido ou expirado"
```

---

### 12.4 Validação de Horários

**Regra:** `endTime` deve ser **maior** que `startTime`.

**Implementação:**
```java
@AssertTrue(message = "Horário de término deve ser maior que horário de início")
public boolean isEndTimeAfterStartTime() {
  if (startTime == null || endTime == null) return true;
  return endTime.isAfter(startTime);
}
```

**Erro:**
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Horário de término deve ser maior que horário de início"
}
```

**Importante:** Esta validação deve ocorrer ANTES de calcular horas.

---

### 12.5 Proteção de used_hours

**Regra:** O campo `used_hours` de um projeto **nunca** pode ser negativo.

**Implementação:**
```java
// Ao subtrair horas (ex: deletar service sheet)
BigDecimal newUsedHours = project.getUsedHours().subtract(hoursToRemove);
project.setUsedHours(newUsedHours.max(BigDecimal.ZERO)); // Garantir >= 0
```

**Contexto:** Proteção contra race conditions ou bugs que possam tentar deixar used_hours negativo.

---

### 12.6 Visibilidade de approval_token

**Regra:** O campo `approvalToken` **NÃO deve** ser retornado em listagens ou consultas normais.

**Implementação:**

✅ **RETORNAR** approval_token:
- POST /api/service-sheets (resposta da criação)
- GET /api/service-sheets/{id} (quando usuário é owner ou admin)

❌ **NÃO RETORNAR** approval_token:
- GET /api/service-sheets (listagem)
- GET /api/service-sheets/token/{token} (consulta pública)

**DTOs separados:**
```java
// ServiceSheetDetailDto - com approval_token
public class ServiceSheetDetailDto {
  private UUID approvalToken; // Incluído
  // ... outros campos
}

// ServiceSheetListDto - sem approval_token
public class ServiceSheetListDto {
  // private UUID approvalToken; // NÃO incluir
  // ... outros campos
}
```

---

### 12.7 Transições de Status

**Regra:** Status de service sheets são unidirecionais (não podem reverter).

**Máquina de Estados:**
```
PENDING → APPROVED (via aprovação do cliente)
PENDING → REJECTED (via rejeição do cliente)

APPROVED → ❌ (não pode mudar)
REJECTED → ❌ (não pode mudar)
```

**Validação:**
```java
if (serviceSheet.getStatus() != ServiceSheetStatus.PENDING) {
  throw new BadRequestException(
    "Esta folha de serviço já foi " +
    (serviceSheet.getStatus() == ServiceSheetStatus.APPROVED ? "aprovada" : "rejeitada") +
    " e não pode ser modificada"
  );
}
```

**Aplicável em:**
- POST /api/service-sheets/token/{token}/approve
- POST /api/service-sheets/{id}/resend-approval

---

### 12.8 Comportamento de Cascade em Deleções

**Profiles (Usuários):**
```sql
-- Service Sheets
created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
```
**Comportamento:** Quando um usuário é deletado, seus service sheets permanecem no sistema com `created_by = NULL`.

**Alternativa (Soft Delete):** Considere implementar soft delete para usuários:
```java
@Column(name = "deleted_at")
private LocalDateTime deletedAt;

@PreRemove
public void softDelete() {
  this.deletedAt = LocalDateTime.now();
}
```

---

**Projects:**
```sql
-- Service Sheets
project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT
```
**Comportamento:** **NÃO PERMITE** deletar projeto se houver service sheets associados.

**Validação no código:**
```java
long count = serviceSheetRepository.countByProjectId(projectId);
if (count > 0) {
  throw new BadRequestException(
    String.format(
      "Não é possível deletar o projeto. Existem %d folhas de serviço associadas.",
      count
    )
  );
}
```

---

**Magic Tokens:**
```sql
user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
```
**Comportamento:** Quando um usuário é deletado, seus magic tokens são **automaticamente deletados**.

---

### 12.9 Ordenação Default

**Service Sheets:**
- Ordenar por `created_at DESC` (mais recentes primeiro)

**Projects:**
- Ordenar por `name ASC` (alfabético)

**Users (Admin):**
- Ordenar por `created_at DESC` (mais recentes primeiro)

---

### 12.10 Validações de Campos

**Email:**
```java
@Email(message = "Email inválido")
@Pattern(
  regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$",
  message = "Formato de email inválido"
)
private String email;
```

**Password:**
```java
@Size(min = 8, message = "Senha deve ter no mínimo 8 caracteres")
private String password;
```

**Datas:**
```java
@NotNull(message = "Data de serviço é obrigatória")
@PastOrPresent(message = "Data de serviço não pode ser futura")
private LocalDate serviceDate;
```

**Horas do Projeto:**
```java
@NotNull
@DecimalMin(value = "0.0", message = "Total de horas deve ser >= 0")
private BigDecimal totalHours;
```

---

### 12.11 Campos Opcionais vs Obrigatórios

**Service Sheets:**
- ✅ Obrigatórios: `projectId`, `clientContactName`, `clientContactEmail`, `serviceDate`, `startTime`, `endTime`, `activityDescription`
- ❌ Opcionais: `clientContactPhone`, `subject`

**Projects:**
- ✅ Obrigatórios: `name`, `company`, `clientResponsible`, `partnerResponsible`, `totalHours`
- ❌ Opcionais: nenhum

**Profiles:**
- ✅ Obrigatórios: `email`, `password` (no registro)
- ❌ Opcionais: `fullName`

---

### 12.12 Atualização de Timestamps

**created_at:**
- Setar **apenas** na criação
- **Nunca** atualizar

**updated_at:**
- Setar na criação (= created_at)
- Atualizar em **toda** modificação

**Implementação JPA:**
```java
@PrePersist
protected void onCreate() {
  createdAt = LocalDateTime.now();
  updatedAt = LocalDateTime.now();
}

@PreUpdate
protected void onUpdate() {
  updatedAt = LocalDateTime.now();
}
```

---

### 12.13 Paginação - Casos Especiais

**Página inválida:**
```java
// Se page > totalPages, retornar página vazia (não erro)
if (page > totalPages && totalPages > 0) {
  return new PageImpl<>(Collections.emptyList(), pageable, totalElements);
}
```

**Size máximo:**
```java
// Limitar tamanho máximo de página
int maxSize = 100;
int actualSize = Math.min(size, maxSize);
```

---

### 12.14 Cálculo de Horas

**Precisão:** Usar 2 casas decimais.

**Fórmula:**
```java
public static double calculateHours(LocalTime start, LocalTime end) {
  Duration duration = Duration.between(start, end);
  double hours = duration.toMinutes() / 60.0;
  return Math.round(hours * 100.0) / 100.0; // Arredondar para 2 casas
}
```

**Exemplos:**
- 09:00 - 17:00 = 8.00 horas
- 09:30 - 17:45 = 8.25 horas
- 08:00 - 12:30 = 4.50 horas

---

### 12.15 Rate Limiting (Segurança)

**Login:**
```java
// 5 tentativas por 15 minutos por IP
@RateLimiter(name = "login", fallbackMethod = "loginRateLimitFallback")
public ResponseEntity<?> login(...) { }
```

**Endpoints Públicos (Approval):**
```java
// 10 requisições por minuto por IP
@RateLimiter(name = "public-approval")
public ResponseEntity<?> getByToken(...) { }
```

**API Geral:**
```java
// 100 requisições por minuto por usuário autenticado
@RateLimiter(name = "api-general")
```

---

### 12.16 Autorização - Ownership Check

**Service Sheets:**
```java
@Service
public class SecurityService {

  public boolean isServiceSheetOwner(UUID serviceSheetId, Authentication auth) {
    String userId = auth.getName(); // userId do JWT

    ServiceSheet sheet = serviceSheetRepository.findById(serviceSheetId)
      .orElse(null);

    if (sheet == null) return false;

    return sheet.getCreatedBy() != null &&
           sheet.getCreatedBy().getId().toString().equals(userId);
  }
}
```

**Uso:**
```java
@PutMapping("/{id}")
@PreAuthorize("hasRole('ADMIN') or @securityService.isServiceSheetOwner(#id, authentication)")
public ResponseEntity<ServiceSheetDto> update(@PathVariable UUID id, ...) { }
```

---

### 12.17 Tratamento de Null em Joins

**Quando created_by = NULL** (usuário deletado):

**Comportamento:**
- DTO deve tratar null gracefully
- Exibir "Usuário Removido" ao invés de erro
- Email vazio ou placeholder
- Não impedir visualização do service sheet

**Implementação:**
- Usar MapStruct com default method
- Ou validação no getter do DTO
- Garantir que frontend não quebra com null

---

### 12.18 Service Sheet Lines - Validações (NOVO)

**Regra:** Validar cada linha individualmente e o conjunto como um todo.

**Validações por Linha:**
1. `endTime > startTime` (obrigatório)
2. `serviceDate` não nulo
3. Horários válidos (formato HH:mm:ss)

**Validações do Conjunto:**
1. Pelo menos 1 linha (mínimo obrigatório)
2. Máximo 30 linhas (recomendado para UX)
3. `lineNumber` sequencial sem gaps (1, 2, 3...)
4. Não permitir `lineNumber` duplicado no mesmo sheet

**Mensagens de Erro Específicas:**
- "Linha 3: Horário de término deve ser maior que horário de início"
- "Deve haver pelo menos 1 linha de serviço"
- "Número máximo de linhas (30) excedido"

---

### 12.19 CC Emails - Validações e Normalização (NOVO)

**Validações:**
1. **Formato de Email:**
   - Validar cada email individualmente
   - Usar regex padrão de email
   - Rejeitar emails inválidos

2. **Duplicação:**
   - Remover duplicatas automaticamente
   - Comparar após normalização

3. **Email Principal:**
   - `clientContactEmail` NÃO pode estar em `ccEmails`
   - Se estiver, remover automaticamente

**Normalização:**
- Converter para lowercase
- Trim (remover espaços)
- Exemplo: " MARIA@EMAIL.COM " → "maria@email.com"

**Limite:**
- Máximo recomendado: 10 emails CC
- Sistema deve aceitar mais se necessário

---

### 12.20 Permissão de Aprovação - CC vs Principal (NOVO)

**Regra:** Apenas `clientContactEmail` pode aprovar. Emails em CC não podem.

**Validação na Aprovação:**
1. Endpoint pede `approverEmail` no body
2. Normalizar ambos emails (lowercase, trim)
3. Comparar: `approverEmail == clientContactEmail`
4. Se diferente, verificar se está em `ccEmails`
5. Se estiver em CC, retornar erro 403 específico

**Mensagem de Erro:**
```
"Apenas o contato principal (joao@cliente.com) pode aprovar esta folha de serviço.
Você está usando um email em cópia (CC) e não tem permissão para aprovar."
```

**Frontend:**
- Página de aprovação deve ter campo para email
- Validação client-side (aviso antes de enviar)
- Validação server-side (segurança)

---

### 12.21 Cálculo de Horas com Múltiplas Linhas (NOVO)

**Regra:** Total de horas = soma de todas as linhas.

**Processo:**
1. Para cada linha: `hours = (endTime - startTime) em decimal`
2. Somar todas: `totalHours = linha1.hours + linha2.hours + ... + linhaN.hours`
3. Arredondar para 2 casas decimais

**Uso do Total:**
- Validar contra `project.availableHours`
- Atualizar `project.usedHours`
- Exibir em DTOs e emails

**Performance:**
- Calcular no momento (não armazenar)
- Usar `@Transient` method na entity
- Cache em DTO se necessário

---

### 12.22 Atualização de Linhas - Reordenação (NOVO)

**Regra:** Ao adicionar/remover linhas, manter números sequenciais.

**Cenário 1 - Adicionar Linha:**
```
Antes: [Linha 1, Linha 2, Linha 3]
Adicionar nova linha
Depois: [Linha 1, Linha 2, Linha 3, Linha 4]
```

**Cenário 2 - Remover Linha do Meio:**
```
Antes: [Linha 1, Linha 2, Linha 3, Linha 4]
Remover Linha 2
Depois: [Linha 1 (mantém), Linha 2 (era 3), Linha 3 (era 4)]
```

**Implementação:**
- Reordenar após remoção
- Loop para renumerar linhas restantes
- Garantir unicidade de lineNumber por sheet

---

### 12.23 Email Template - Tabela de Linhas (NOVO)

**Estrutura:**
```
| Data       | Início | Fim   | Horas |
|------------|--------|-------|-------|
| 15/01/2024 | 09:00  | 17:00 | 8.00h |
| 16/01/2024 | 09:00  | 13:00 | 4.00h |
| 17/01/2024 | 14:00  | 18:00 | 4.00h |
|------------|--------|-------|-------|
| TOTAL      |        |       | 16.00h|
```

**Formatação:**
- Datas: dd/MM/yyyy
- Horas: HH:mm
- Total: 2 casas decimais + "h"
- Linha de total em negrito

**Responsivo:**
- Usar tabela HTML para desktop
- Considerar layout em coluna para mobile
- Testar em clientes de email (Gmail, Outlook)

---

### 12.24 Aviso de CC em Email (NOVO)

**Regra:** Email mostra aviso diferente para TO vs CC.

**Para clientContactEmail (TO):**
```
✓ Você pode aprovar ou rejeitar esta folha de serviço.
```

**Para ccEmails (CC):**
```
⚠️ ATENÇÃO: Você está recebendo este email em cópia (CC).
Apenas [clientContactEmail] pode aprovar esta folha de serviço.
Você pode visualizar mas não aprovar.
```

**Implementação:**
- Template engine com condicional
- Verificar recipient email vs clientContactEmail
- Mostrar aviso apropriado

---

## 13. FUNCIONALIDADES ESPECIAIS: LINHAS MÚLTIPLAS E CC EMAILS

### 13.1 Problema de Negócio

**Situação Anterior:**
- Técnico realiza trabalho ao longo de vários dias
- Sistema só permitia registrar 1 dia por service sheet
- Solução: Criar múltiplos service sheets
- **Problema:** Cliente recebia múltiplas aprovações para o mesmo trabalho

**Requisitos:**
1. Mesmo trabalho pode ser realizado em múltiplos dias
2. Cliente aprova tudo de uma vez (uma única aprovação)
3. Outras pessoas da empresa cliente precisam acompanhar (visibilidade)
4. Apenas o contato principal pode aprovar (não as pessoas em CC)

### 13.2 Solução Implementada

#### A) Múltiplas Linhas de Serviço

**Conceito:**
- Um Service Sheet agora é um "pacote de trabalho"
- Pode ter 1 ou mais "linhas" (dias de trabalho)
- Cada linha tem: data, hora início, hora fim
- Cliente aprova/rejeita o pacote inteiro

**Exemplo de Uso:**
```
Service Sheet: "Implementação de Feature X"
  Linha 1: 15/01/2024, 09:00-17:00 (8h)
  Linha 2: 16/01/2024, 09:00-13:00 (4h)
  Linha 3: 17/01/2024, 14:00-18:00 (4h)
  TOTAL: 16 horas
```

**Cálculo de Horas:**
- Sistema soma todas as linhas automaticamente
- Total é usado para validar horas disponíveis no projeto
- Cliente vê tabela completa no email de aprovação

**Validações:**
- Cada linha deve ter horário de fim > horário de início
- Mínimo: 1 linha
- Recomendado máximo: 30 linhas (para não ficar muito longo)

#### B) CC Emails (Carbon Copy)

**Conceito:**
- Service Sheet tem 1 email principal (`clientContactEmail`)
- Pode ter 0 ou mais emails em cópia (`ccEmails`)
- Todos recebem o mesmo email de aprovação
- **Diferença:** Apenas o email principal pode aprovar

**Exemplo de Uso:**
```json
{
  "clientContactEmail": "gerente@empresa.com",  // Pode aprovar
  "ccEmails": [
    "supervisor@empresa.com",    // Só visualiza
    "diretor@empresa.com",       // Só visualiza
    "financeiro@empresa.com"     // Só visualiza
  ]
}
```

**Envio de Email:**
- TO (Para): gerente@empresa.com
- CC (Cópia): supervisor@, diretor@, financeiro@
- Todos recebem o mesmo email
- Email em CC mostra aviso: "Você não pode aprovar, apenas visualizar"

**Validação de Aprovação:**
- Quando alguém tenta aprovar, sistema pede email de confirmação
- Valida se email é igual ao `clientContactEmail`
- Se for email CC, retorna erro 403: "Você não tem permissão para aprovar"

### 13.3 Impacto na Arquitetura

**Banco de Dados:**
- Nova tabela: `service_sheet_lines`
- Campo removido de `service_sheets`: `service_date`, `start_time`, `end_time`
- Campo adicionado: `cc_emails` (JSONB array)

**Relacionamento:**
- 1 Service Sheet → N Linhas (OneToMany)
- Cascade DELETE: Deletar sheet deleta todas as linhas

**Cálculo de Horas:**
- Antes: `hours = end_time - start_time`
- Agora: `totalHours = sum(todas as linhas)`

**Validação de Projeto:**
- Usa `totalHours` para verificar disponibilidade
- Atualiza `project.usedHours` com total

**Atualização de Service Sheet:**
- Quando atualiza linhas:
  1. Recalcula total de horas antigas
  2. Recalcula total de horas novas
  3. Ajusta `project.usedHours` pela diferença
- Se mudar de projeto:
  1. Subtrai total do projeto antigo
  2. Adiciona total ao projeto novo

**Deleção:**
- Deletar service sheet remove todas as linhas (CASCADE)
- Subtrai total de horas do projeto

### 13.4 Fluxo de Aprovação com CC

**Passo 1: Criação**
```
Técnico cria service sheet com:
- Email principal: joao@cliente.com
- CC: maria@cliente.com, pedro@cliente.com
- 3 linhas de serviço
```

**Passo 2: Email Enviado**
```
TO: joao@cliente.com
CC: maria@cliente.com, pedro@cliente.com
Assunto: Aprovação de Folha de Serviço - Projeto X

Conteúdo:
- Tabela com 3 dias de trabalho
- Total: 16 horas
- Botões: Aprovar | Rejeitar
```

**Passo 3: Tentativa de Aprovação**

**Cenário A - Email Principal:**
```
João abre link → Clica em "Aprovar"
Sistema pede: "Digite seu email para confirmar"
João digita: joao@cliente.com
Sistema valida: ✓ Email autorizado
Status: APPROVED
```

**Cenário B - Email CC:**
```
Maria abre link → Clica em "Aprovar"
Sistema pede: "Digite seu email para confirmar"
Maria digita: maria@cliente.com
Sistema valida: ✗ Email não autorizado
Erro 403: "Apenas joao@cliente.com pode aprovar"
Status: Permanece PENDING
```

### 13.5 Regras de Negócio Importantes

1. **Número de Linhas:**
   - Mínimo: 1 (obrigatório)
   - Máximo sugerido: 30 (para UX do email)
   - Sistema deve aceitar mais se necessário

2. **Ordenação de Linhas:**
   - `lineNumber` é sequencial (1, 2, 3...)
   - Sistema auto-atribui ao criar
   - Ao remover linha, reordena as restantes

3. **CC Emails:**
   - Array pode ser vazio (sem CC)
   - Cada email deve ser válido (validação)
   - Emails duplicados devem ser removidos
   - Normalizar emails (lowercase, trim)

4. **Validação de Aprovador:**
   - Comparação case-insensitive
   - Trim de espaços em branco
   - Mensagem de erro clara para CC

5. **Email Template:**
   - Loop através das linhas
   - Formatar datas (dd/MM/yyyy)
   - Formatar horas (HH:mm)
   - Mostrar total destacado
   - Aviso de CC condicional

6. **Performance:**
   - Ao listar service sheets, usar JOIN FETCH para linhas
   - Evitar N+1 queries
   - Índice em `service_sheet_id` para queries rápidas

### 13.6 Exemplos de Casos de Uso

**Caso 1: Desenvolvimento ao Longo da Semana**
```
Trabalho: Implementação de API REST
Linha 1: Segunda, 4 horas (manhã)
Linha 2: Terça, 8 horas (dia inteiro)
Linha 3: Quarta, 4 horas (tarde)
Total: 16 horas
CC: Product Owner, Tech Lead
```

**Caso 2: Plantão com Múltiplas Intervenções**
```
Trabalho: Suporte técnico emergencial
Linha 1: 10/01, 22:00-23:30 (1.5h)
Linha 2: 11/01, 02:00-03:00 (1h)
Linha 3: 11/01, 14:00-15:30 (1.5h)
Total: 4 horas
CC: Gerente de TI, Coordenador
```

**Caso 3: Trabalho em Múltiplas Localidades**
```
Trabalho: Instalação de equipamentos
Linha 1: Filial A, 15/01, 8 horas
Linha 2: Filial B, 16/01, 6 horas
Linha 3: Filial C, 17/01, 4 horas
Total: 18 horas
CC: Responsável Filial A, B, C
```

---

## 14. NOTAS FINAIS

### Considerações de Segurança

1. **Passwords:**
   - Usar BCrypt para hash (strength 10-12)
   - Nunca retornar password em responses

2. **JWT:**
   - Secret key forte (min 256 bits)
   - Implementar refresh token rotation
   - Invalidar tokens em logout (blacklist ou DB)

3. **Rate Limiting:**
   - Login: 5 tentativas / 15 minutos
   - Endpoints públicos (approval): 10 req/min
   - API geral: 100 req/min por usuário

4. **CORS:**
   - Configurar allowed origins
   - Apenas SITE_URL em produção

5. **SQL Injection:**
   - Usar JPA/PreparedStatements
   - Validar todos os inputs

### Performance

1. **Índices:**
   - Todos os FKs indexados
   - Campos de busca frequente (email, token, status)

2. **Paginação:**
   - Implementar em todos os endpoints de listagem
   - Default: 20 itens por página

3. **Caching:**
   - Considerar cache para projetos (pouco mutável)
   - Spring Cache com Redis

4. **N+1 Queries:**
   - Usar JOIN FETCH para relacionamentos
   - DTOs com MapStruct

### Logging

1. **Operações Críticas:**
   - Login/Logout
   - Criação/Deleção de usuários
   - Aprovação/Rejeição de service sheets
   - Mudanças de role

2. **Erros:**
   - Stack trace completo em logs
   - Mensagem amigável para usuário

### Testes

1. **Unitários:**
   - Services (regras de negócio)
   - Cálculo de horas
   - Validações

2. **Integração:**
   - Controllers
   - Repositories
   - Email service

3. **E2E:**
   - Fluxo completo de aprovação
   - Gerenciamento de horas do projeto

---

## 15. DIFERENÇAS DO SUPABASE

| Funcionalidade | Supabase | Spring Boot |
|----------------|----------|-------------|
| **Autenticação** | auth.users + profiles | profiles (unificado) |
| **RLS** | Row Level Security | @PreAuthorize + filters |
| **Edge Functions** | Deno runtime | Controllers/Services |
| **Real-time** | WebSockets built-in | Implementar separadamente |
| **Storage** | Built-in file storage | S3 ou filesystem |
| **Admin API** | Service Role Key | Role-based endpoints |

---

**Versão:** 1.0
**Última Atualização:** 2024-01-05
**Contato:** [Seu contato aqui]

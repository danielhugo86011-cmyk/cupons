# 🚀 Implementação do Chat em Tempo Real

## ✅ O que foi implementado

### 1. **Backend - API Routes**

#### `/app/api/chat/route.ts`
- **GET**: Busca todas as mensagens do chat único
- **POST**: Envia nova mensagem e emite via Socket.IO
- **PATCH**: Marca mensagens como lidas
- Todas as requisições retornam JSON
- Todas as queries SQL usam MySQL com prepared statements

### 2. **Servidor Socket.IO** (`server.js`)
- Configurado para emitir mensagens em tempo real
- Sala única `chat_unico` para todos os usuários
- Eventos: `join_chat`, `leave_chat`, `nova_mensagem`

### 3. **Banco de Dados**

#### Script SQL: `/scripts/04-create-chat-unico.sql`
```sql
CREATE TABLE IF NOT EXISTS mensagens_chat (
  id INT AUTO_INCREMENT PRIMARY KEY,
  feedback_id INT DEFAULT 1 COMMENT 'ID fixo para chat único',
  remetente ENUM('usuario', 'admin') NOT NULL,
  mensagem TEXT NOT NULL,
  data DATETIME DEFAULT CURRENT_TIMESTAMP,
  lida BOOLEAN DEFAULT FALSE,
  INDEX idx_feedback_id (feedback_id),
  INDEX idx_data (data),
  INDEX idx_lida (lida)
);
```

### 4. **Frontend - Componente Chat** (`/components/chat.tsx`)

#### Recursos:
- ✅ Botão flutuante fixo no canto inferior direito
- ✅ Notificação visual 🔴 quando chega mensagem nova e chat está fechado
- ✅ Design moderno e responsivo
- ✅ Auto-scroll para última mensagem
- ✅ Suporte a Socket.IO em tempo real
- ✅ Indicação de "Você" vs "Suporte"
- ✅ Timestamp em cada mensagem
- ✅ Loading state ao enviar mensagens

## 📦 Como usar

### 1. Execute o script SQL
```bash
mysql -u root -p linux < scripts/04-create-chat-unico.sql
```

### 2. Adicione o componente Chat em qualquer página

#### Exemplo em `/app/layout.tsx`:
```tsx
import Chat from "@/components/chat"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Chat />
      </body>
    </html>
  )
}
```

#### Ou em páginas específicas:
```tsx
import Chat from "@/components/chat"

export default function Page() {
  return (
    <div>
      <h1>Minha Página</h1>
      <Chat />
    </div>
  )
}
```

### 3. Inicie o servidor
```bash
npm run dev
```

## 🔧 Configuração

### Variáveis de ambiente necessárias (`.env`):
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=linux
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🎯 Fluxo de Funcionamento

1. **Usuário abre o chat**: Socket.IO conecta automaticamente
2. **Usuário envia mensagem**:
   - POST `/api/chat` → Salva no MySQL
   - Servidor emite `nova_mensagem` via Socket.IO
   - Todos os clientes conectados recebem a mensagem
3. **Admin responde**:
   - Mesmo fluxo, mas com `remetente = "admin"`
4. **Notificação visual**:
   - Se chat está fechado e chega mensagem nova → Bolinha vermelha 🔴 aparece

## 🔍 Verificação das Rotas API

### Testando via cURL:

#### Buscar mensagens:
```bash
curl http://localhost:3000/api/chat
```

#### Enviar mensagem:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"mensagem":"Olá, preciso de ajuda!"}'
```

## 🐛 Troubleshooting

### Socket.IO não conecta:
1. Verifique se `server.js` está sendo usado: `npm run dev`
2. Verifique console do navegador para erros
3. Confirme que `NEXT_PUBLIC_APP_URL` está correto

### Mensagens não aparecem:
1. Verifique se a tabela `mensagens_chat` existe
2. Confirme que usuário está autenticado
3. Verifique console do servidor para erros SQL

### Notificação não aparece:
1. Verifique se `chatAberto` está false
2. Confirme que `papel` está sendo detectado corretamente

## 📊 Estrutura de Dados JSON

### Mensagem (Response):
```json
{
  "id": 1,
  "remetente": "usuario",
  "mensagem": "Olá!",
  "data": "2025-10-26T10:30:00.000Z",
  "lida": false
}
```

### Enviar mensagem (Request):
```json
{
  "mensagem": "Preciso de ajuda com meu pedido"
}
```

### Lista de mensagens (Response):
```json
{
  "mensagens": [
    {
      "id": 1,
      "remetente": "usuario",
      "mensagem": "Olá!",
      "data": "2025-10-26T10:30:00.000Z",
      "lida": false
    },
    {
      "id": 2,
      "remetente": "admin",
      "mensagem": "Como posso ajudar?",
      "data": "2025-10-26T10:31:00.000Z",
      "lida": false
    }
  ]
}
```

## ✨ Melhorias Futuras (Opcional)

- [ ] Indicador de "digitando..."
- [ ] Suporte a anexos/imagens
- [ ] Notificações push/desktop
- [ ] Histórico paginado para muitas mensagens
- [ ] Som de notificação
- [ ] Status online/offline do suporte
- [ ] Emoji picker

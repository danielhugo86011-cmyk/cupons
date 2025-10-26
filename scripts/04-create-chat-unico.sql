-- Script para criar tabela de chat único entre usuário e admin
-- Chat único sem múltiplos feedbacks (feedback_id fixo = 1)

-- Criar tabela mensagens_chat se não existir
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Atualizar todas as mensagens existentes para usar feedback_id = 1
UPDATE mensagens_chat SET feedback_id = 1 WHERE feedback_id IS NULL OR feedback_id != 1;

SELECT 'Tabela mensagens_chat criada/atualizada com sucesso!' AS status;

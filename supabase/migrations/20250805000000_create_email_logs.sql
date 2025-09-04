-- Migração para criar tabela de logs de email
-- 20250805000000_create_email_logs.sql

-- Criar tabela para logs de emails enviados
CREATE TABLE email_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid REFERENCES sales(id) ON DELETE CASCADE,
    email_type varchar(50) NOT NULL,
    recipient_email varchar(255) NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'pending',
    external_id varchar(255), -- ID do provedor de email (Resend)
    error_message text,
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_email_logs_order_id ON email_logs(order_id);
CREATE INDEX idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_logs_updated_at
    BEFORE UPDATE ON email_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Adicionar comentários
COMMENT ON TABLE email_logs IS 'Log de emails enviados pelo sistema';
COMMENT ON COLUMN email_logs.order_id IS 'ID do pedido relacionado ao email';
COMMENT ON COLUMN email_logs.email_type IS 'Tipo de email: order-confirmation, payment-confirmed, etc.';
COMMENT ON COLUMN email_logs.recipient_email IS 'Email do destinatário';
COMMENT ON COLUMN email_logs.status IS 'Status do envio: pending, sent, failed, delivered, bounced';
COMMENT ON COLUMN email_logs.external_id IS 'ID do provedor de email (Resend, SendGrid, etc.)';
COMMENT ON COLUMN email_logs.error_message IS 'Mensagem de erro em caso de falha';
COMMENT ON COLUMN email_logs.sent_at IS 'Data/hora do envio';

-- Habilitar RLS (Row Level Security)
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Política para admins lerem todos os logs
CREATE POLICY "Admins can view all email logs" ON email_logs
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Política para service role ter acesso completo
CREATE POLICY "Service role full access" ON email_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

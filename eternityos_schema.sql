-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: plans
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    monthly_fee NUMERIC(10,2) NOT NULL,
    max_dependents INT NOT NULL DEFAULT 4,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: holders
CREATE TABLE holders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: dependents
CREATE TABLE dependents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    holder_id UUID NOT NULL REFERENCES holders(id) ON DELETE CASCADE,
    full_name VARCHAR NOT NULL,
    cpf VARCHAR(14),
    relation VARCHAR(50) NOT NULL,
    birth_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: contracts
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    holder_id UUID NOT NULL REFERENCES holders(id),
    plan_id UUID NOT NULL REFERENCES plans(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, grace_period, defaulted, cancelled
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, paid, overdue, cancelled
    payment_method VARCHAR(20), -- pix, boleto, cash
    pix_code TEXT,
    pix_qr_code_url TEXT
);

-- Table: inventory
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL, -- urn, chemical, ornament
    stock_quantity INT NOT NULL DEFAULT 0,
    min_threshold INT NOT NULL DEFAULT 5
);

-- Indexes for foreign keys and frequent search fields
CREATE INDEX idx_dependents_holder_id ON dependents(holder_id);
CREATE INDEX idx_contracts_holder_id ON contracts(holder_id);
CREATE INDEX idx_contracts_plan_id ON contracts(plan_id);
CREATE INDEX idx_payments_contract_id ON payments(contract_id);
CREATE INDEX idx_holders_cpf ON holders(cpf);
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_contracts_status ON contracts(status);

-- Insert sample data

-- Plans
INSERT INTO plans (name, monthly_fee, max_dependents, description) VALUES
('Plano Básico', 100.00, 4, 'Plano básico com assistência funerária essencial e cobertura para até 4 dependentes.'),
('Plano Premium', 250.00, 6, 'Plano premium com ampla cobertura, incluindo velório, traslado e assistência para até 6 dependentes.'),
('Plano Familiar', 400.00, 8, 'Plano familiar com cobertura completa e benefícios adicionais para até 8 dependentes.');

-- Holders
INSERT INTO holders (full_name, cpf, phone, email, address) VALUES
('João Silva', '123.456.789-00', '(11) 98765-4321', 'joao@email.com', 'Rua A, 123, São Paulo, SP'),
('Maria Oliveira', '987.654.321-00', '(11) 91234-5678', 'maria@email.com', 'Rua B, 456, Rio de Janeiro, RJ'),
('Carlos Souza', '111.222.333-44', '(11) 99999-9999', 'carlos@email.com', 'Rua C, 789, Belo Horizonte, MG');

-- Dependents
INSERT INTO dependents (holder_id, full_name, cpf, relation, birth_date) VALUES
-- Dependents for João Silva (holder_id 1)
((SELECT id FROM holders WHERE cpf = '123.456.789-00'), 'Ana Silva', '111.111.111-11', 'Cônjuge', '1980-05-15'),
((SELECT id FROM holders WHERE cpf = '123.456.789-00'), 'Pedro Silva', '222.222.222-22', 'Filho', '2005-08-20'),
-- Dependents for Maria Oliveira (holder_id 2)
((SELECT id FROM holders WHERE cpf = '987.654.321-00'), 'Carlos Oliveira', '333.333.333-33', 'Filho', '2010-12-10'),
((SELECT id FROM holders WHERE cpf = '987.654.321-00'), 'Laura Oliveira', '444.444.444-44', 'Mãe', '1955-03-22'),
-- Dependents for Carlos Souza (holder_id 3)
((SELECT id FROM holders WHERE cpf = '111.222.333-44'), 'Julia Souza', '555.555.555-55', 'Cônjuge', '1978-09-30'),
((SELECT id FROM holders WHERE cpf = '111.222.333-44'), 'Felipe Souza', '666.666.666-66', 'Filho', '2000-11-05');

-- Contracts
INSERT INTO contracts (holder_id, plan_id, status, start_date) VALUES
-- João Silva with Plano Básico
((SELECT id FROM holders WHERE cpf = '123.456.789-00'), (SELECT id FROM plans WHERE name = 'Plano Básico'), 'active', CURRENT_DATE),
-- Maria Oliveira with Plano Premium
((SELECT id FROM holders WHERE cpf = '987.654.321-00'), (SELECT id FROM plans WHERE name = 'Plano Premium'), 'active', CURRENT_DATE),
-- Carlos Souza with Plano Familiar
((SELECT id FROM holders WHERE cpf = '111.222.333-44'), (SELECT id FROM plans WHERE name = 'Plano Familiar'), 'active', CURRENT_DATE);

-- Payments
-- We'll create a few payments for each contract, mixing statuses and dates.
-- Using relative dates for demonstration.
INSERT INTO payments (contract_id, amount, due_date, paid_at, status, payment_method, pix_code, pix_qr_code_url) VALUES
-- Payments for João's contract (first contract)
((SELECT id FROM contracts WHERE holder_id = (SELECT id FROM holders WHERE cpf = '123.456.789-00') LIMIT 1), 100.00, CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE - INTERVAL '25 days', 'paid', 'pix', '00020126580014BR.GOV.BCB.PIX0136joao@email.com5204000053039865802BR5913Joao Silva6009SAO PAULO62070503***6304A8B1', 'https://example.com/pix1.png'),
((SELECT id FROM contracts WHERE holder_id = (SELECT id FROM holders WHERE cpf = '123.456.789-00') LIMIT 1), 100.00, CURRENT_DATE + INTERVAL '10 days', NULL, 'pending', 'boleto', NULL, NULL),
((SELECT id FROM contracts WHERE holder_id = (SELECT id FROM holders WHERE cpf = '123.456.789-00') LIMIT 1), 100.00, CURRENT_DATE - INTERVAL '2 months', NULL, 'overdue', 'pix', '00020126580014BR.GOV.BCB.PIX0136joao@email.com5204000053039865802BR5913Joao Silva6009SAO PAULO62070503***6304A8B2', 'https://example.com/pix2.png'),

-- Payments for Maria's contract (second contract)
((SELECT id FROM contracts WHERE holder_id = (SELECT id FROM holders WHERE cpf = '987.654.321-00') LIMIT 1), 250.00, CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE - INTERVAL '20 days', 'paid', 'pix', '00020126580014BR.GOV.BCB.PIX0136maria@email.com5204000053039865802BR5913Maria Oliveira6009RIO DE JANEIRO62070503***6304B9C2', 'https://example.com/pix3.png'),
((SELECT id FROM contracts WHERE holder_id = (SELECT id FROM holders WHERE cpf = '987.654.321-00') LIMIT 1), 250.00, CURRENT_DATE + INTERVAL '5 days', NULL, 'pending', 'boleto', NULL, NULL),
((SELECT id FROM contracts WHERE holder_id = (SELECT id FROM holders WHERE cpf = '987.654.321-00') LIMIT 1), 250.00, CURRENT_DATE - INTERVAL '3 months', NULL, 'overdue', 'pix', '00020126580014BR.GOV.BCB.PIX0136maria@email.com5204000053039865802BR5913Maria Oliveira6009RIO DE JANEIRO62070503***6304B9C3', 'https://example.com/pix4.png'),

-- Payments for Carlos's contract (third contract)
((SELECT id FROM contracts WHERE holder_id = (SELECT id FROM holders WHERE cpf = '111.222.333-44') LIMIT 1), 400.00, CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE - INTERVAL '15 days', 'paid', 'pix', '00020126580014BR.GOV.BCB.PIX0136carlos@email.com5204000053039865802BR5913Carlos Souza6009BELO HORIZONTE62070503***6304C0D3', 'https://example.com/pix5.png'),
((SELECT id FROM contracts WHERE holder_id = (SELECT id FROM holders WHERE cpf = '111.222.333-44') LIMIT 1), 400.00, CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', 'boleto', NULL, NULL),
((SELECT id FROM contracts WHERE holder_id = (SELECT id FROM holders WHERE cpf = '111.222.333-44') LIMIT 1), 400.00, CURRENT_DATE - INTERVAL '2 months', NULL, 'overdue', 'pix', '00020126580014BR.GOV.BCB.PIX0136carlos@email.com5204000053039865802BR5913Carlos Souza6009BELO HORIZONTE62070503***6304C0D4', 'https://example.com/pix6.png');

-- Inventory
INSERT INTO inventory (item_name, category, stock_quantity, min_threshold) VALUES
('Urna de Madeira Modelo Clássico', 'urna', 15, 5),
('Químico para Conservação 5L', 'químico', 30, 10),
('Flores Artificiais Ramos Brancos', 'ornamento', 50, 20);

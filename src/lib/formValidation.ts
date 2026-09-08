/**
 * Utilitário de validação de formulários com mensagens em PT-BR.
 * Substitui o 'required' nativo do HTML por validação customizada.
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  patternMessage?: string;
  email?: boolean;
  cpf?: boolean;
  cnpj?: boolean;
  phone?: boolean;
  date?: boolean;
  numeric?: boolean;
  min?: number;
  max?: number;
  custom?: (value: string) => string | null;
}

export interface FieldValidation {
  [fieldName: string]: ValidationRule;
}

export interface FieldErrors {
  [fieldName: string]: string;
}

/**
 * Valida um campo individual e retorna a mensagem de erro (ou null se válido).
 */
export function validateField(
  value: string,
  rules: ValidationRule,
  fieldName: string
): string | null {
  const val = (value || "").trim();

  // Required
  if (rules.required && val.length === 0) {
    return `O campo ${fieldName} é obrigatório.`;
  }

  // Se não é obrigatório e está vazio, pula outras validações
  if (val.length === 0) return null;

  // MinLength
  if (rules.minLength && val.length < rules.minLength) {
    return `O campo ${fieldName} deve ter no mínimo ${rules.minLength} caracteres.`;
  }

  // MaxLength
  if (rules.maxLength && val.length > rules.maxLength) {
    return `O campo ${fieldName} deve ter no máximo ${rules.maxLength} caracteres.`;
  }

  // Email
  if (rules.email && val) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) {
      return `Informe um email válido.`;
    }
  }

  // CPF (validação básica de formato)
  if (rules.cpf && val) {
    const cpf = val.replace(/\D/g, "");
    if (cpf.length !== 11) {
      return `O CPF deve ter 11 dígitos.`;
    }
  }

  // CNPJ (validação básica de formato)
  if (rules.cnpj && val) {
    const cnpj = val.replace(/\D/g, "");
    if (cnpj.length !== 14) {
      return `O CNPJ deve ter 14 dígitos.`;
    }
  }

  // Telefone
  if (rules.phone && val) {
    const phone = val.replace(/\D/g, "");
    if (phone.length < 10 || phone.length > 11) {
      return `O telefone deve ter 10 ou 11 dígitos.`;
    }
  }

  // Data
  if (rules.date && val) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(val)) {
      return `Informe uma data válida (AAAA-MM-DD).`;
    }
  }

  // Numérico
  if (rules.numeric && val) {
    if (isNaN(Number(val))) {
      return `O campo ${fieldName} deve ser numérico.`;
    }
  }

  // Min (valor numérico)
  if (rules.min !== undefined && Number(val) < rules.min) {
    return `O valor mínimo é ${rules.min}.`;
  }

  // Max (valor numérico)
  if (rules.max !== undefined && Number(val) > rules.max) {
    return `O valor máximo é ${rules.max}.`;
  }

  // Pattern customizado
  if (rules.pattern && !rules.pattern.test(val)) {
    return rules.patternMessage || `O campo ${fieldName} está em um formato inválido.`;
  }

  // Validação customizada
  if (rules.custom) {
    const customError = rules.custom(val);
    if (customError) return customError;
  }

  return null;
}

/**
 * Valida todos os campos de um formulário.
 * Retorna objeto com os erros encontrados.
 */
export function validateForm(
  values: Record<string, string>,
  validations: FieldValidation
): FieldErrors {
  const errors: FieldErrors = {};

  for (const [field, rules] of Object.entries(validations)) {
    const error = validateField(values[field] || "", rules, getFieldLabel(field));
    if (error) {
      errors[field] = error;
    }
  }

  return errors;
}

/**
 * Retorna o label amigável do campo para mensagens de erro.
 */
function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    full_name: "Nome completo",
    name: "Nome",
    deceased_name: "Nome do falecido",
    holder_name: "Nome do titular",
    partner_name: "Nome do parceiro",
    item_name: "Nome do item",
    description: "Descrição",
    cpf: "CPF",
    cnpj: "CNPJ",
    phone: "Telefone",
    email: "Email",
    plate: "Placa",
    model: "Modelo",
    burial_date: "Data do sepultamento",
    amount: "Valor",
    stock_quantity: "Quantidade em estoque",
    min_threshold: "Estoque mínimo",
    discount_percentage: "Percentual de desconto",
    monthly_fee: "Mensalidade",
    password: "Senha",
    confirm_password: "Confirmação de senha",
  };

  return labels[field] || field;
}

/**
 * Hook helper para gerenciar estado de erros de validação.
 */
export function createInitialErrors(fields: string[]): FieldErrors {
  const errors: FieldErrors = {};
  fields.forEach((f) => (errors[f] = ""));
  return errors;
}

/**
 * Input validation utilities
 * Prevents injection attacks and ensures data integrity
 */

// UUID v4 regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Email regex (RFC 5322 simplified)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Brazilian CPF regex (format: XXX.XXX.XXX-XX or XXXXXXXXXXX)
const CPF_REGEX = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;

// Phone regex (Brazilian format)
const PHONE_REGEX = /^\+?55?\s?\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;

// CNPJ regex (Brazilian format)
const CNPJ_REGEX = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/;

export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value) && value.length <= 254;
}

export function isValidCPF(value: string): boolean {
  return CPF_REGEX.test(value);
}

export function isValidPhone(value: string): boolean {
  return PHONE_REGEX.test(value);
}

export function isValidCNPJ(value: string): boolean {
  return CNPJ_REGEX.test(value);
}

export function sanitizeString(value: string, maxLength: number = 255): string {
  if (!value) return '';
  // Remove potentially dangerous characters
  const sanitized = value
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
  return sanitized.substring(0, maxLength);
}

export function sanitizeHTML(value: string): string {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function isValidDate(value: string): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime()) && value.match(/^\d{4}-\d{2}-\d{2}/) !== null;
}

export function isValidISODate(value: string): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime()) && date.toISOString() === value;
}

export function isValidNumber(value: string | number): boolean {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && isFinite(num);
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function sanitizeCPF(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11);
}

export function sanitizeCNPJ(value: string): string {
  return value.replace(/\D/g, '').slice(0, 14);
}

export function sanitizePhone(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11);
}

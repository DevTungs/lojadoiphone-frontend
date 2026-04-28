/**
 * Formats a numeric value as US Dollar (USD).
 * Example: 1999.90 -> "$ 1,999.90"
 */
export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '$ 0.00';
  }
  
  const formatted = numValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `$ ${formatted}`;
}

/**
 * Formats a raw digit string as a Brazilian phone number.
 * Supports both 8-digit (landline) and 9-digit (mobile) local numbers.
 * Examples:
 *   "11987654321"  -> "(11) 98765-4321"
 *   "1132345678"   -> "(11) 3234-5678"
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 11) {
    // Mobile: (XX) 9XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    // Landline: (XX) XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  // Return original if it doesn't match expected lengths
  return phone;
}

/**
 * Formats an ISO date string as a localised Brazilian date/time.
 * Example: "2024-06-15T14:30:00Z" -> "15/06/2024, 14:30"
 */
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Returns a human-readable label for a given order status code.
 */
export function getOrderStatusLabel(status: number): string {
  const labels: Record<number, string> = {
    0: 'Cancelado',
    1: 'Pedido Realizado',
    2: 'Aguardando Recibo PIX',
    3: 'Pagamento Confirmado',
    4: 'Aguardando Coleta',
    5: 'Finalizado',
  };
  return labels[status] ?? 'Desconhecido';
}

/**
 * Returns a CSS custom-property color string for a given order status code.
 * These map to the semantic color tokens defined in tokens.css.
 */
export function getOrderStatusColor(status: number): string {
  const colors: Record<number, string> = {
    0: 'var(--red-500)',     // Cancelado
    1: 'var(--blue-500)',    // Pedido realizado
    2: 'var(--yellow-500)',  // Aguardando recibo PIX
    3: 'var(--mint)',        // Pagamento confirmado
    4: 'var(--mint)',        // Pedido em separação
    5: 'var(--green-500)',   // Finalizado
  };
  return colors[status] ?? 'var(--gray-400)';
}

/**
 * Returns up to two uppercase initials from a full name.
 * Example: "João da Silva" -> "JS"
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

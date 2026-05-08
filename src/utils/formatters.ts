// Format currency (BRL default)
export const formatCurrency = (
  value: number,
  currency: 'BRL' | 'USD' = 'BRL'
): string => {
  return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency
  }).format(value);
};

// Format number with decimals
export const formatNumber = (
  value: number,
  decimals: number = 2
): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

// Format percentage
export const formatPercent = (value: number, decimals: number = 2): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatNumber(value, decimals)}%`;
};

// Format date (Brazilian format)
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

// Format date with time
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Format relative time (e.g., "há 5 minutos")
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
  if (diffHours < 24) return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;

  return formatDate(dateString);
};

// Format large numbers (e.g., 1.5M, 2.3K)
export const formatCompact = (value: number, currency: 'BRL' | 'USD' = 'BRL'): string => {
  if (Math.abs(value) >= 1000000) {
    return `${currency === 'BRL' ? 'R$' : '$'}${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `${currency === 'BRL' ? 'R$' : '$'}${(value / 1000).toFixed(1)}K`;
  }
  return formatCurrency(value, currency);
};

// Get color class based on value (positive/negative)
export const getPnLColor = (value: number): string => {
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-gray-600';
};

// Get background color class based on value
export const getPnLBgColor = (value: number): string => {
  if (value > 0) return 'bg-green-100';
  if (value < 0) return 'bg-red-100';
  return 'bg-gray-100';
};

// Get Graham status label
export const getGrahamStatusLabel = (status: 'barato' | 'justo' | 'caro'): string => {
  switch (status) {
    case 'barato':
      return 'Barato';
    case 'justo':
      return 'Preço Justo';
    case 'caro':
      return 'Caro';
  }
};

// Get Graham status color
export const getGrahamStatusColor = (status: 'barato' | 'justo' | 'caro'): string => {
  switch (status) {
    case 'barato':
      return 'text-green-600 bg-green-100';
    case 'justo':
      return 'text-yellow-600 bg-yellow-100';
    case 'caro':
      return 'text-red-600 bg-red-100';
  }
};

// Truncate text with ellipsis
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
};

// Validate Brazilian stock symbol
export const isValidB3Symbol = (symbol: string): boolean => {
  return /^[A-Z]{4}[34]$/.test(symbol);
};

// Validate US stock symbol
export const isValidUSSymbol = (symbol: string): boolean => {
  return /^[A-Z]{1,5}$/.test(symbol);
};

// Parse Brazilian date input
export const parseDateInput = (input: string): Date | null => {
  // Try DD/MM/YYYY format
  const parts = input.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) return date;
    }
  }

  // Try YYYY-MM-DD format
  const isoDate = new Date(input);
  if (!isNaN(isoDate.getTime())) return isoDate;

  return null;
};

// Format date for input (YYYY-MM-DD)
export const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
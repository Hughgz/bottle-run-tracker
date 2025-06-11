/**
 * Format a number as Vietnamese currency (VND)
 * @param price - The price to format
 * @param options - Formatting options
 * @returns Formatted price string
 */
export const formatPrice = (
  price: number, 
  options: { 
    showSymbol?: boolean, 
    showDecimal?: boolean 
  } = { 
    showSymbol: true, 
    showDecimal: false 
  }
): string => {
  const formatter = new Intl.NumberFormat('vi-VN', {
    style: options.showSymbol ? 'currency' : 'decimal',
    currency: 'VND',
    minimumFractionDigits: options.showDecimal ? 2 : 0,
    maximumFractionDigits: options.showDecimal ? 2 : 0,
  });

  return formatter.format(price);
};

/**
 * Format a date string to Vietnamese format (DD/MM/YYYY)
 * @param dateString - The date string to format
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
}; 
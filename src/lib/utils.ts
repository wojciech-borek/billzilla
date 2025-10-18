import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format amount as currency with proper symbol and formatting
 * @param amount - The amount to format
 * @param currencyCode - ISO currency code (e.g., 'USD', 'EUR', 'PLN')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback if currency code is invalid
    return `${amount.toFixed(2)} ${currencyCode}`;
  }
}

/**
 * Get color class based on balance value
 * @param balance - The balance amount
 * @returns Tailwind color class
 */
export function getBalanceColor(balance: number): string {
  if (balance > 0) return 'text-green-600 dark:text-green-400';
  if (balance < 0) return 'text-red-600 dark:text-red-400';
  return 'text-gray-600 dark:text-gray-400';
}

/**
 * Get initials from full name
 * @param fullName - The full name
 * @returns Initials (max 2 characters)
 */
export function getInitials(fullName: string | null): string {
  if (!fullName) return '?';
  
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
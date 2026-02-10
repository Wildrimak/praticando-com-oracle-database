import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * @description Merges Tailwind CSS class names with conflict resolution.
 * Combines clsx (conditional classes) with tailwind-merge (deduplication).
 * @param {...ClassValue[]} inputs - Class values (strings, arrays, objects)
 * @returns {string} Merged class string
 * @example cn("px-2 py-1", isActive && "bg-oracle-500", "px-4") // "py-1 bg-oracle-500 px-4"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

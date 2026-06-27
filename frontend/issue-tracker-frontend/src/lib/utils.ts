// ─── lib/utils.ts ─────────────────────────────────────────────────────────────
// Small utility helpers used across the app.
// ─────────────────────────────────────────────────────────────────────────────

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// cn() — the standard shadcn/ui utility for merging Tailwind classes.
// It combines clsx (conditional classes) with tailwind-merge (deduplication),
// so you can write: cn("px-4", condition && "text-red-500", "px-2")
// and get the correct result ("text-red-500 px-2") instead of conflicting classes.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format a date string for display on cards ("Jun 27, 2026")
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Capitalise the first letter of a string
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Convert "in_progress" → "In Progress" for display labels
export function formatStatus(status: string): string {
  return status
    .split("_")
    .map(capitalize)
    .join(" ");
}
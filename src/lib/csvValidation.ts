import { z } from "zod";

/**
 * Validation helpers for CSV imports
 * Provides simple, non-intrusive validation to catch common import errors
 */

export type ValidationWarning = {
  row: number;
  field: string;
  value: string;
  issue: string;
  severity: "warning" | "error";
};

/**
 * Validates a date string and checks if it's in a reasonable range
 */
export function validateDateField(
  value: string | null | undefined,
  fieldName: string,
  rowIndex: number
): ValidationWarning | null {
  if (!value || value.trim() === "") return null;

  // Check if it looks like a URL or email (common mistake)
  if (value.includes("http") || value.includes("@")) {
    return {
      row: rowIndex,
      field: fieldName,
      value,
      issue: "Ce champ ressemble à une URL ou un email, pas à une date",
      severity: "error",
    };
  }

  // Try to parse the date
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return {
      row: rowIndex,
      field: fieldName,
      value,
      issue: "Format de date invalide",
      severity: "error",
    };
  }

  // Check if date is in a reasonable range (1950 - current year + 20)
  const year = date.getFullYear();
  const currentYear = new Date().getFullYear();
  
  if (year < 1950) {
    return {
      row: rowIndex,
      field: fieldName,
      value,
      issue: `Année ${year} semble trop ancienne (< 1950)`,
      severity: "warning",
    };
  }

  if (year > currentYear + 20) {
    return {
      row: rowIndex,
      field: fieldName,
      value,
      issue: `Année ${year} semble trop récente (> ${currentYear + 20})`,
      severity: "warning",
    };
  }

  // For birth dates specifically, warn if age would be > 100 or < 5
  if (fieldName.toLowerCase().includes("birth") || fieldName.toLowerCase().includes("naissance")) {
    const age = currentYear - year;
    if (age > 100) {
      return {
        row: rowIndex,
        field: fieldName,
        value,
        issue: `Âge calculé (${age} ans) semble trop élevé`,
        severity: "warning",
      };
    }
    if (age < 5) {
      return {
        row: rowIndex,
        field: fieldName,
        value,
        issue: `Âge calculé (${age} ans) semble trop faible`,
        severity: "warning",
      };
    }
  }

  return null;
}

/**
 * Validates a URL field
 */
export function validateUrlField(
  value: string | null | undefined,
  fieldName: string,
  rowIndex: number
): ValidationWarning | null {
  if (!value || value.trim() === "") return null;

  // Check if it looks like a date (common mistake)
  const datePattern = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/;
  if (datePattern.test(value)) {
    return {
      row: rowIndex,
      field: fieldName,
      value,
      issue: "Ce champ ressemble à une date, pas à une URL",
      severity: "error",
    };
  }

  // Check if it's a valid URL format
  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    return {
      row: rowIndex,
      field: fieldName,
      value,
      issue: "L'URL devrait commencer par http:// ou https://",
      severity: "warning",
    };
  }

  // Basic URL validation
  try {
    new URL(value);
  } catch {
    return {
      row: rowIndex,
      field: fieldName,
      value,
      issue: "Format d'URL invalide",
      severity: "error",
    };
  }

  return null;
}

/**
 * Validates an email field
 */
export function validateEmailField(
  value: string | null | undefined,
  fieldName: string,
  rowIndex: number
): ValidationWarning | null {
  if (!value || value.trim() === "") return null;

  // Check if it looks like a URL (common mistake)
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return {
      row: rowIndex,
      field: fieldName,
      value,
      issue: "Ce champ ressemble à une URL, pas à un email",
      severity: "error",
    };
  }

  // Check if it looks like a date
  const datePattern = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/;
  if (datePattern.test(value)) {
    return {
      row: rowIndex,
      field: fieldName,
      value,
      issue: "Ce champ ressemble à une date, pas à un email",
      severity: "error",
    };
  }

  // Basic email validation
  const emailSchema = z.string().email();
  const result = emailSchema.safeParse(value);
  
  if (!result.success) {
    return {
      row: rowIndex,
      field: fieldName,
      value,
      issue: "Format d'email invalide",
      severity: "error",
    };
  }

  return null;
}

/**
 * Validates a text field for common mistakes
 */
export function validateTextField(
  value: string | null | undefined,
  fieldName: string,
  rowIndex: number,
  maxLength: number = 200
): ValidationWarning | null {
  if (!value || value.trim() === "") return null;

  // Check if it looks like a URL
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return {
      row: rowIndex,
      field: fieldName,
      value,
      issue: "Ce champ contient une URL, vérifiez qu'il s'agit du bon champ",
      severity: "warning",
    };
  }

  // Check if it looks like an email
  if (value.includes("@") && value.includes(".")) {
    const parts = value.split("@");
    if (parts.length === 2 && parts[1].includes(".")) {
      return {
        row: rowIndex,
        field: fieldName,
        value,
        issue: "Ce champ contient un email, vérifiez qu'il s'agit du bon champ",
        severity: "warning",
      };
    }
  }

  // Check length
  if (value.length > maxLength) {
    return {
      row: rowIndex,
      field: fieldName,
      value: value.substring(0, 50) + "...",
      issue: `Texte trop long (${value.length} caractères, max ${maxLength})`,
      severity: "warning",
    };
  }

  return null;
}

/**
 * Display validation warnings to the user
 */
export function formatValidationWarnings(warnings: ValidationWarning[]): string {
  if (warnings.length === 0) return "";

  const errors = warnings.filter((w) => w.severity === "error");
  const warningsOnly = warnings.filter((w) => w.severity === "warning");

  let message = "";

  if (errors.length > 0) {
    message += `❌ ${errors.length} erreur(s) détectée(s) :\n`;
    errors.slice(0, 5).forEach((e) => {
      message += `  • Ligne ${e.row + 1}, champ "${e.field}": ${e.issue}\n`;
    });
    if (errors.length > 5) {
      message += `  ... et ${errors.length - 5} autre(s) erreur(s)\n`;
    }
  }

  if (warningsOnly.length > 0) {
    message += `\n⚠️ ${warningsOnly.length} avertissement(s) :\n`;
    warningsOnly.slice(0, 3).forEach((w) => {
      message += `  • Ligne ${w.row + 1}, champ "${w.field}": ${w.issue}\n`;
    });
    if (warningsOnly.length > 3) {
      message += `  ... et ${warningsOnly.length - 3} autre(s) avertissement(s)\n`;
    }
  }

  return message;
}

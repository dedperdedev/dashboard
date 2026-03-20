import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Санитизирует имя пользователя, удаляя проблемные символы
 * Удаляет клинописные символы, невидимые символы и другие проблемные Unicode символы
 */
export function sanitizeUserName(name: string | null | undefined): string {
  if (!name) return '';
  
  // Удаляем проблемные символы по одному
  let sanitized = name;
  
  // Удаляем клинописные символы (U+12000-U+123FF, U+12400-U+1247F) через суррогатные пары
  sanitized = sanitized.replace(/[\uD808-\uD80B][\uDC00-\uDFFF]/g, '');
  
  // Удаляем невидимые символы и символы форматирования
  sanitized = sanitized.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '');
  
  // Удаляем символы управления
  sanitized = sanitized.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  
  // Удаляем эмодзи (основные диапазоны)
  sanitized = sanitized.replace(/[\uD83C-\uD83E][\uDC00-\uDFFF]/g, '');
  
  // Ограничиваем длину
  sanitized = sanitized.substring(0, 100).trim();
  
  return sanitized;
}

/**
 * Получает отображаемое имя пользователя с fallback
 */
export function getDisplayName(fullName: string | null | undefined, username: string | null | undefined, userId?: number | string): string {
  const sanitizedFullName = sanitizeUserName(fullName);
  
  // Если после санитизации осталось что-то - используем это
  if (sanitizedFullName) {
    return sanitizedFullName;
  }
  
  // Пытаемся использовать username
  if (username) {
    const sanitizedUsername = sanitizeUserName(username);
    if (sanitizedUsername) {
      return sanitizedUsername;
    }
  }
  
  // Если есть userId - показываем его
  if (userId) {
    return `@user_${userId}`;
  }
  
  // В крайнем случае - "Не указано"
  return 'Не указано';
}

/**
 * Получает безопасный первый символ для аватара
 */
export function getSafeInitial(name: string | null | undefined, username?: string | null): string {
  const sanitized = sanitizeUserName(name);
  
  if (sanitized) {
    // Берем первый символ, проверяем что это валидный символ
    const firstChar = sanitized[0];
    if (firstChar) {
      const codePoint = firstChar.codePointAt(0);
      // Проверяем, что это не суррогатная пара и не эмодзи
      if (codePoint && codePoint < 0xD800 || codePoint > 0xDFFF) {
        // Проверяем, что это буква или цифра
        if (/[a-zA-Z0-9А-Яа-я]/.test(firstChar)) {
          return firstChar.toUpperCase();
        }
      }
    }
  }
  
  // Если нет имени или первый символ проблемный, используем username
  if (username) {
    const sanitizedUsername = sanitizeUserName(username);
    if (sanitizedUsername.length > 1) {
      const char = sanitizedUsername[1];
      if (/[a-zA-Z0-9А-Яа-я]/.test(char)) {
        return char.toUpperCase();
      }
    }
    if (sanitizedUsername.length > 0) {
      const char = sanitizedUsername[0];
      if (/[a-zA-Z0-9А-Яа-я]/.test(char)) {
        return char.toUpperCase();
      }
    }
  }
  
  return 'U';
}
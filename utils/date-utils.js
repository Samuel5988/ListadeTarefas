/**
 * Date Utilities - Utilitários para formatação e manipulação de datas
 * @author Lista de Tarefas App
 * @version 1.0.0
 */

import { logger } from './logger.js';

/**
 * Formata data ISO para formato amigável pt-BR
 * @param {string} isoString - Data em formato ISO
 * @returns {string} Data formatada
 * @example
 * formatDateFriendly('2025-12-25T14:30:00') // '25/12/2025 às 14:30'
 */
export function formatDateFriendly(isoString) {
    if (!isoString) return '';

    try {
        const date = new Date(isoString);

        // Verificar se é data válida
        if (isNaN(date.getTime())) {
            logger.warn('Invalid date string:', isoString);
            return '';
        }

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${day}/${month}/${year} às ${hours}:${minutes}`;
    } catch (error) {
        logger.error('Error formatting date:', error);
        return '';
    }
}

/**
 * Verifica se a data é hoje
 * @param {string} isoString - Data em formato ISO
 * @returns {boolean}
 */
export function isToday(isoString) {
    if (!isoString) return false;

    try {
        const date = new Date(isoString);
        const today = new Date();

        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    } catch (error) {
        logger.error('Error checking if date is today:', error);
        return false;
    }
}

/**
 * Verifica se a data é amanhã
 * @param {string} isoString - Data em formato ISO
 * @returns {boolean}
 */
export function isTomorrow(isoString) {
    if (!isoString) return false;

    try {
        const date = new Date(isoString);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        return (
            date.getDate() === tomorrow.getDate() &&
            date.getMonth() === tomorrow.getMonth() &&
            date.getFullYear() === tomorrow.getFullYear()
        );
    } catch (error) {
        logger.error('Error checking if date is tomorrow:', error);
        return false;
    }
}

/**
 * Verifica se a data está no passado (incluindo hoje com hora já passada)
 * @param {string} isoString - Data em formato ISO
 * @returns {boolean} true se data/hora já passou em relação ao momento atual
 * @note Usa timezone do navegador para comparação - pode fazer discrepâncias se usuário viajar entre timezones
 */
export function isPast(isoString) {
    if (!isoString) return false;

    try {
        const date = new Date(isoString);
        const now = new Date();

        return date < now;
    } catch (error) {
        logger.error('Error checking if date is past:', error);
        return false;
    }
}

/**
 * Retorna rótulo relativo da data (Hoje, Amanhã, etc.)
 * @param {string} isoString - Data em formato ISO
 * @returns {string} Rótulo relativo ou vazio
 */
export function getRelativeDateLabel(isoString) {
    if (!isoString) return '';

    if (isToday(isoString)) return 'Hoje';
    if (isTomorrow(isoString)) return 'Amanhã';
    if (isPast(isoString)) return 'Vencida';

    return '';
}

/**
 * Formata data com rótulo relativo + data completa
 * @param {string} isoString - Data em formato ISO
 * @returns {string} Data formatada com rótulo
 * @example
 * formatDateWithLabel('2025-12-25T14:30:00') // '25/12/2025 às 14:30'
 * formatDateWithLabel(hojeIso) // 'Hoje às 14:30'
 */
export function formatDateWithLabel(isoString) {
    if (!isoString) return '';

    const label = getRelativeDateLabel(isoString);
    const formattedDate = formatDateFriendly(isoString);

    if (label) {
        // Extrair apenas hora se for hoje/amanhã
        const date = new Date(isoString);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        if (label === 'Hoje' || label === 'Amanhã') {
            return `${label} às ${hours}:${minutes}`;
        }

        return `${label} (${formattedDate})`;
    }

    return formattedDate;
}

/**
 * Adiciona horas a uma data
 * @param {string|Date} date - Data base
 * @param {number} hours - Horas a adicionar
 * @returns {string} Nova data em formato ISO
 */
export function addHours(date, hours) {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result.toISOString();
}

/**
 * Adiciona dias a uma data
 * @param {string|Date} date - Data base
 * @param {number} days - Dias a adicionar
 * @returns {string} Nova data em formato ISO
 */
export function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString();
}

/**
 * Define hora específica para uma data
 * @param {string|Date} date - Data base
 * @param {number} hour - Hora a definir (0-23)
 * @returns {string} Nova data em formato ISO
 */
export function setHour(date, hour) {
    const result = new Date(date);
    result.setHours(hour, 0, 0, 0);
    return result.toISOString();
}

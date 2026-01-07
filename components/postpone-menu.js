/**
 * Postpone Menu Component - Menu de adiamento de lembretes
 * @author Lista de Tarefas App
 * @version 1.0.0
 */

import { addHours, addDays, setHour } from '../utils/date-utils.js';
import { taskStorage } from '../services/task-storage.js';
import { reminderChecker } from '../services/reminder-checker.js';
import { logger } from '../utils/logger.js';
import { toast } from '../utils/toast-manager.js';

/**
 * Componente de menu de adiamento de lembretes
 */
export class PostponeMenu {
    /**
     * Cria uma instância de PostponeMenu
     * @param {string} taskId - ID da tarefa
     * @param {string} currentDueDate - Data atual de vencimento (ISO string)
     * @param {Function} onPostpone - Callback ao adiar com sucesso
     * @param {Function} onCancel - Callback ao cancelar/desfazer
     */
    constructor(taskId, currentDueDate, onPostpone, onCancel) {
        if (!taskId) {
            throw new Error('PostponeMenu requires taskId');
        }
        if (!currentDueDate) {
            throw new Error('PostponeMenu requires currentDueDate');
        }

        this.taskId = taskId;
        this.currentDueDate = currentDueDate;
        this.onPostpone = onPostpone;
        this.onCancel = onCancel;
        this.element = null;
        this.undoTimeoutId = null;

        logger.debug('PostponeMenu created', { taskId, currentDueDate });
    }

    /**
     * Opções de adiamento pré-definidas
     * @returns {Array} Lista de opções com label, value e função calculate
     */
    getPostponeOptions() {
        const now = new Date();
        const tomorrow9am = setHour(addDays(now, 1), 9);
        const nextWeek = addDays(now, 7);

        return [
            {
                label: '1 hora',
                value: '1h',
                calculate: () => addHours(this.currentDueDate, 1)
            },
            {
                label: '3 horas',
                value: '3h',
                calculate: () => addHours(this.currentDueDate, 3)
            },
            {
                label: 'Amanhã (9h)',
                value: 'tomorrow',
                calculate: () => tomorrow9am
            },
            {
                label: 'Semana que vem',
                value: 'week',
                calculate: () => nextWeek
            }
        ];
    }

    /**
     * Renderiza o menu de adiamento
     * @returns {HTMLElement} Elemento DOM do menu
     */
    render() {
        const menu = document.createElement('div');
        menu.className = 'postpone-menu';
        menu.setAttribute('role', 'menu');
        menu.setAttribute('aria-label', 'Opções de adiamento de lembrete');

        const options = this.getPostponeOptions();
        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'postpone-menu__option';
            button.setAttribute('role', 'menuitem');
            button.setAttribute('data-value', option.value);
            button.textContent = option.label;
            button.addEventListener('click', () => {
                this.handlePostpone(option);
            });
            menu.appendChild(button);
        });

        this.element = menu;
        logger.debug('PostponeMenu rendered', { taskId: this.taskId });
        return menu;
    }

    /**
     * Manipula o adiamento da tarefa
     * @param {Object} option - Opção selecionada
     */
    async handlePostpone(option) {
        try {
            const newDate = option.calculate();
            const originalDate = this.currentDueDate;

            // Atualizar a tarefa
            const result = await taskStorage.update(this.taskId, { dueDate: newDate });

            if (result) {
                logger.info('Task postponed', {
                    taskId: this.taskId,
                    option: option.label,
                    newDate
                });

                // Atualizar contador de lembretes
                await reminderChecker.updateReminderCount();

                // Mostrar notificação de undo
                this.showUndoNotification(originalDate);

                // Callback de sucesso
                if (this.onPostpone) {
                    this.onPostpone(newDate, originalDate);
                }

                // Fechar menu
                this.destroy();
            } else {
                logger.error('Failed to postpone task', { taskId: this.taskId });
                toast.error('Erro ao adiar lembrete. Tente novamente.');
            }
        } catch (error) {
            logger.error('Error postponing task', error);
            toast.error('Erro ao adiar lembrete. Tente novamente.');
        }
    }

    /**
     * Mostra notificação com opção de undo
     * @param {string} originalDate - Data original para desfazer
     */
    showUndoNotification(originalDate) {
        // Remover notificação anterior se existir
        const existingNotification = document.querySelector('.postpone-undo-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = 'postpone-undo-notification';
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        notification.innerHTML = `
            <span>Lembrete adiado</span>
            <button class="postpone-undo-btn" type="button">Desfazer</button>
        `;

        document.body.appendChild(notification);

        const undoBtn = notification.querySelector('.postpone-undo-btn');
        this.undoTimeoutId = setTimeout(() => {
            notification.remove();
        }, 5000); // 5 segundos

        undoBtn.addEventListener('click', () => {
            if (this.undoTimeoutId) {
                clearTimeout(this.undoTimeoutId);
            }
            this.undoPostpone(originalDate);
            notification.remove();
        });

        logger.debug('Undo notification shown', { taskId: this.taskId });
    }

    /**
     * Desfaz o adiamento
     * @param {string} originalDate - Data original a restaurar
     */
    async undoPostpone(originalDate) {
        try {
            const result = await taskStorage.update(this.taskId, { dueDate: originalDate });

            if (result) {
                logger.info('Task postpone undone', {
                    taskId: this.taskId,
                    restoredDate: originalDate
                });

                // Atualizar contador de lembretes
                await reminderChecker.updateReminderCount();

                // Callback de cancelamento
                if (this.onCancel) {
                    this.onCancel(originalDate);
                }
            } else {
                logger.error('Failed to undo postpone', { taskId: this.taskId });
                toast.error('Erro ao desfazer adiamento. Tente novamente.');
            }
        } catch (error) {
            logger.error('Error undoing postpone', error);
            toast.error('Erro ao desfazer adiamento. Tente novamente.');
        }
    }

    /**
     * Posiciona o menu próximo a um elemento
     * @param {HTMLElement} targetElement - Elemento de referência
     */
    positionMenu(targetElement) {
        if (!this.element || !targetElement) return;

        const rect = targetElement.getBoundingClientRect();
        this.element.style.position = 'fixed';
        this.element.style.top = `${rect.bottom + 5}px`;
        this.element.style.left = `${rect.left}px`;

        logger.debug('PostponeMenu positioned', { taskId: this.taskId });
    }

    /**
     * Remove o menu
     */
    destroy() {
        if (this.undoTimeoutId) {
            clearTimeout(this.undoTimeoutId);
            this.undoTimeoutId = null;
        }

        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }

        this.element = null;
        logger.debug('PostponeMenu destroyed', { taskId: this.taskId });
    }
}

/**
 * Fecha todos os menus de adiamento abertos
 */
export function closeAllPostponeMenus() {
    document.querySelectorAll('.postpone-menu').forEach(menu => {
        menu.remove();
    });
    logger.debug('All postpone menus closed');
}

export default PostponeMenu;

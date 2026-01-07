/**
 * Reminder Checker - Verificação periódica de lembretes de tarefas
 * @author Lista de Tarefas App
 * @version 1.0.0
 */

import { logger } from '../utils/logger.js';
import { isPast, isToday } from '../utils/date-utils.js';
import { taskStorage } from './task-storage.js';
import { toast } from '../utils/toast-manager.js';

/**
 * Gerenciador de verificação de lembretes
 * Verifica periodicamente se há tarefas com lembretes que devem ser ativados
 */
export class ReminderChecker {
    constructor() {
        this.checkInterval = null;
        this.intervalMs = 60000; // 1 minuto
        this.trackedReminders = new Set(); // Evitar notificações duplicadas
        this.isActive = false;

        // Bind métodos
        this.checkReminders = this.checkReminders.bind(this);
    }

    /**
     * Inicia a verificação periódica de lembretes
     */
    start() {
        if (this.isActive) {
            logger.warn('ReminderChecker already active');
            return;
        }

        logger.info('Starting ReminderChecker...');

        // Verificar imediatamente ao iniciar
        this.checkReminders();

        // Configurar verificação periódica
        this.checkInterval = setInterval(this.checkReminders, this.intervalMs);
        this.isActive = true;

        logger.info('ReminderChecker started', {
            interval: `${this.intervalMs / 1000}s`
        });
    }

    /**
     * Para a verificação periódica
     */
    stop() {
        if (!this.isActive) {
            return;
        }

        logger.info('Stopping ReminderChecker...');

        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }

        this.isActive = false;
        this.trackedReminders.clear();

        logger.info('ReminderChecker stopped');
    }

    /**
     * Verifica todas as tarefas para lembretes que devem ser ativados
     */
    async checkReminders() {
        try {
            // Obter todas as tarefas
            const allTasks = await taskStorage.getAll();

            // Filtrar apenas tarefas com lembrete e não concluídas
            const tasksWithReminders = allTasks.filter(task =>
                task.dueDate &&
                !task.completed &&
                !this.trackedReminders.has(task.id)
            );

            if (tasksWithReminders.length === 0) {
                logger.debug('No reminders to check');
                return;
            }

            logger.debug(`Checking ${tasksWithReminders.length} reminders`);

            // Verificar cada tarefa
            const newlyActivated = [];

            for (const task of tasksWithReminders) {
                if (isPast(task.dueDate)) {
                    // Lembrete acabou de vencer
                    newlyActivated.push(task);
                    this.trackedReminders.add(task.id);

                    // Dispatch evento para TaskCard
                    window.dispatchEvent(new CustomEvent('reminder:activated', {
                        detail: { taskId: task.id }
                    }));

                    // Exibir notificação toast
                    toast.warning(
                        `Lembrete: "${task.title}" venceu!`,
                        { duration: 5000 }
                    );

                    logger.info('Reminder activated', { taskId: task.id, title: task.title });
                }
            }

            // Calcular contador de lembretes vencidos (overdue)
            const overdueReminders = allTasks.filter(task =>
                task.dueDate &&
                isPast(task.dueDate) &&
                !task.completed
            ).length;

            // Dispatch evento com contador atualizado
            window.dispatchEvent(new CustomEvent('reminder:count-update', {
                detail: { count: overdueReminders }
            }));

            if (newlyActivated.length > 0) {
                logger.info('Reminders activated', {
                    count: newlyActivated.length,
                    todayCount: todayReminders
                });
            }

        } catch (error) {
            logger.error('Error checking reminders', error);
        }
    }

    /**
     * Remove tarefa do tracking (quando marcada como completed)
     * @param {string} taskId - ID da tarefa
     */
    untrackReminder(taskId) {
        this.trackedReminders.delete(taskId);
        logger.debug('Reminder untracked', { taskId });
    }

    /**
     * Reinicia o tracking de todos os lembretes
     */
    resetTracking() {
        this.trackedReminders.clear();
        logger.info('Reminder tracking reset');
    }

    /**
     * Atualiza apenas o contador de lembretes (sem ativar notificações)
     * Método público para ser chamado após modificações nas tarefas
     */
    async updateReminderCount() {
        try {
            const allTasks = await taskStorage.getAll();

            const todayReminders = allTasks.filter(task =>
                task.dueDate &&
                isToday(task.dueDate) &&
                !task.completed
            ).length;

            window.dispatchEvent(new CustomEvent('reminder:count-update', {
                detail: { count: todayReminders }
            }));

            logger.debug('Reminder count updated', { count: todayReminders });
        } catch (error) {
            logger.error('Error updating reminder count', error);
        }
    }

    /**
     * Retorna status atual
     */
    getStatus() {
        return {
            isActive: this.isActive,
            trackedCount: this.trackedReminders.size,
            intervalMs: this.intervalMs
        };
    }
}

// Instância global
export const reminderChecker = new ReminderChecker();

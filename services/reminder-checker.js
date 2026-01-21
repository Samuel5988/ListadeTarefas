/**
 * Reminder Checker - Verificação periódica de lembretes de tarefas
 * @author Lista de Tarefas App
 * @version 1.1.0
 */

import { logger } from '../utils/logger.js';
import { isPast, isToday } from '../utils/date-utils.js';
import { taskStorage } from './task-storage.js';
import { toast } from '../utils/toast-manager.js';
import { soundService } from './sound-service.js';

/**
 * Gerenciador de verificação de lembretes
 * Verifica periodicamente se há tarefas com lembretes que devem ser ativados
 * Usa Page Visibility API para garantir verificação quando aba volta a ficar ativa
 */
export class ReminderChecker {
    constructor() {
        this.checkInterval = null;
        this.intervalMs = 10000; // 10 segundos (reduzido para melhor responsividade)
        this.trackedReminders = new Set(); // Evitar notificações duplicadas
        this.isActive = false;
        this.lastCheckTime = null;

        // Bind métodos
        this.checkReminders = this.checkReminders.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
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

        // Configurar listener de visibilidade da página
        // Isso garante que quando a aba voltar a ficar ativa, verifiquemos lembretes
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', this.handleVisibilityChange);
        }

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

        // Remover listener de visibilidade
        if (typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        }

        this.isActive = false;
        this.trackedReminders.clear();
        this.lastCheckTime = null;

        logger.info('ReminderChecker stopped');
    }

    /**
     * Manipula mudança de visibilidade da página
     * Quando a aba volta a ficar visível, verifica lembretes imediatamente
     * Isso garante que lembretes não sejam perdidos quando a aba estava inativa
     */
    handleVisibilityChange() {
        if (!document.hidden) {
            // Página voltou a ficar visível
            logger.info('Page became visible, checking reminders...');

            // Verificar quanto tempo passou desde a última verificação
            const now = Date.now();
            const timeSinceLastCheck = this.lastCheckTime ? (now - this.lastCheckTime) : null;

            logger.info('Time since last check:', {
                ms: timeSinceLastCheck,
                seconds: timeSinceLastCheck ? (timeSinceLastCheck / 1000).toFixed(1) : 'unknown'
            });

            // Se passou mais de 30 segundos desde a última verificação,
            // verificar imediatamente para garantir que não perdemos lembretes
            if (!this.lastCheckTime || timeSinceLastCheck > 30000) {
                this.checkReminders();
            }
        }
    }

    /**
     * Verifica todas as tarefas para lembretes que devem ser ativados
     */
    async checkReminders() {
        try {
            // Registrar tempo de verificação
            this.lastCheckTime = Date.now();

            logger.info('Checking reminders...', {
                timestamp: new Date(this.lastCheckTime).toISOString(),
                trackedCount: this.trackedReminders.size
            });

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

                    // Iniciar alerta sonoro intermitente (toca a cada 3s, para após 1 minuto)
                    soundService.startIntermittentReminder(task.id, {
                        interval: 3000,      // Tocar a cada 3 segundos
                        maxDuration: 60000   // Parar após 1 minuto
                    });

                    logger.info('Reminder activated with intermittent sound', {
                        taskId: task.id,
                        title: task.title
                    });
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
                    tasks: newlyActivated.map(t => ({ id: t.id, title: t.title }))
                });
            }

        } catch (error) {
            logger.error('Error checking reminders', error);
        }
    }

    /**
     * Verifica TODAS as tarefas vencidas (ignorando tracking)
     * Usado ao iniciar o app para garantir que tarefas já vencidas disparem alarme
     */
    async checkAllOverdueReminders() {
        try {
            logger.info('Checking ALL overdue reminders (including tracked)...');

            // Obter todas as tarefas
            const allTasks = await taskStorage.getAll();

            // Filtrar tarefas vencidas e não concluídas
            const overdueTasks = allTasks.filter(task =>
                task.dueDate &&
                !task.completed &&
                isPast(task.dueDate)
            );

            if (overdueTasks.length === 0) {
                logger.info('No overdue reminders found');
                return;
            }

            logger.info(`Found ${overdueTasks.length} overdue reminders`);

            // Disparar alarmes para todas as tarefas vencidas
            for (const task of overdueTasks) {
                // Adicionar ao tracking (se não estiver)
                if (!this.trackedReminders.has(task.id)) {
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

                    // Iniciar alerta sonoro intermitente
                    soundService.startIntermittentReminder(task.id, {
                        interval: 3000,
                        maxDuration: 60000
                    });

                    logger.info('Overdue reminder activated', {
                        taskId: task.id,
                        title: task.title,
                        dueDate: task.dueDate
                    });
                }
            }

            // Calcular contador de lembretes vencidos
            window.dispatchEvent(new CustomEvent('reminder:count-update', {
                detail: { count: overdueTasks.length }
            }));

        } catch (error) {
            logger.error('Error checking overdue reminders', error);
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
     * Para o som do lembrete de uma tarefa específica
     * @param {string} taskId - ID da tarefa
     */
    stopReminderSound(taskId) {
        soundService.stopReminderSound(taskId);
        logger.debug('Reminder sound stopped', { taskId });
    }

    /**
     * Para todos os sons de lembrete ativos
     */
    stopAllReminderSounds() {
        soundService.stopReminderSound();
        logger.debug('All reminder sounds stopped');
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
            intervalMs: this.intervalMs,
            lastCheckTime: this.lastCheckTime,
            lastCheckTimeAgo: this.lastCheckTime ? Date.now() - this.lastCheckTime : null,
            isPageVisible: typeof document !== 'undefined' ? !document.hidden : null
        };
    }
}

// Instância global
export const reminderChecker = new ReminderChecker();

// Expor globalmente para debug
if (typeof window !== 'undefined') {
    window.reminderChecker = reminderChecker;
    window.checkRemindersNow = () => reminderChecker.checkReminders();
    window.checkAllOverdueReminders = () => reminderChecker.checkAllOverdueReminders();
    window.getReminderStatus = () => reminderChecker.getStatus();

    console.log('💡 Reminder debugging commands available:');
    console.log('   - window.reminderChecker');
    console.log('   - window.checkRemindersNow()');
    console.log('   - window.checkAllOverdueReminders() - Check ALL overdue (including tracked)');
    console.log('   - window.getReminderStatus()');
}

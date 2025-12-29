/**
 * Task Storage - Camada de persistência para tarefas
 * @author Lista de Tarefas App
 * @version 1.0.0
 */

import { logger } from '../utils/logger.js';

// Configuração do storage
const STORAGE_CONFIG = {
    key: 'listaDeTarefas_tasks',
    version: '1.0.0',
    maxRetries: 3,
    retryDelay: 1000,
};

/**
 * Classe para gerenciamento de persistência de tarefas
 */
class TaskStorage {
    constructor(config = {}) {
        this.config = { ...STORAGE_CONFIG, ...config };
        this.isAvailable = this.checkStorageAvailability();
        this.cache = new Map();
        this.cacheTimeout = 30 * 1000; // 30 segundos

        if (this.isAvailable) {
            this.migrateIfNeeded();
        }
    }

    /**
     * Verifica se o storage está disponível
     * @returns {boolean}
     */
    checkStorageAvailability() {
        if (typeof localStorage === 'undefined') {
            logger.warn('localStorage is not available');
            return false;
        }

        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            logger.warn('Storage check failed', error);
            return false;
        }
    }

    /**
     * Obtém todas as tarefas do storage
     * @returns {Promise<Array>}
     */
    async getAll() {
        try {
            // Verificar cache primeiro
            const cached = this.getFromCache('all');
            if (cached) {
                return cached;
            }

            if (!this.isAvailable) {
                logger.warn('Storage not available, returning empty array');
                return [];
            }

            // DEBUG: Verificar storage
            const data = localStorage.getItem(this.config.key);
            logger.info('getAll: Raw data from localStorage:', {
                hasData: !!data,
                dataLength: data ? data.length : 0
            });

            if (!data) {
                logger.debug('No tasks found in storage');
                return [];
            }

            const parsed = JSON.parse(data);
            logger.info('getAll: Parsed data:', {
                taskCount: parsed.tasks ? parsed.tasks.length : 0,
                tasks: parsed.tasks ? parsed.tasks.map(t => ({ id: t.id, title: t.title, category: t.category })) : []
            });

            const tasks = this.validateAndClean(parsed.tasks || []);
            logger.info('getAll: After validateAndClean:', {
                count: tasks.length,
                tasks: tasks.map(t => ({ id: t.id, title: t.title, category: t.category }))
            });

            // Atualizar cache
            this.setCache('all', tasks);

            logger.info('Tasks loaded from storage', { count: tasks.length });
            return tasks;
        } catch (error) {
            logger.error('Failed to get tasks from storage', error);
            return [];
        }
    }

    /**
     * Salva todas as tarefas no storage
     * @param {Array} tasks - Lista de tarefas
     * @returns {Promise<boolean>}
     */
    async saveAll(tasks) {
        try {
            if (!this.isAvailable) {
                logger.warn('Storage not available, skipping save');
                return false;
            }

            // DEBUG: Log antes de salvar
            logger.info('saveAll called with tasks:', {
                count: tasks.length,
                tasks: tasks.map(t => ({ id: t.id, title: t.title, category: t.category }))
            });

            // Validar tarefas antes de salvar
            const validTasks = this.validateAndClean(tasks);
            logger.info('After validateAndClean:', {
                count: validTasks.length,
                tasks: validTasks.map(t => ({ id: t.id, title: t.title, category: t.category }))
            });

            const data = {
                tasks: validTasks,
                version: this.config.version,
                savedAt: new Date().toISOString(),
            };

            await this.retryOperation(() => {
                localStorage.setItem(this.config.key, JSON.stringify(data));
            });

            // DEBUG: Verificar se foi salvo corretamente
            const savedData = localStorage.getItem(this.config.key);
            const parsedData = JSON.parse(savedData);
            logger.info('Data saved to localStorage:', {
                taskCount: parsedData.tasks.length,
                tasks: parsedData.tasks.map(t => ({ id: t.id, title: t.title, category: t.category }))
            });

            // Limpar cache para forçar recarga
            this.clearCache();

            logger.info('Tasks saved to storage', { count: validTasks.length });
            return true;
        } catch (error) {
            logger.error('Failed to save tasks to storage', error);
            return false;
        }
    }

    /**
     * Adiciona uma nova tarefa
     * @param {Object} task - Nova tarefa
     * @returns {Promise<Object|null>}
     */
    async add(task) {
        try {
            logger.info('Starting task addition', { task });

            const tasks = await this.getAll();
            logger.info('Current tasks before addition', { count: tasks.length, taskIds: tasks.map(t => t.id) });

            // DEBUG: Log da tarefa recebida
            logger.info('TaskStorage.add called with:', {
                task: task,
                taskCategory: task.category,
                hasCategory: 'category' in task
            });

            const newTask = {
                id: task.id || this.generateId(),
                title: task.title,
                description: task.description || '',
                completed: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                category: task.category || 'Tarefas', // Usar 'Tarefas' como padrão
                priority: task.priority || 'medium',
                dueDate: task.dueDate || null,
            };

            // Não usar spread operator para evitar sobrescrever campos importantes
            // Apenas mesclar campos explícitos que não conflitam
            if (task.completed !== undefined) newTask.completed = task.completed;
            if (task.category !== undefined) newTask.category = task.category;
            if (task.priority !== undefined) newTask.priority = task.priority;

            logger.info('TaskStorage.add final task object:', newTask);

            tasks.push(newTask);
            logger.info('Tasks after push', { count: tasks.length, taskIds: tasks.map(t => t.id) });

            await this.saveAll(tasks);

            // IMPORTANTE: Limpar cache após adição para garantir dados frescos
            this.clearCache();

            // Verificar imediatamente após salvar
            const verifyTasks = await this.getAll();
            logger.info('Tasks verification after addition', { count: verifyTasks.length, taskIds: verifyTasks.map(t => t.id) });

            logger.info('Task added to storage', { taskId: newTask.id });
            return newTask;
        } catch (error) {
            logger.error('Failed to add task to storage', error);
            return null;
        }
    }

    /**
     * Atualiza uma tarefa existente
     * @param {string} taskId - ID da tarefa
     * @param {Object} updates - Atualizações
     * @returns {Promise<Object|null>}
     */
    async update(taskId, updates) {
        try {
            const tasks = await this.getAll();
            const taskIndex = tasks.findIndex(t => t.id === taskId);

            if (taskIndex === -1) {
                logger.warn('Task not found for update', { taskId });
                return null;
            }

            tasks[taskIndex] = {
                ...tasks[taskIndex],
                ...updates,
                updatedAt: new Date().toISOString(),
            };

            await this.saveAll(tasks);

            // IMPORTANTE: Limpar cache após atualização para garantir dados frescos
            this.clearCache();

            logger.info('Task updated in storage', { taskId });
            return tasks[taskIndex];
        } catch (error) {
            logger.error('Failed to update task in storage', error);
            return null;
        }
    }

    /**
     * Remove uma tarefa
     * @param {string} taskId - ID da tarefa
     * @returns {Promise<boolean>}
     */
    async remove(taskId) {
        try {
            logger.info('Starting task removal', { taskId });

            const tasks = await this.getAll();
            logger.info('Current tasks before removal', { count: tasks.length, taskIds: tasks.map(t => t.id) });

            const filteredTasks = tasks.filter(t => t.id !== taskId);
            logger.info('Tasks after filter', { count: filteredTasks.length, taskIds: filteredTasks.map(t => t.id) });

            if (tasks.length === filteredTasks.length) {
                logger.warn('Task not found for removal', { taskId });
                return false;
            }

            await this.saveAll(filteredTasks);

            // IMPORTANTE: Limpar cache após remoção para garantir dados frescos
            this.clearCache();

            // Verificar imediatamente após salvar
            const verifyTasks = await this.getAll();
            logger.info('Tasks verification after removal', { count: verifyTasks.length, taskIds: verifyTasks.map(t => t.id) });

            logger.info('Task removed from storage', { taskId });
            return true;
        } catch (error) {
            logger.error('Failed to remove task from storage', error);
            return false;
        }
    }

    /**
     * Remove todas as tarefas
     * @returns {Promise<boolean>}
     */
    async clear() {
        try {
            if (!this.isAvailable) {
                return false;
            }

            await this.retryOperation(() => {
                localStorage.setItem(this.config.key, JSON.stringify({
                    tasks: [],
                    version: this.config.version,
                    savedAt: new Date().toISOString(),
                }));
            });

            this.clearCache();

            logger.info('All tasks cleared from storage');
            return true;
        } catch (error) {
            logger.error('Failed to clear tasks from storage', error);
            return false;
        }
    }

    /**
     * Exporta tarefas como JSON
     * @param {Array} tasks - Lista de tarefas (opcional)
     * @returns {Promise<string>}
     */
    async export(tasks = null) {
        try {
            const tasksToExport = tasks || await this.getAll();
            const exportData = {
                tasks: tasksToExport,
                exportedAt: new Date().toISOString(),
                version: this.config.version,
            };

            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            logger.error('Failed to export tasks', error);
            return '';
        }
    }

    /**
     * Importa tarefas de JSON
     * @param {string} jsonData - JSON com tarefas
     * @returns {Promise<boolean>}
     */
    async import(jsonData) {
        try {
            const data = JSON.parse(jsonData);

            if (!Array.isArray(data.tasks)) {
                throw new Error('Invalid import data format');
            }

            const validTasks = this.validateAndClean(data.tasks);
            await this.saveAll(validTasks);

            logger.info('Tasks imported successfully', { count: validTasks.length });
            return true;
        } catch (error) {
            logger.error('Failed to import tasks', error);
            return false;
        }
    }

    /**
     * Sanitiza input contra XSS
     * @param {string} input - Input a ser sanitizado
     * @returns {string} - Input sanitizado
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') {
            return '';
        }

        // Criar elemento div para escapar HTML
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    /**
     * Valida e limpa lista de tarefas
     * @param {Array} tasks - Lista de tarefas
     * @returns {Array}
     */
    validateAndClean(tasks) {
        if (!Array.isArray(tasks)) {
            return [];
        }

        return tasks
            .filter(task => task && typeof task === 'object')
            .map(task => {
                const category = String(task.category || 'Tarefas').trim();

                // Normalizar prioridade para formato consistente (low, medium, high)
                let normalizedPriority = 'medium'; // default
                const priorityValue = String(task.priority || 'medium').toLowerCase().trim();

                if (['1', 'low'].includes(priorityValue)) {
                    normalizedPriority = 'low';
                } else if (['3', 'medium'].includes(priorityValue)) {
                    normalizedPriority = 'medium';
                } else if (['5', 'high'].includes(priorityValue)) {
                    normalizedPriority = 'high';
                }

                return {
                    id: task.id || this.generateId(),
                    title: this.sanitizeInput(String(task.title || '')).trim(),
                    description: this.sanitizeInput(String(task.description || '')).trim(),
                    completed: Boolean(task.completed),
                    createdAt: task.createdAt || new Date().toISOString(),
                    updatedAt: task.updatedAt || new Date().toISOString(),
                    // Aceitar qualquer categoria (não restringir a lista hardcoded)
                    category: category || 'Tarefas',
                    priority: normalizedPriority,
                    dueDate: task.dueDate || null,
                };
            })
            .filter(task => task.title.length > 0);
    }

    /**
     * Executa operação com retry
     * @param {Function} operation - Operação a executar
     * @param {number} attempts - Número de tentativas
     */
    async retryOperation(operation, attempts = 0) {
        try {
            operation();
        } catch (error) {
            if (attempts >= this.config.maxRetries) {
                throw error;
            }

            logger.warn(`Storage operation failed, retrying (${attempts + 1}/${this.config.maxRetries})`, error);

            await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
            await this.retryOperation(operation, attempts + 1);
        }
    }

    /**
     * Migra dados de versões anteriores
     */
    async migrateIfNeeded() {
        try {
            const data = localStorage.getItem(this.config.key);
            if (!data) return;

            const parsed = JSON.parse(data);

            // Verificar versão
            if (!parsed.version || parsed.version < this.config.version) {
                logger.info('Migrating storage data', {
                    from: parsed.version || 'unknown',
                    to: this.config.version
                });

                // Aplicar migrações específicas aqui
                const migratedTasks = this.migrateTasks(parsed.tasks || []);

                // Salvar dados migrados
                await this.saveAll(migratedTasks);
            }
        } catch (error) {
            logger.error('Failed to migrate storage data', error);
        }
    }

    /**
     * Migra tarefas para nova estrutura
     * @param {Array} tasks - Tarefas antigas
     * @returns {Array}
     */
    migrateTasks(tasks) {
        return tasks.map(task => {
            // Adicionar campos ausentes
            return {
                ...task,
                category: task.category || 'default',
                priority: task.priority || 'medium',
                createdAt: task.createdAt || new Date().toISOString(),
                updatedAt: task.updatedAt || new Date().toISOString(),
            };
        });
    }

    /**
     * Gera ID único
     * @returns {string}
     */
    generateId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Obtém dados do cache
     * @param {string} key - Chave do cache
     * @returns {any|null}
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (Date.now() > cached.expires) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * Define dados no cache
     * @param {string} key - Chave do cache
     * @param {any} data - Dados para armazenar
     */
    setCache(key, data) {
        this.cache.set(key, {
            data,
            expires: Date.now() + this.cacheTimeout,
        });
    }

    /**
     * Limpa todo o cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Obtém informações sobre o storage
     * @returns {Object}
     */
    async getInfo() {
        if (!this.isAvailable) {
            return { available: false };
        }

        try {
            const data = localStorage.getItem(this.config.key);
            const size = data ? new Blob([data]).size : 0;
            const tasks = await this.getAll();

            return {
                available: true,
                size,
                sizeFormatted: this.formatBytes(size),
                taskCount: tasks.length,
                lastModified: localStorage.getItem(`${this.config.key}_modified`) || null,
                version: this.config.version,
            };
        } catch (error) {
            logger.error('Failed to get storage info', error);
            return { available: false, error };
        }
    }

    /**
     * Formata bytes para formato legível
     * @param {number} bytes - Bytes
     * @returns {string}
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Força limpeza do storage
     * @returns {Promise<boolean>}
     */
    async forceClear() {
        try {
            if (!this.isAvailable) return false;

            localStorage.removeItem(this.config.key);
            localStorage.removeItem(`${this.config.key}_modified`);
            this.clearCache();

            logger.info('Storage force cleared');
            return true;
        } catch (error) {
            logger.error('Failed to force clear storage', error);
            return false;
        }
    }
}

// Instância global do storage
export const taskStorage = new TaskStorage();

// Exportar a classe para permitir múltiplas instâncias se necessário
export { TaskStorage };
export default TaskStorage;
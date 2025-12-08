/**
 * App State - Gerenciamento centralizado de estado da aplicação
 * @author Lista de Tarefas App
 * @version 1.0.0
 */

import { logger } from '../utils/logger.js';

// Eventos customizados para mudanças de estado
export const STATE_EVENTS = {
    TASK_CREATED: 'task:created',
    TASK_UPDATED: 'task:updated',
    TASK_DELETED: 'task:deleted',
    TASK_COMPLETED: 'task:completed',
    TASKS_LOADED: 'tasks:loaded',
    FILTER_CHANGED: 'filter:changed',
    THEME_CHANGED: 'theme:changed',
    STATE_RESET: 'state:reset',
};

// Estado inicial da aplicação
const initialState = {
    tasks: [],
    filter: {
        status: 'all', // all, active, completed
        category: 'all',
        priority: 'all',
        searchTerm: '',
    },
    ui: {
        theme: 'light', // light, dark
        sidebarOpen: false,
        loading: false,
        error: null,
    },
    settings: {
        autoSave: true,
        notifications: true,
        dateFormat: 'DD/MM/YYYY',
        itemsPerPage: 10,
    },
};

class AppState {
    constructor() {
        this.state = { ...initialState };
        this.subscribers = new Map();
        this.history = [];
        this.maxHistorySize = 50;
        this.initialized = false;

        this.initialize();
    }

    /**
     * Inicializa o gerenciador de estado
     */
    async initialize() {
        try {
            logger.info('Initializing App State');

            // Carregar estado do storage se disponível
            await this.loadFromStorage();

            // Aplicar tema salvo
            this.applyTheme(this.state.ui.theme);

            // Adicionar listeners para mudanças na página
            this.addEventListeners();

            this.initialized = true;
            logger.info('App State initialized successfully');

            // Disparar evento de estado carregado
            this.dispatch(STATE_EVENTS.STATE_LOADED, this.state);
        } catch (error) {
            logger.error('Failed to initialize App State', error);
            this.state = { ...initialState };
        }
    }

    /**
     * Adiciona listeners para eventos do navegador
     */
    addEventListeners() {
        // Salvar estado antes de fechar a página
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                this.saveToStorage();
            });

            // Detectar mudanças no tema do sistema
            if (window.matchMedia) {
                const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
                darkModeQuery.addEventListener('change', (e) => {
                    if (!this.state.settings.themeOverridden) {
                        const newTheme = e.matches ? 'dark' : 'light';
                        this.updateUI({ theme: newTheme });
                    }
                });
            }
        }
    }

    /**
     * Obtém o estado atual
     * @param {string} path - Caminho opcional (ex: 'tasks', 'ui.theme')
     * @returns {any}
     */
    getState(path = null) {
        if (!path) {
            return { ...this.state };
        }

        return path.split('.').reduce((obj, key) => obj?.[key], this.state);
    }

    /**
     * Atualiza o estado
     * @param {Object} updates - Objeto com atualizações
     * @param {boolean} save - Se deve salvar no storage
     */
    update(updates, save = true) {
        const prevState = { ...this.state };

        // Adicionar ao histórico
        this.addToHistory(prevState);

        // Aplicar atualizações
        this.state = this.mergeState(this.state, updates);

        logger.debug('State updated', { updates, newState: this.state });

        // Notificar subscribers
        this.notifySubscribers(this.state, prevState);

        // Salvar no storage
        if (save && this.state.settings.autoSave) {
            this.saveToStorage();
        }
    }

    /**
     * Atualiza tarefas
     * @param {Array|Function} tasks - Novas tarefas ou função para atualizar
     */
    updateTasks(tasks) {
        const currentTasks = this.getState('tasks');
        const newTasks = typeof tasks === 'function'
            ? tasks(currentTasks)
            : tasks;

        this.update({ tasks: newTasks });

        // Disparar evento específico
        if (newTasks.length > currentTasks.length) {
            this.dispatch(STATE_EVENTS.TASK_CREATED);
        } else if (newTasks.length < currentTasks.length) {
            this.dispatch(STATE_EVENTS.TASK_DELETED);
        } else {
            this.dispatch(STATE_EVENTS.TASK_UPDATED);
        }
    }

    /**
     * Adiciona uma nova tarefa
     * @param {Object} task - Nova tarefa
     */
    addTask(task) {
        const newTask = {
            id: this.generateId(),
            title: task.title,
            description: task.description || '',
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            category: task.category || 'default',
            priority: task.priority || 'medium',
            dueDate: task.dueDate || null,
            ...task,
        };

        this.updateTasks(tasks => [...tasks, newTask]);
        logger.info('Task created', { taskId: newTask.id });

        return newTask;
    }

    /**
     * Atualiza uma tarefa existente
     * @param {string} taskId - ID da tarefa
     * @param {Object} updates - Atualizações
     */
    updateTask(taskId, updates) {
        this.updateTasks(tasks =>
            tasks.map(task =>
                task.id === taskId
                    ? {
                        ...task,
                        ...updates,
                        updatedAt: new Date().toISOString()
                    }
                    : task
            )
        );

        logger.info('Task updated', { taskId, updates });

        if (updates.completed) {
            this.dispatch(STATE_EVENTS.TASK_COMPLETED);
        }
    }

    /**
     * Remove uma tarefa
     * @param {string} taskId - ID da tarefa
     */
    removeTask(taskId) {
        this.updateTasks(tasks => tasks.filter(task => task.id !== taskId));
        logger.info('Task deleted', { taskId });
    }

    /**
     * Atualiza filtros
     * @param {Object} filters - Novos filtros
     */
    updateFilter(filters) {
        const currentFilter = this.getState('filter');
        const newFilter = { ...currentFilter, ...filters };

        this.update({ filter: newFilter });
        this.dispatch(STATE_EVENTS.FILTER_CHANGED, newFilter);
    }

    /**
     * Atualiza estado da UI
     * @param {Object} ui - Novo estado da UI
     */
    updateUI(ui) {
        const currentUI = this.getState('ui');
        const newUI = { ...currentUI, ...ui };

        this.update({ ui: newUI });

        // Aplicar tema se mudou
        if (ui.theme && ui.theme !== currentUI.theme) {
            this.applyTheme(ui.theme);
            this.dispatch(STATE_EVENTS.THEME_CHANGED, ui.theme);
        }
    }

    /**
     * Atualiza configurações
     * @param {Object} settings - Novas configurações
     */
    updateSettings(settings) {
        const currentSettings = this.getState('settings');
        const newSettings = { ...currentSettings, ...settings };

        this.update({ settings: newSettings });
    }

    /**
     * Aplica tema visual
     * @param {string} theme - Nome do tema
     */
    applyTheme(theme) {
        if (typeof document === 'undefined') return;

        document.documentElement.setAttribute('data-theme', theme);

        // Atualizar meta tag para theme-color
        const themeColor = theme === 'dark' ? '#1a1a1a' : '#ffffff';
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');

        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }

        metaThemeColor.content = themeColor;

        logger.debug('Theme applied', { theme });
    }

    /**
     * Inscreve um listener para mudanças de estado
     * @param {Function} callback - Função callback
     * @returns {Function} Função para cancelar inscrição
     */
    subscribe(callback) {
        const id = this.generateId();
        this.subscribers.set(id, callback);

        // Retornar função de unsubscribe
        return () => {
            this.subscribers.delete(id);
        };
    }

    /**
     * Notifica todos os subscribers
     * @param {Object} newState - Novo estado
     * @param {Object} prevState - Estado anterior
     */
    notifySubscribers(newState, prevState) {
        this.subscribers.forEach(callback => {
            try {
                callback(newState, prevState);
            } catch (error) {
                logger.error('Subscriber callback error', error);
            }
        });
    }

    /**
     * Dispara evento customizado
     * @param {string} eventName - Nome do evento
     * @param {any} detail - Dados do evento
     */
    dispatch(eventName, detail = null) {
        if (typeof window === 'undefined' || typeof CustomEvent === 'undefined') {
            return;
        }

        const event = new CustomEvent(eventName, {
            detail,
            bubbles: true,
            cancelable: true,
        });

        window.dispatchEvent(event);
        logger.debug('Event dispatched', { eventName, detail });
    }

    /**
     * Adiciona estado ao histórico
     * @param {Object} state - Estado para adicionar
     */
    addToHistory(state) {
        this.history.push({ ...state });

        // Manter apenas os mais recentes
        if (this.history.length > this.maxHistorySize) {
            this.history = this.history.slice(-this.maxHistorySize);
        }
    }

    /**
     * Desfaz última alteração
     */
    undo() {
        if (this.history.length > 0) {
            const prevState = this.history.pop();
            this.state = { ...prevState };
            this.notifySubscribers(this.state, this.state);
            this.saveToStorage();

            logger.info('State undo performed');
            return true;
        }

        return false;
    }

    /**
     * Reseta estado para inicial
     */
    reset() {
        this.history = [];
        this.state = { ...initialState };

        this.applyTheme(this.state.ui.theme);
        this.notifySubscribers(this.state, this.state);
        this.saveToStorage();
        this.dispatch(STATE_EVENTS.STATE_RESET);

        logger.info('State reset to initial');
    }

    /**
     * Salva estado no storage
     */
    async saveToStorage() {
        try {
            if (typeof localStorage === 'undefined') return;

            const stateToSave = {
                tasks: this.state.tasks,
                ui: {
                    theme: this.state.ui.theme,
                    sidebarOpen: this.state.ui.sidebarOpen,
                },
                settings: this.state.settings,
                lastSaved: new Date().toISOString(),
            };

            localStorage.setItem('appState', JSON.stringify(stateToSave));
            logger.debug('State saved to storage');
        } catch (error) {
            logger.error('Failed to save state to storage', error);
        }
    }

    /**
     * Carrega estado do storage
     */
    async loadFromStorage() {
        try {
            if (typeof localStorage === 'undefined') return;

            const stored = localStorage.getItem('appState');
            if (!stored) return;

            const parsedState = JSON.parse(stored);

            // Mesclar com estado inicial para garantir todas as propriedades
            this.state = this.mergeState(initialState, parsedState);

            logger.info('State loaded from storage', { lastSaved: parsedState.lastSaved });
        } catch (error) {
            logger.error('Failed to load state from storage', error);
        }
    }

    /**
     * Mescla objetos de forma profunda
     * @param {Object} target - Objeto alvo
     * @param {Object} source - Objeto fonte
     * @returns {Object}
     */
    mergeState(target, source) {
        const result = { ...target };

        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.mergeState(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }

        return result;
    }

    /**
     * Gera ID único
     * @returns {string}
     */
    generateId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Obtém tarefas filtradas
     * @returns {Array}
     */
    getFilteredTasks() {
        const { tasks, filter } = this.state;

        return tasks.filter(task => {
            // Filtro por status
            if (filter.status === 'active' && task.completed) return false;
            if (filter.status === 'completed' && !task.completed) return false;

            // Filtro por categoria
            if (filter.category !== 'all' && task.category !== filter.category) return false;

            // Filtro por prioridade
            if (filter.priority !== 'all' && task.priority !== filter.priority) return false;

            // Filtro por termo de busca
            if (filter.searchTerm) {
                const searchTerm = filter.searchTerm.toLowerCase();
                const titleMatch = task.title.toLowerCase().includes(searchTerm);
                const descriptionMatch = task.description.toLowerCase().includes(searchTerm);

                if (!titleMatch && !descriptionMatch) return false;
            }

            return true;
        });
    }

    /**
     * Obtém estatísticas das tarefas
     * @returns {Object}
     */
    getTaskStats() {
        const tasks = this.state.tasks;

        return {
            total: tasks.length,
            completed: tasks.filter(t => t.completed).length,
            active: tasks.filter(t => !t.completed).length,
            byCategory: this.groupTasksBy(tasks, 'category'),
            byPriority: this.groupTasksBy(tasks, 'priority'),
            overdue: tasks.filter(t => {
                if (!t.dueDate || t.completed) return false;
                return new Date(t.dueDate) < new Date();
            }).length,
        };
    }

    /**
     * Agrupa tarefas por uma propriedade
     * @param {Array} tasks - Lista de tarefas
     * @param {string} property - Propriedade para agrupar
     * @returns {Object}
     */
    groupTasksBy(tasks, property) {
        return tasks.reduce((groups, task) => {
            const key = task[property] || 'default';
            groups[key] = (groups[key] || 0) + 1;
            return groups;
        }, {});
    }
}

// Instância global do gerenciador de estado
export const appState = new AppState();

// Exportar a classe para permitir múltiplas instâncias se necessário
export default AppState;
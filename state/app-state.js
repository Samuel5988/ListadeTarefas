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

// Estado inicial da aplicação conforme Story 1.2 + implementação Story 1.1
const initialState = {
    tasks: [],
    categories: ['Tarefas'],
    preferences: {
        theme: 'light',
        autoSave: true,
        showCompleted: true
    },
    // Mantidos da Story 1.1 para compatibilidade
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
            // Retorna cópia profunda para garantir imutabilidade (Story 1.2 AC: 1)
            return this.deepClone(this.state);
        }

        return path.split('.').reduce((obj, key) => obj?.[key], this.state);
    }

    /**
     * Atualiza o estado (Story 1.2 AC: 1)
     * @param {Object} partialState - Estado parcial para atualizar
     * @returns {Object} Mudanças realizadas
     */
    setState(partialState) {
        const previousState = this.deepClone(this.state);
        const changes = [];

        // Detectar mudanças
        for (const key in partialState) {
            const oldValue = previousState[key];
            const newValue = partialState[key];

            if (!this.shallowEqual(oldValue, newValue)) {
                changes.push({
                    path: key,
                    oldValue,
                    newValue
                });

                // Validar schema conforme Story 1.2
                if (key === 'categories' && !Array.isArray(newValue)) {
                    throw new Error('categories deve ser um array');
                }
                if (key === 'preferences' && typeof newValue !== 'object') {
                    throw new Error('preferences deve ser um objeto');
                }
            }
        }

        // Aplicar mudanças apenas se houver diferenças reais
        if (changes.length > 0) {
            this.state = this.mergeState(this.state, partialState);

            // Disparar eventos específicos (Story 1.2 AC: 4)
            this.dispatchSpecificEvents(partialState, changes);

            // Notificar subscribers com (newState, changes) (Story 1.2 AC: 3)
            this.notifySubscribers(this.getState(), changes);

            // Disparar evento geral (Story 1.2 AC: 4)
            this.dispatch('state:changed', { changes, previousState, newState: this.getState() });

            logger.debug('State updated via setState', { partialState, changes });

            // Salvar no storage se autoSave estiver ativo
            if (this.state.preferences?.autoSave || this.state.settings?.autoSave) {
                this.saveToStorage();
            }
        }

        return changes;
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
     * Inscreve um listener para mudanças de estado (Story 1.2 AC: 2)
     * @param {string} componentId - ID único do componente
     * @param {Function} callback - Função callback
     * @returns {Function} Função para cancelar inscrição
     */
    subscribe(componentId, callback) {
        if (!componentId || typeof componentId !== 'string') {
            throw new Error('componentId é obrigatório e deve ser uma string');
        }
        if (typeof callback !== 'function') {
            throw new Error('callback é obrigatório e deve ser uma função');
        }

        // Verificar se já existe subscriber com este ID
        if (this.subscribers.has(componentId)) {
            logger.warn(`Subscriber ${componentId} already exists, replacing...`);
        }

        this.subscribers.set(componentId, callback);
        logger.debug(`Subscriber ${componentId} added`);

        // Retornar função de unsubscribe (Story 1.2 AC: 2)
        return () => {
            const removed = this.subscribers.delete(componentId);
            logger.debug(`Subscriber ${componentId} ${removed ? 'removed' : 'not found'}`);
            return removed; // Retorna true se removido, false caso contrário
        };
    }

    /**
     * Notifica todos os subscribers (Story 1.2 AC: 3)
     * @param {Object} newState - Novo estado
     * @param {Array} changes - Array de mudanças
     */
    notifySubscribers(newState, changes) {
        // Notificar APÓS o estado ser atualizado (Story 1.2 AC: 3)
        this.subscribers.forEach((callback, componentId) => {
            try {
                callback(newState, changes);
            } catch (error) {
                logger.error(`Subscriber ${componentId} callback error`, error);
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
     * Dispara eventos específicos baseado nas mudanças (Story 1.2 AC: 4)
     * @param {Object} partialState - Estado parcial atualizado
     * @param {Array} changes - Array de mudanças
     */
    dispatchSpecificEvents(partialState, changes) {
        // Eventos específicos conforme Story 1.2 AC: 4
        if (partialState.tasks !== undefined) {
            const change = changes.find(c => c.path === 'tasks');
            if (change) {
                let action = 'updated';
                if (Array.isArray(change.oldValue) && Array.isArray(change.newValue)) {
                    if (change.newValue.length > change.oldValue.length) {
                        action = 'created';
                    } else if (change.newValue.length < change.oldValue.length) {
                        action = 'deleted';
                    }
                }
                this.dispatch('tasks:updated', { action, data: change.newValue });
            }
        }

        if (partialState.categories !== undefined) {
            const change = changes.find(c => c.path === 'categories');
            if (change) {
                let action = 'updated';
                if (Array.isArray(change.oldValue) && Array.isArray(change.newValue)) {
                    if (change.newValue.length > change.oldValue.length) {
                        action = 'added';
                    } else if (change.newValue.length < change.oldValue.length) {
                        action = 'removed';
                    }
                }
                this.dispatch('categories:updated', { action, data: change.newValue });
            }
        }

        if (partialState.preferences !== undefined) {
            const change = changes.find(c => c.path === 'preferences');
            if (change) {
                this.dispatch('preferences:updated', { action: 'updated', data: change.newValue });
            }
        }
    }

    /**
     * Cria cópia profunda de um objeto (Story 1.2 Subtask 1.4)
     * @param {any} obj - Objeto para clonar
     * @returns {any}
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (obj instanceof Date) {
            return new Date(obj);
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.deepClone(item));
        }

        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }

        return cloned;
    }

    /**
     * Compara shallow dois objetos (Story 1.2 Subtask 4.1)
     * @param {any} obj1 - Primeiro objeto
     * @param {any} obj2 - Segundo objeto
     * @returns {boolean}
     */
    shallowEqual(obj1, obj2) {
        if (obj1 === obj2) {
            return true;
        }

        if (!obj1 || !obj2) {
            return false;
        }

        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        if (keys1.length !== keys2.length) {
            return false;
        }

        for (const key of keys1) {
            if (obj1[key] !== obj2[key]) {
                return false;
            }
        }

        return true;
    }

    /**
     * Adiciona método unsubscribe (Story 1.2 AC: 2)
     * @param {string} componentId - ID do componente
     * @returns {boolean} True se removido, false caso contrário
     */
    unsubscribe(componentId) {
        const removed = this.subscribers.delete(componentId);
        logger.debug(`Unsubscribe ${componentId}: ${removed ? 'success' : 'not found'}`);
        return removed;
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

  
    /**
     * Obtém informações de debug do estado (Story 1.2 Subtask 4.2)
     * @returns {Object} Informações de debug
     */
    getDebugInfo() {
        const isDebugMode = typeof localStorage !== 'undefined' && localStorage.debug === 'true';

        if (isDebugMode) {
            return {
                subscribers: Array.from(this.subscribers.keys()),
                stateSize: JSON.stringify(this.state).length,
                historySize: this.history.length,
                initialized: this.initialized,
                state: this.getState() // Apenas em debug mode
            };
        }

        return {
            subscribers: Array.from(this.subscribers.keys()),
            stateSize: JSON.stringify(this.state).length,
            historySize: this.history.length,
            initialized: this.initialized
        };
    }

    /**
     * Middleware opcional para logs (Story 1.2 Subtask 4.3)
     * @param {Function} middleware - Função middleware
     */
    addMiddleware(middleware) {
        if (typeof middleware !== 'function') {
            throw new Error('Middleware deve ser uma função');
        }

        // Wrap setState para incluir middleware
        const originalSetState = this.setState.bind(this);
        this.setState = (partialState) => {
            // Executar middleware antes
            const result = middleware(partialState, this.state);

            // Se middleware retornar false, cancela atualização
            if (result === false) {
                logger.debug('Update cancelled by middleware');
                return [];
            }

            // Se middleware retornar novo estado, usa ele
            if (typeof result === 'object') {
                return originalSetState(result);
            }

            // Senão, continua com estado original
            return originalSetState(partialState);
        };

        logger.info('Middleware added to state manager');
    }

    // ============================================================================
    // COMPATIBILITY LAYER - Story 1.1 ↔ Story 1.2 Bridge
    // ============================================================================

    /**
     * Obtém categorias do estado atual (Compatibility Layer)
     * @returns {Array} Array de categorias únicas
     */
    getCategoriesFromState() {
        // Se categories já existe, retorna ele
        if (this.state.categories && Array.isArray(this.state.categories)) {
            return this.state.categories;
        }

        // Se não, extrai das tarefas existentes
        const uniqueCategories = [...new Set(
            this.state.tasks
                .map(task => task.category || 'default')
                .filter(Boolean)
        )];

        // Adiciona categoria padrão se necessário
        if (!uniqueCategories.includes('Tarefas')) {
            uniqueCategories.unshift('Tarefas');
        }

        return uniqueCategories.length > 0 ? uniqueCategories : ['Tarefas'];
    }

    /**
     * Obtém preferências unificadas (Compatibility Layer)
     * @returns {Object} Objeto de preferências mesclado
     */
    getPreferencesFromState() {
        const { preferences, settings, ui } = this.state;

        return {
            // Preferences da Story 1.2 (prioridade máxima)
            theme: preferences?.theme || ui?.theme || 'light',
            autoSave: preferences?.autoSave ?? settings?.autoSave ?? true,
            showCompleted: preferences?.showCompleted ?? true,

            // Configurações adicionais do settings
            notifications: settings?.notifications ?? true,
            dateFormat: settings?.dateFormat ?? 'DD/MM/YYYY',
            itemsPerPage: settings?.itemsPerPage ?? 10,

            // Estado da UI relevante
            sidebarOpen: ui?.sidebarOpen ?? false,
        };
    }

    /**
     * Atualiza categorias mantendo compatibilidade com filter
     * @param {Array} categories - Novas categorias
     */
    updateCategories(categories) {
        if (!Array.isArray(categories)) {
            throw new Error('categories deve ser um array');
        }

        // Atualiza categories (Story 1.2)
        const changes = this.setState({ categories });

        // Atualiza filter.category para compatibilidade (Story 1.1)
        if (this.state.filter?.category && !categories.includes(this.state.filter.category)) {
            this.updateFilter({ category: 'all' });
        }

        logger.debug('Categories updated with compatibility', { categories, changes });
        return changes;
    }

    /**
     * Atualiza preferências mantendo compatibilidade
     * @param {Object} preferences - Novas preferências
     */
    updatePreferences(preferences) {
        if (!preferences || typeof preferences !== 'object') {
            throw new Error('preferences deve ser um objeto');
        }

        const changes = this.setState({ preferences });

        // Atualiza estruturas relacionadas para compatibilidade
        const relatedUpdates = {};

        // Atualiza UI theme se mudou
        if (preferences.theme) {
            relatedUpdates.ui = { theme: preferences.theme };
        }

        // Atualiza settings autoSave se necessário
        if ('autoSave' in preferences) {
            relatedUpdates.settings = { autoSave: preferences.autoSave };
        }

        if (Object.keys(relatedUpdates).length > 0) {
            this.update(relatedUpdates);
        }

        logger.debug('Preferences updated with compatibility', { preferences, changes });
        return changes;
    }

    /**
     * Obtém estado no formato da Story 1.2 (especificação)
     * @returns {Object} Estado formatado conforme Story 1.2
     */
    getStateForStory12() {
        return {
            tasks: this.getState('tasks'),
            categories: this.getCategoriesFromState(),
            preferences: this.getPreferencesFromState(),
        };
    }

    /**
     * Obtém estado no formato da Story 1.1 (legado)
     * @returns {Object} Estado formatado conforme Story 1.1
     */
    getStateForStory11() {
        return {
            tasks: this.getState('tasks'),
            filter: this.getState('filter'),
            ui: this.getState('ui'),
            settings: this.getState('settings'),
        };
    }

    /**
     * Verifica compatibilidade entre estados
     * @returns {Object} Relatório de compatibilidade
     */
    checkCompatibility() {
        const story12State = this.getStateForStory12();
        const story11State = this.getStateForStory11();

        return {
            // Verifica se há conflitos de tema
            themeConflict: story12State.preferences.theme !== story11State.ui.theme,

            // Verifica se há conflitos de autoSave
            autoSaveConflict: story12State.preferences.autoSave !== story11State.settings.autoSave,

            // Mapeia categorias vs filter
            categoryMapping: {
                availableCategories: this.getCategoriesFromState(),
                currentFilter: story11State.filter.category,
                hasValidFilter: this.getCategoriesFromState().includes(story11State.filter.category)
            },

            // Estado geral
            totalTasks: story12State.tasks.length,
            hasSubscribers: this.subscribers.size > 0,
            recommendations: this.getCompatibilityRecommendations()
        };
    }

    /**
     * Gera recomendações de compatibilidade
     * @returns {Array} Array de recomendações
     */
    getCompatibilityRecommendations() {
        const recommendations = [];
        const story12State = this.getStateForStory12();
        const story11State = this.getStateForStory11();

        // Verifica se há conflitos de tema
        if (story12State.preferences.theme !== story11State.ui.theme) {
            recommendations.push('Consolidar tema entre ui.theme e preferences.theme');
        }

        // Verifica se há conflitos de autoSave
        if (story12State.preferences.autoSave !== story11State.settings.autoSave) {
            recommendations.push('Unificar autoSave entre settings e preferences');
        }

        // Mapeia categorias vs filter
        const availableCategories = this.getCategoriesFromState();
        const currentFilter = story11State.filter.category;
        const hasValidFilter = availableCategories.includes(currentFilter);

        if (!hasValidFilter) {
            recommendations.push('Ajustar filter.category para categoria válida');
        }

        if (recommendations.length === 0) {
            recommendations.push('Estado compatível - sem ações necessárias');
        }

        return recommendations;
    }
}

// Instância global do gerenciador de estado (Story 1.2)
const stateManager = new AppState();

// Manter compatibilidade com código existente
export const appState = stateManager;

// Export default conforme AC1: export default stateManager (objeto)
export default stateManager;
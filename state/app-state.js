/**
 * App State - Gerenciamento centralizado de estado da aplicação
 * @author Lista de Tarefas App
 * @version 1.0.0
 */

import { logger } from '../utils/logger.js';
import { taskStorage } from '../services/task-storage.js';

// Eventos customizados para mudanças de estado
export const STATE_EVENTS = {
    TASK_CREATED: 'task:created',
    TASK_UPDATED: 'task:updated',
    TASK_DELETED: 'task:deleted',
    TASK_COMPLETED: 'task:completed',
    TASKS_LOADED: 'tasks:loaded',
    FILTER_CHANGED: 'filter:changed',
    THEME_CHANGED: 'theme:changed',
    CATEGORIES_CHANGED: 'categories:changed',
    STATE_RESET: 'state:reset',
};

// Estado inicial da aplicação conforme Story 1.2 + implementação Story 1.1
const initialState = {
    tasks: [],
    categories: ['Tarefas'],
    preferences: {
        theme: 'light',
        autoSave: true,
        showCompleted: true,
        sortOrder: 'priority' // 'priority' ou 'created'
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

        // Referência ao TaskStorage existente
        this.taskStorage = taskStorage;

        this.initialize();
    }

    /**
     * Inicializa o gerenciador de estado
     */
    async initialize() {
        try {
            logger.info('Initializing App State');

            // Carregar tarefas do TaskStorage existente
            await this.loadTasksFromStorage();

            // Carregar estado do storage se disponível
            await this.loadFromStorage();

            // Configurar listener para persistência automática
            this.setupPersistenceListener();

            // Aplicar tema salvo
            this.applyTheme(this.state.ui.theme);

            // Adicionar listeners para mudanças na página
            this.addEventListeners();

            this.initialized = true;
            logger.info('App State initialized successfully');

            // Disparar evento de estado carregado
            this.dispatch(STATE_EVENTS.TASKS_LOADED, this.state.tasks);
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

        // Detectar mudanças, mas ignorar tarefas (elas são gerenciadas pelo TaskStorage)
        const filteredPartialState = { ...partialState };
        delete filteredPartialState.tasks; // Remover tasks para não salvar no storage

        // Detectar mudanças
        for (const key in filteredPartialState) {
            const oldValue = previousState[key];
            const newValue = filteredPartialState[key];

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
        if (changes.length > 0 || (partialState.tasks && JSON.stringify(previousState.tasks) !== JSON.stringify(partialState.tasks))) {
            // Aplicar mudanças completas (incluindo tasks para o estado em memória)
            this.state = this.mergeState(this.state, partialState);

            // Disparar eventos específicos apenas para mudanças não-tasks
            if (changes.length > 0) {
                this.dispatchSpecificEvents(filteredPartialState, changes);
                this.notifySubscribers(this.getState(), changes);
                this.dispatch('state:changed', { changes, previousState, newState: this.getState() });
            }

            logger.debug('State updated via setState', {
                partialState,
                filteredPartialState,
                changes,
                hasTasks: !!partialState.tasks
            });

            // Salvar no storage apenas se não for apenas mudança de tasks e autoSave estiver ativo
            if ((this.state.preferences?.autoSave || this.state.settings?.autoSave) && changes.length > 0) {
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

        // Filtrar mudanças de tasks para o storage
        const hasNonTaskChanges = Object.keys(updates).some(key => key !== 'tasks');

        // Salvar no storage apenas se houver mudanças não-tasks
        if (save && hasNonTaskChanges && this.state.settings.autoSave) {
            this.saveToStorage();
        }
    }

    /**
     * Atualiza tarefas
     * @param {Array|Function} tasks - Novas tarefas ou função para atualizar
     * @param {boolean} silentUpdate - Se true, não dispara eventos (para sincronização)
     */
    updateTasks(tasks, silentUpdate = false) {
        const currentTasks = this.getState('tasks');
        const newTasks = typeof tasks === 'function'
            ? tasks(currentTasks)
            : tasks;

        // Evitar disparar eventos se não houver mudança real
        if (this.shallowEqual(currentTasks, newTasks)) {
            return;
        }

        this.update({ tasks: newTasks });

        // Disparar evento específico - mas apenas se não for silent update
        if (!silentUpdate) {
            if (newTasks.length > currentTasks.length) {
                this.dispatch(STATE_EVENTS.TASK_CREATED);
            } else if (newTasks.length < currentTasks.length) {
                this.dispatch(STATE_EVENTS.TASK_DELETED);
            } else {
                // Verificar se houve mudança no conteúdo das tarefas
                const hasContentChange = !currentTasks.every((task, index) =>
                    this.shallowEqual(task, newTasks[index])
                );

                if (hasContentChange) {
                    this.dispatch(STATE_EVENTS.TASK_UPDATED);
                }
            }
        } else {
            logger.debug('Silent task update completed, no events dispatched');
        }
    }

    /**
     * Adiciona uma nova tarefa
     * @param {Object} task - Nova tarefa
     */
    async addTask(task) {
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

        // Adicionar ao TaskStorage
        try {
            const savedTask = await this.taskStorage.add(newTask);
            if (savedTask) {
                // Atualizar estado com a tarefa salva
                this.updateTasks(tasks => [...tasks, savedTask]);
                logger.info('Task created and persisted', { taskId: savedTask.id });
                return savedTask;
            }
        } catch (error) {
            logger.error('Failed to persist new task', error);
        }

        // Fallback: adicionar apenas ao estado
        this.updateTasks(tasks => [...tasks, newTask]);
        logger.info('Task created (state only)', { taskId: newTask.id });

        return newTask;
    }

    /**
     * Atualiza uma tarefa existente
     * @param {string} taskId - ID da tarefa
     * @param {Object} updates - Atualizações
     */
    async updateTask(taskId, updates) {
        // Atualizar no TaskStorage primeiro
        try {
            const updatedTask = await this.taskStorage.update(taskId, {
                ...updates,
                updatedAt: new Date().toISOString()
            });

            if (updatedTask) {
                // Atualizar estado com a tarefa atualizada
                this.updateTasks(tasks =>
                    tasks.map(task =>
                        task.id === taskId ? updatedTask : task
                    )
                );
                logger.info('Task updated and persisted', { taskId, updates });

                if (updates.completed) {
                    this.dispatch(STATE_EVENTS.TASK_COMPLETED);
                }
                return;
            }
        } catch (error) {
            logger.error('Failed to persist task update', error);
        }

        // Fallback: atualizar apenas no estado
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

        logger.info('Task updated (state only)', { taskId, updates });

        if (updates.completed) {
            this.dispatch(STATE_EVENTS.TASK_COMPLETED);
        }
    }

    /**
     * Remove uma tarefa
     * @param {string} taskId - ID da tarefa
     */
    async removeTask(taskId) {
        // Remover do TaskStorage primeiro
        try {
            const removed = await this.taskStorage.remove(taskId);
            if (removed) {
                // Atualizar estado removendo a tarefa
                this.updateTasks(tasks => tasks.filter(task => task.id !== taskId));
                logger.info('Task deleted and persisted', { taskId });
                return;
            }
        } catch (error) {
            logger.error('Failed to persist task removal', error);
        }

        // Fallback: remover apenas do estado
        this.updateTasks(tasks => tasks.filter(task => task.id !== taskId));
        logger.info('Task deleted (state only)', { taskId });
    }

    /**
     * Atualiza filtros
     * @param {Object} filters - Novos filtros
     */
    updateFilter(filters) {
        const currentFilter = this.getState('filter');
        const newFilter = { ...currentFilter, ...filters };

        // DEBUG: Log das mudanças de filtro
        logger.info('updateFilter called:', {
            previousFilter: currentFilter,
            newFilters: filters,
            resultingFilter: newFilter
        });

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

            // Salvar preferências de tema no localStorage
            this.saveThemePreference(ui.theme);
        }
    }

    /**
     * Salva preferências no localStorage
     * @param {Object} preferences - Preferências a serem salvas
     */
    savePreferences(preferences = {}) {
        try {
            if (typeof localStorage !== 'undefined') {
                // Obter preferências existentes
                const existing = localStorage.getItem('listaDeTarefas_preferences');
                const parsed = existing ? JSON.parse(existing) : {};

                // Mesclar com novas preferências
                const updatedPreferences = {
                    ...parsed,
                    ...preferences,
                    savedAt: new Date().toISOString()
                };

                localStorage.setItem('listaDeTarefas_preferences', JSON.stringify(updatedPreferences));
                logger.debug('Preferences saved', updatedPreferences);
            }
        } catch (error) {
            logger.error('Failed to save preferences', error);
        }
    }

    /**
     * Salva preferência de tema
     * @param {string} theme - Tema a ser salvo
     */
    saveThemePreference(theme) {
        this.savePreferences({ theme });
    }

    /**
     * Atualiza configurações
     * @param {Object} settings - Novas configurações
     */
    updateSettings(settings) {
        const currentSettings = this.getState('settings');
        const newSettings = { ...currentSettings, ...settings };

        this.update({ settings: newSettings });

        // Salvar preferências relevantes
        const preferencesToSave = {};
        if ('autoSave' in settings) {
            preferencesToSave.autoSave = settings.autoSave;
        }
        if ('showCompleted' in settings) {
            preferencesToSave.showCompleted = settings.showCompleted;
        }

        if (Object.keys(preferencesToSave).length > 0) {
            this.savePreferences(preferencesToSave);
        }
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
     * Carrega tarefas do TaskStorage existente
     */
    async loadTasksFromStorage() {
        try {
            const tasks = await this.taskStorage.getAll();
            if (tasks && tasks.length > 0) {
                // Validar dados recebidos do storage
                const validTasks = this.validateTasksFromStorage(tasks);

                if (validTasks.length > 0) {
                    // Mapear tarefas do formato do storage para o formato do estado
                    const mappedTasks = validTasks.map(task => ({
                        id: task.id,
                        title: task.title,
                        description: task.description || '',
                        completed: Boolean(task.completed),
                        createdAt: task.createdAt || new Date().toISOString(),
                        updatedAt: task.updatedAt || task.createdAt || new Date().toISOString(),
                        category: task.category || 'default',
                        priority: ['low', 'medium', 'high'].includes(task.priority) ? task.priority : 'medium',
                        dueDate: task.dueDate || null,
                    }));

                    this.state.tasks = mappedTasks;
                    logger.info('Tasks loaded and validated from TaskStorage', {
                        count: mappedTasks.length,
                        originalCount: tasks.length,
                        invalidCount: tasks.length - validTasks.length
                    });
                }
            } else {
                logger.info('No tasks found in TaskStorage');
            }
        } catch (error) {
            logger.error('Failed to load tasks from TaskStorage', error);
            // Fallback: continuar com estado padrão
            this.state.tasks = [];
        }
    }

    /**
     * Valida tarefas vindas do storage
     * @param {Array} tasks - Tarefas para validar
     * @returns {Array} Tarefas válidas
     */
    validateTasksFromStorage(tasks) {
        if (!Array.isArray(tasks)) {
            logger.warn('Invalid tasks data from storage: not an array');
            return [];
        }

        return tasks.filter(task => {
            // Validar objeto da tarefa
            if (!task || typeof task !== 'object') {
                logger.warn('Invalid task: not an object', task);
                return false;
            }

            // Validar ID obrigatório
            if (!task.id || typeof task.id !== 'string') {
                logger.warn('Invalid task: missing or invalid ID', task);
                return false;
            }

            // Validar título obrigatório
            if (!task.title || typeof task.title !== 'string' || task.title.trim().length === 0) {
                logger.warn('Invalid task: missing or invalid title', task);
                return false;
            }

            // Validar datas
            if (task.createdAt && !this.isValidISOString(task.createdAt)) {
                logger.warn('Invalid task: invalid createdAt date', task);
                return false;
            }

            if (task.updatedAt && !this.isValidISOString(task.updatedAt)) {
                logger.warn('Invalid task: invalid updatedAt date', task);
                return false;
            }

            // Validar prioridade
            if (task.priority && !['low', 'medium', 'high'].includes(task.priority)) {
                logger.warn('Invalid task: invalid priority', task);
                return false;
            }

            return true;
        });
    }

    /**
     * Verifica se string é uma data ISO válida
     * @param {string} dateString - String da data
     * @returns {boolean}
     */
    isValidISOString(dateString) {
        if (typeof dateString !== 'string') return false;

        const date = new Date(dateString);
        return !isNaN(date.getTime()) && dateString === date.toISOString();
    }

    /**
     * Configura listener para persistência automática
     */
    setupPersistenceListener() {
        // Listener geral para mudanças de estado
        this.subscribe('persistence-listener', (newState, changes) => {
            // Verificar se changes é um array (de setState) ou objeto (de update)
            const changesArray = Array.isArray(changes) ? changes : [];

            // Filtrar mudanças relevantes para persistência
            const relevantChanges = changesArray.filter(c =>
                c.path.includes('tasks') ||
                c.path.includes('categories') ||
                c.path.includes('preferences') ||
                c.path.includes('settings')
            );

            if (relevantChanges.length > 0) {
                this.debouncedSave(newState);
            }
        });

        // Listeners específicos para eventos de tarefas
        if (typeof window !== 'undefined') {
            // Task created - já é tratado pelo método addTask
            window.addEventListener(STATE_EVENTS.TASK_CREATED, () => {
                logger.debug('Task created event detected');
            });

            // Task updated - já é tratado pelo método updateTask
            window.addEventListener(STATE_EVENTS.TASK_UPDATED, () => {
                logger.debug('Task updated event detected');
            });

            // Task deleted - já é tratado pelo método removeTask
            window.addEventListener(STATE_EVENTS.TASK_DELETED, () => {
                logger.debug('Task deleted event detected');
            });

            // Task completed - já é tratado pelo método updateTask
            window.addEventListener(STATE_EVENTS.TASK_COMPLETED, () => {
                logger.debug('Task completed event detected');
            });

            // Tasks loaded - não precisa persistir (já veio do storage)
            window.addEventListener(STATE_EVENTS.TASKS_LOADED, (e) => {
                logger.debug('Tasks loaded event detected', { count: e.detail?.length || 0 });
            });

            // Theme changed - persistir preferência
            window.addEventListener(STATE_EVENTS.THEME_CHANGED, (e) => {
                logger.debug('Theme changed event detected', { theme: e.detail });
                // A persistência do tema é feita pelo método saveThemePreference
            });

            // Filter changed - não precisa persistir no TaskStorage
            window.addEventListener(STATE_EVENTS.FILTER_CHANGED, () => {
                logger.debug('Filter changed event detected');
            });

            logger.info('State events listeners configured for persistence');
        }
    }

    /**
     * Debounce para operações de save
     */
    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * Debounced save para TaskStorage
     */
    debouncedSave = this.debounce(async (state) => {
        try {
            // Apenas salvar tarefas no TaskStorage
            if (state.tasks && state.tasks.length > 0) {
                await this.taskStorage.saveAll(state.tasks);
                logger.debug('Tasks persisted to TaskStorage', { taskCount: state.tasks.length });
            }
        } catch (error) {
            logger.error('Failed to persist tasks to TaskStorage', error);
        }
    }, 500);

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

            // Não salvar tasks aqui - elas são gerenciadas pelo TaskStorage
            // para evitar duplicidade e conflitos
            const stateToSave = {
                ui: {
                    theme: this.state.ui.theme,
                    sidebarOpen: this.state.ui.sidebarOpen,
                },
                settings: this.state.settings,
                // Salvar categorias para persistência
                categories: this.state.categories,
                lastSaved: new Date().toISOString(),
            };

            // DEBUG: Verificar se há tarefas sendo salvas indevidamente
            if (this.state.tasks && this.state.tasks.length > 0) {
                logger.warn('saveToStorage called with tasks in state - these will be excluded', {
                    taskCount: this.state.tasks.length,
                    taskIds: this.state.tasks.map(t => t.id)
                });
            }

            localStorage.setItem('appState', JSON.stringify(stateToSave));
            logger.debug('State saved to storage (tasks excluded)');
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

            // Carregar estado geral
            const stored = localStorage.getItem('appState');
            if (stored) {
                const parsedState = JSON.parse(stored);
                // Mesclar com estado inicial para garantir todas as propriedades
                this.state = this.mergeState(initialState, parsedState);
                logger.info('State loaded from storage', { lastSaved: parsedState.lastSaved });
            }

            // Carregar preferências
            const preferences = localStorage.getItem('listaDeTarefas_preferences');
            if (preferences) {
                const parsedPreferences = JSON.parse(preferences);

                // Mapear preferências para o estado
                if (parsedPreferences.theme) {
                    this.state.ui.theme = parsedPreferences.theme;
                    this.state.preferences.theme = parsedPreferences.theme;
                }

                if ('autoSave' in parsedPreferences) {
                    this.state.settings.autoSave = parsedPreferences.autoSave;
                    this.state.preferences.autoSave = parsedPreferences.autoSave;
                }

                if ('showCompleted' in parsedPreferences) {
                    this.state.preferences.showCompleted = parsedPreferences.showCompleted;
                }

                logger.info('Preferences loaded', parsedPreferences);
            }
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

        // DEBUG: Log do estado atual
        logger.info('getFilteredTasks called:', {
            totalTasks: tasks.length,
            currentFilter: filter,
            tasksWithCategories: tasks.map(t => ({ title: t.title, category: t.category }))
        });

        const filteredTasks = tasks.filter(task => {
            // Filtro por status
            if (filter.status === 'active' && task.completed) {
                logger.debug(`Task "${task.title}" filtered out: completed but filter is active`);
                return false;
            }
            if (filter.status === 'completed' && !task.completed) {
                logger.debug(`Task "${task.title}" filtered out: not completed but filter is completed`);
                return false;
            }

            // Filtro por categoria
            if (filter.category !== 'all' && task.category !== filter.category) {
                logger.debug(`Task "${task.title}" filtered out: category "${task.category}" != filter "${filter.category}"`);
                return false;
            }

            // Filtro por prioridade
            if (filter.priority !== 'all' && task.priority !== filter.priority) {
                logger.debug(`Task "${task.title}" filtered out: priority mismatch`);
                return false;
            }

            // Filtro por termo de busca
            if (filter.searchTerm) {
                const searchTerm = filter.searchTerm.toLowerCase();
                const titleMatch = task.title.toLowerCase().includes(searchTerm);
                const descriptionMatch = task.description.toLowerCase().includes(searchTerm);

                if (!titleMatch && !descriptionMatch) {
                    logger.debug(`Task "${task.title}" filtered out: search term not found`);
                    return false;
                }
            }

            logger.debug(`Task "${task.title}" passed all filters`);
            return true;
        });

        logger.info(`getFilteredTasks result: ${filteredTasks.length} tasks passed filter`);

        return filteredTasks;
    }

    /**
     * Ordena tarefas por prioridade (alta → média → baixa)
     * @param {Array} tasks - Lista de tarefas
     * @returns {Array} Tarefas ordenadas (muta o array para manter reatividade)
     */
    sortTasksByPriority(tasks) {
        const priorityWeight = {
            high: 5,
            medium: 3,
            low: 1
        };

        return tasks.sort((a, b) => {
            // Ordenar por peso da prioridade (descendente)
            const weightA = priorityWeight[a.priority] || 3;
            const weightB = priorityWeight[b.priority] || 3;

            if (weightA !== weightB) {
                return weightB - weightA; // Alta (5) primeiro
            }

            // Empate: ordenar por data de criação (mais antiga primeiro)
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
    }

    /**
     * Ordena tarefas por data de criação (mais recente primeiro)
     * @param {Array} tasks - Lista de tarefas
     * @returns {Array} Tarefas ordenadas (muta o array para manter reatividade)
     */
    sortTasksByCreated(tasks) {
        return tasks.sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
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

        // Persistir preferências no localStorage
        this.savePreferences(preferences);

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
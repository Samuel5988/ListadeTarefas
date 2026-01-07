/**
 * Lista de Tarefas - Aplicativo Principal
 * Ponto de entrada e orquestrador da aplicação
 * @author Lista de Tarefas App
 * @version 1.0.0
 */

import { logger } from './utils/logger.js';
import { appState, STATE_EVENTS } from './state/app-state.js';
import { taskStorage } from './services/task-storage.js';
import { reminderChecker } from './services/reminder-checker.js';
import { ThemeManager } from './components/theme-manager.js';
import { TaskCard } from './components/task-card.js';
import { taskForm } from './components/task-form.js';
import { TaskEditForm } from './components/task-edit-form.js';
import { ConfirmDialog } from './components/confirm-dialog.js';
import { CategorySidebar } from './components/category-sidebar.js';

/**
 * Classe principal da aplicação
 */
class TaskApp {
    constructor() {
        this.initialized = false;
        this.components = new Map();
        this.eventListeners = new Map();
        this.themeManager = null;
        this.deleteInProgress = false;

        // Bind métodos
        this.handleDOMLoaded = this.handleDOMLoaded.bind(this);
        this.handleError = this.handleError.bind(this);
        this.handleTaskEvents = this.handleTaskEvents.bind(this);

        // Inicialização
        this.initialize();
    }

    /**
     * Inicializa a aplicação
     */
    async initialize() {
        try {
            logger.info('Initializing Task App...');

            // Configurar tratamento global de erros
            this.setupErrorHandling();

            // Aguardar DOM estar pronto
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', this.handleDOMLoaded);
            } else {
                await this.handleDOMLoaded();
            }

            logger.info('Task App initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Task App', error);
            this.showError('Erro ao inicializar aplicação. Tente recarregar a página.');
        }
    }

    /**
     * Configura tratamento global de erros
     */
    setupErrorHandling() {
        // Capturar erros não tratados
        window.addEventListener('error', this.handleError);

        // Capturar rejeições de Promise não tratadas
        window.addEventListener('unhandledrejection', (event) => {
            logger.error('Unhandled promise rejection', {
                reason: event.reason,
                promise: event.promise
            });
            event.preventDefault();
        });
    }

    /**
     * Manipula carregamento do DOM
     */
    async handleDOMLoaded() {
        try {
            logger.info('DOM loaded, setting up application...');

            // Expor appState globalmente ANTES de inicializar componentes
            window.appState = appState;

            // Aguardar estado estar inicializado
            await this.waitForStateInitialization();

            // Carregar tarefas do storage
            await this.loadTasks();

            // Configurar UI inicial
            this.setupInitialUI();

            // Adicionar event listeners globais
            this.addGlobalEventListeners();

            // Exibir UI
            this.showApp();

            // Marcar como inicializado
            this.initialized = true;

            logger.info('Application ready');
        } catch (error) {
            logger.error('Failed to setup application', error);
            this.showError('Erro ao configurar aplicação. Tente recarregar a página.');
        }
    }

    /**
     * Aguarda inicialização do estado
     */
    async waitForStateInitialization() {
        const maxWait = 5000; // 5 segundos
        const startTime = Date.now();

        while (!appState.initialized && (Date.now() - startTime) < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (!appState.initialized) {
            throw new Error('State initialization timeout');
        }
    }

    /**
     * Carrega tarefas do storage
     */
    async loadTasks() {
        try {
            logger.info('Loading tasks from storage...');
            const tasks = await taskStorage.getAll();

            if (tasks.length > 0) {
                // Comparar com estado atual para evitar atualizações desnecessárias
                const currentTasks = appState.getState('tasks');
                const tasksChanged = JSON.stringify(currentTasks) !== JSON.stringify(tasks);

                if (tasksChanged) {
                    appState.updateTasks(tasks, true); // silent update para evitar eventos duplicados
                    logger.info(`Loaded ${tasks.length} tasks (state updated silently)`);
                } else {
                    logger.info(`Tasks already in sync, skipping update`);
                }
            } else {
                logger.info('No tasks found, starting with empty list');
                appState.updateTasks([], true); // silent update para evitar eventos desnecessários
            }
        } catch (error) {
            logger.error('Failed to load tasks', error);

            // Exibir notificação de erro para o usuário
            this.showNotification(
                'Não foi possível carregar suas tarefas. Verifique a conexão e tente novamente.',
                'error'
            );

            // Continuar com estado vazio
            appState.updateTasks([], true); // silent update para evitar eventos desnecessários
        }
    }

    /**
     * Configura UI inicial
     */
    setupInitialUI() {
        // Adicionar classe ao body para estilização
        document.body.classList.add('app-initialized');

        // Configurar tema
        const theme = appState.getState('ui.theme');
        document.documentElement.setAttribute('data-theme', theme);

        // Inicializar ThemeManager
        this.initializeThemeManager();

        // Inicializar Sort Toggle
        this.initializeSortToggle();

        // Inicializar TaskForm
        this.initializeTaskForm();

        // Inicializar componentes de edição/remoção
        this.taskEditForm = new TaskEditForm();
        this.confirmDialog = new ConfirmDialog();

        // Inicializar Category Sidebar
        this.initializeCategorySidebar();

        // Inicializar ReminderChecker
        this.initializeReminderChecker();

        // Renderizar tarefas existentes
        this.renderTasks();

        // Configurar listeners globais para ações de edição/remoção
        this.setupEditDeleteListeners();

        // Esconder mensagem de carregamento se existir
        const loadingEl = document.querySelector('.loading-message');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }

    /**
     * Inicializa o ThemeManager
     */
    initializeThemeManager() {
        try {
            logger.info('Initializing ThemeManager...');

            // Criar instância do ThemeManager
            this.themeManager = new ThemeManager(appState);

            // Adicionar botão ao container no header
            const toggleContainer = document.getElementById('theme-toggle-container');
            if (toggleContainer && this.themeManager.getToggleElement()) {
                toggleContainer.appendChild(this.themeManager.getToggleElement());
                logger.info('Theme toggle button added to header');
            }

            // Armazenar referência
            this.components.set('themeManager', this.themeManager);

            logger.info('ThemeManager initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize ThemeManager', error);
        }
    }

    /**
     * Inicializa o Sort Toggle
     */
    initializeSortToggle() {
        try {
            logger.info('Initializing Sort Toggle...');

            // Criar botão de toggle
            const sortToggle = document.createElement('button');
            sortToggle.className = 'btn btn--secondary sort-toggle';
            sortToggle.setAttribute('aria-label', 'Alternar ordenação');
            sortToggle.innerHTML = `
                <svg class="sort-toggle__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 4h13M3 8h9M3 12h5M15 12l4-4 4 4M19 8v8"/>
                </svg>
                <span class="sort-toggle__text">Ordenar por: Prioridade</span>
            `;

            // Event listener
            sortToggle.addEventListener('click', () => this.toggleSortOrder());

            // Adicionar ao container
            const sortContainer = document.getElementById('sort-toggle-container');
            if (sortContainer) {
                sortContainer.appendChild(sortToggle);
                logger.info('Sort toggle button added to header');
            } else {
                logger.warn('sort-toggle-container not found');
            }

            // Atualizar texto inicial baseado na preferência salva
            this.updateSortToggleText();

            // Salvar referência
            this.sortToggleElement = sortToggle;
        } catch (error) {
            logger.error('Failed to initialize Sort Toggle', error);
        }
    }

    /**
     * Atualiza texto do sort toggle
     */
    updateSortToggleText() {
        const sortToggle = document.querySelector('.sort-toggle__text');
        if (sortToggle) {
            const sortOrder = appState.getState('preferences.sortOrder') || 'priority';
            sortToggle.textContent = sortOrder === 'priority'
                ? 'Ordenar por: Prioridade'
                : 'Ordenar por: Data';
        }
    }

    /**
     * Inicializa o TaskForm
     */
    initializeTaskForm() {
        try {
            logger.info('Initializing TaskForm...');

            // Inicializar o TaskForm
            taskForm.init();

            // Armazenar referência
            this.components.set('taskForm', taskForm);

            logger.info('TaskForm initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize TaskForm', error);
        }
    }

    /**
     * Inicializa a Category Sidebar
     */
    initializeCategorySidebar() {
        try {
            logger.info('Initializing CategorySidebar...');

            // Criar container para a sidebar
            const sidebarContainer = document.querySelector('.category-sidebar-container') || document.createElement('div');
            sidebarContainer.className = 'category-sidebar-container';

            // Inserir sidebar antes do main container
            const mainContainer = document.querySelector('.max-w-7xl') || document.querySelector('main');
            if (mainContainer) {
                mainContainer.parentNode.insertBefore(sidebarContainer, mainContainer);
            } else {
                document.body.appendChild(sidebarContainer);
            }

            // Inicializar a sidebar
            this.categorySidebar = new CategorySidebar(sidebarContainer);
            this.categorySidebar.render();

            // Armazenar referência
            this.components.set('categorySidebar', this.categorySidebar);

            logger.info('CategorySidebar initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize CategorySidebar', error);
        }
    }

    /**
     * Inicializa o ReminderChecker
     */
    initializeReminderChecker() {
        try {
            logger.info('Initializing ReminderChecker...');

            // Iniciar verificação periódica
            reminderChecker.start();

            // Adicionar contador no header
            this.setupReminderCounter();

            // Armazenar referência
            this.components.set('reminderChecker', reminderChecker);

            logger.info('ReminderChecker initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize ReminderChecker', error);
        }
    }

    /**
     * Configura contador de lembretes no header
     */
    setupReminderCounter() {
        // Criar elemento do contador
        const counter = document.createElement('div');
        counter.id = 'reminder-counter';
        counter.className = 'reminder-counter';
        counter.innerHTML = `
            <svg class="reminder-counter__icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="reminder-counter__text">0 lembretes hoje</span>
        `;

        // Adicionar ao header
        const reminderContainer = document.getElementById('reminder-counter-container');
        if (reminderContainer) {
            reminderContainer.appendChild(counter);
        } else {
            // Fallback: adicionar após sort toggle
            const sortContainer = document.getElementById('sort-toggle-container');
            if (sortContainer && sortContainer.parentNode) {
                sortContainer.parentNode.insertBefore(counter, sortContainer.nextSibling);
            }
        }

        // Listener para atualização do contador
        window.addEventListener('reminder:count-update', (e) => {
            this.updateReminderCounter(e.detail.count);
        });

        // Listener para untrack de lembretes (quando tarefa é completada)
        window.addEventListener('reminder:untrack', (e) => {
            if (reminderChecker.untrackReminder) {
                reminderChecker.untrackReminder(e.detail.taskId);
            }
        });

        // Atualizar contador inicial
        reminderChecker.checkReminders();
    }

    /**
     * Atualiza contador de lembretes vencidos
     */
    updateReminderCounter(count) {
        const counterText = document.querySelector('.reminder-counter__text');
        if (counterText) {
            if (count === 0) {
                counterText.textContent = 'Nenhum lembrete vencido';
            } else if (count === 1) {
                counterText.textContent = '1 lembrete vencido';
            } else {
                counterText.textContent = `${count} lembretes vencidos`;
            }
        }

        // Highlight se houver lembretes
        const counter = document.getElementById('reminder-counter');
        if (counter) {
            counter.classList.toggle('reminder-counter--active', count > 0);
        }
    }

    /**
     * Adiciona event listeners globais
     */
    addGlobalEventListeners() {
        // Eventos de estado
        window.addEventListener(STATE_EVENTS.TASK_CREATED, this.handleTaskEvents);
        window.addEventListener(STATE_EVENTS.TASK_UPDATED, this.handleTaskEvents);
        window.addEventListener(STATE_EVENTS.TASK_COMPLETED, this.handleTaskEvents);
        window.addEventListener(STATE_EVENTS.THEME_CHANGED, this.handleThemeChange);

        // BUG FIX: Listener para TASK_DELETED estava faltando, causando dessincronização
        window.addEventListener(STATE_EVENTS.TASK_DELETED, async () => {
            logger.info('TASK_DELETED event received, reloading from storage...');
            try {
                // Recarregar do storage para garantir consistência (Single Source of Truth)
                taskStorage.clearCache();
                const tasks = await taskStorage.getAll();
                appState.setState({ tasks: tasks });

                // Atualizar CategorySidebar explicitamente
                if (this.categorySidebar) {
                    this.categorySidebar.update();
                }

                // Re-renderizar tarefas
                this.renderTasks();

                logger.info('UI updated after TASK_DELETED', { taskCount: tasks.length });
            } catch (error) {
                logger.error('Error handling TASK_DELETED event', error);
            }
        });

        // Eventos da Category Sidebar
        window.addEventListener(STATE_EVENTS.CATEGORIES_CHANGED, () => {
            if (this.categorySidebar) {
                this.categorySidebar.update();
            }
        });

        window.addEventListener(STATE_EVENTS.FILTER_CHANGED, () => {
            if (this.categorySidebar) {
                this.categorySidebar.updateActiveFilter();
            }
            // Re-renderizar tarefas com o novo filtro aplicado
            this.renderTasks();
        });

        window.addEventListener(STATE_EVENTS.TASKS_CHANGED, () => {
            if (this.categorySidebar) {
                this.categorySidebar.update();
            }
        });

        // Eventos de storage (para sincronização entre abas)
        window.addEventListener('storage', (e) => {
            if (e.key === taskStorage.config.key && !this.deleteInProgress) {
                logger.info('Storage changed in another tab, reloading...');
                this.loadTasks();
            }
        });

        // Eventos de visibilidade da página
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && !this.deleteInProgress) {
                logger.debug('Page became visible, checking for updates...');
                this.loadTasks();
            }
        });

        // Evento de mudança de prioridade via click na borda
        document.addEventListener('task:priority-changed', async (e) => {
            const { taskId, oldPriority, newPriority } = e.detail;

            logger.info('Priority changed via click', { taskId, oldPriority, newPriority });

            // Atualizar estado global recarregando do storage
            taskStorage.clearCache();
            const tasks = await taskStorage.getAll();
            appState.setState({ tasks: tasks });

            // Atualizar CategorySidebar explicitamente
            if (this.categorySidebar) {
                this.categorySidebar.update();
            }

            // Verificar se precisa reordenar
            const sortOrder = appState.getState('preferences.sortOrder');
            if (sortOrder === 'priority') {
                // Re-renderizar com nova ordenação
                this.renderTasks();
            }
        });

        // Atalhos de teclado
        document.addEventListener('keydown', this.handleKeyboardShortcuts);
    }

    /**
     * Alterna ordem de classificação (prioridade vs data)
     */
    toggleSortOrder() {
        const currentOrder = appState.getState('preferences.sortOrder') || 'priority';
        const newOrder = currentOrder === 'priority' ? 'created' : 'priority';

        appState.updatePreferences({ sortOrder: newOrder });

        // Atualizar texto do botão
        this.updateSortToggleText();

        // Re-renderizar com nova ordenação
        this.renderTasks();

        logger.info(`Sort order changed: ${currentOrder} → ${newOrder}`);
    }

    /**
     * Renderiza a lista de tarefas
     */
    renderTasks() {
        try {
            // Usar getFilteredTasks para respeitar os filtros ativos (incluindo categoria)
            let tasks = appState.getFilteredTasks();

            // Aplicar ordenação conforme preferência do usuário
            const sortOrder = appState.getState('preferences.sortOrder') || 'priority';
            if (sortOrder === 'priority') {
                tasks = appState.sortTasksByPriority(tasks);
            } else {
                tasks = appState.sortTasksByCreated(tasks);
            }

            const container = document.querySelector('main .grid');

            // Store cleanup function references
            if (!this.taskCardCleanup) {
                this.taskCardCleanup = [];
            }

            // Cleanup existing event listeners
            if (this.taskCardCleanup.length > 0) {
                this.taskCardCleanup.forEach(cleanup => cleanup());
                this.taskCardCleanup = [];
            }

            // Limpar conteúdo atual
            container.innerHTML = '';

            if (tasks.length === 0) {
                // Mostrar estado vazio
                container.innerHTML = `
                    <div class="bg-white rounded-lg shadow p-6 md:col-span-2 lg:col-span-3">
                        <div class="text-center py-8">
                            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <h3 class="mt-2 text-sm font-medium text-gray-900">Nenhuma tarefa</h3>
                            <p class="mt-1 text-sm text-gray-500">Clique no botão + para adicionar sua primeira tarefa</p>
                        </div>
                    </div>
                `;
            } else {
                // Renderizar cada tarefa - adicionado timeout para evitar loop infinito
                const renderTimeout = setTimeout(() => {
                    logger.warn('Task rendering timeout - potential infinite loop detected');
                    throw new Error('Task rendering timeout - possible infinite loop');
                }, 5000); // 5 segundos timeout

                try {
                    tasks.forEach((task, index) => {
                        // Verificação de segurança para prevenir loop infinito
                        if (index > 1000) {
                            logger.error('Too many tasks to render - possible infinite loop');
                            throw new Error('Too many tasks to render - possible infinite loop');
                        }

                        const taskCard = new TaskCard(task);
                        const cardElement = taskCard.render();

                        // Adicionar event listeners com cleanup
                        const toggleHandler = (e) => {
                            this.handleTaskToggle(e.detail.taskId);
                        };
                        const deleteHandler = (e) => {
                            this.handleTaskDelete(e.detail.taskId);
                        };

                        cardElement.addEventListener('task:toggle', toggleHandler);
                        cardElement.addEventListener('task:delete', deleteHandler);

                        // Store cleanup function for each listener
                        this.taskCardCleanup.push(() => {
                            cardElement.removeEventListener('task:toggle', toggleHandler);
                            cardElement.removeEventListener('task:delete', deleteHandler);
                        });

                        container.appendChild(cardElement);
                    });

                    clearTimeout(renderTimeout);
                } catch (renderError) {
                    clearTimeout(renderTimeout);
                    throw renderError;
                }
            }

            logger.info(`Rendered ${tasks.length} tasks`);
        } catch (error) {
            logger.error('Failed to render tasks', error);
            // Mostrar mensagem de erro ao usuário
            const container = document.querySelector('main .grid');
            container.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-lg p-6 md:col-span-2 lg:col-span-3">
                    <div class="text-center">
                        <h3 class="text-red-800 font-medium">Erro ao renderizar tarefas</h3>
                        <p class="text-red-600 mt-2">Por favor, recarregue a página ou tente novamente.</p>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Manipula toggle de conclusão de tarefa
     */
    async handleTaskToggle(taskId) {
        try {
            const tasks = appState.getState('tasks');
            const task = tasks.find(t => t.id === taskId);

            if (task) {
                const updatedTask = await taskStorage.update(taskId, {
                    completed: !task.completed,
                    updatedAt: new Date().toISOString()
                });

                if (updatedTask) {
                    // Atualizar estado
                    const updatedTasks = tasks.map(t => t.id === taskId ? updatedTask : t);
                    appState.setState({ tasks: updatedTasks });

                    // Disparar evento
                    window.dispatchEvent(new CustomEvent(
                        updatedTask.completed ? STATE_EVENTS.TASK_COMPLETED : STATE_EVENTS.TASK_UPDATED,
                        { detail: { task: updatedTask } }
                    ));

                    // Re-renderizar
                    this.renderTasks();
                }
            }
        } catch (error) {
            logger.error('Failed to toggle task', error);
            this.showError('Erro ao atualizar tarefa');
        }
    }

    /**
     * Manipula exclusão de tarefa
     */
    async handleTaskDelete(taskId) {
        try {
            const confirmed = confirm('Tem certeza que deseja excluir esta tarefa?');

            if (confirmed) {
                this.deleteInProgress = true;

                const success = await taskStorage.remove(taskId);

                if (success) {
                    // Atualizar estado diretamente sem disparar evento
                    const tasks = appState.getState('tasks');
                    const updatedTasks = tasks.filter(t => t.id !== taskId);
                    appState.setState({ tasks: updatedTasks });

                    // Renderizar UI diretamente
                    this.renderTasks();
                }

                this.deleteInProgress = false;
            }
        } catch (error) {
            this.deleteInProgress = false;
            logger.error('Failed to delete task', error);
            this.showError('Erro ao excluir tarefa');
        }
    }

    /**
     * Manipula eventos de tarefas
     * @param {CustomEvent} event - Evento customizado
     */
    async handleTaskEvents(event) {
        logger.debug('Task event received', {
            type: event.type,
            detail: event.detail
        });

        // Evitar recursão infinita - não recarregar tarefas em response a eventos de storage
        try {
            // Atualizar UI
            switch (event.type) {
                case STATE_EVENTS.TASK_CREATED:
                    // Para TASK_CREATED, recarregar tarefas do storage para garantir sincronia
                    // Isso evita que tarefas excluídas permaneçam no estado
                    if (!this.deleteInProgress) {
                        // Limpar cache para garantir dados frescos do storage
                        taskStorage.clearCache();
                        const tasks = await taskStorage.getAll();
                        appState.setState({ tasks: tasks });
                        logger.info('Tasks reloaded from storage after TASK_CREATED', { count: tasks.length });
                    }
                    this.renderTasks();
                    // CORREÇÃO: Atualizar CategorySidebar para atualizar contadores
                    if (this.categorySidebar) {
                        this.categorySidebar.update();
                    }
                    this.showNotification('Tarefa criada com sucesso', 'success');
                    break;
                case STATE_EVENTS.TASK_UPDATED:
                    // Para TASK_UPDATED, verificar se os dados do evento estão disponíveis
                    // Se estiverem, usar os dados do evento para evitar chamada ao storage
                    if (event.detail && event.detail.task) {
                        // Atualizar apenas a tarefa específica no estado
                        const tasks = appState.getState('tasks');
                        const updatedTasks = tasks.map(t =>
                            t.id === event.detail.taskId ? event.detail.task : t
                        );
                        appState.setState({ tasks: updatedTasks });
                    }
                    this.renderTasks();
                    // CORREÇÃO: Atualizar CategorySidebar
                    if (this.categorySidebar) {
                        this.categorySidebar.update();
                    }
                    break;
                case STATE_EVENTS.TASK_COMPLETED:
                    this.showNotification('Tarefa concluída!', 'success');
                    break;
                                case STATE_EVENTS.TASKS_LOADED:
                    // Para TASKS_LOADED, usar os dados do evento se disponíveis
                    // Isso evita conflitos com o estado atual
                    if (event.detail && Array.isArray(event.detail)) {
                        // Usar dados do evento diretamente para garantir consistência
                        appState.setState({ tasks: event.detail });
                    }
                    this.renderTasks();
                    // CORREÇÃO: Atualizar CategorySidebar
                    if (this.categorySidebar) {
                        this.categorySidebar.update();
                    }
                    break;
            }
        } catch (error) {
            logger.error('Error handling task event', { event: event.type, error });
        }
    }

    /**
     * Manipula mudança de tema
     * @param {CustomEvent} event - Evento de mudança de tema
     */
    handleThemeChange(event) {
        const theme = event.detail;
        document.documentElement.setAttribute('data-theme', theme);

        logger.info('Theme changed', { theme });
    }

    /**
     * Manipula atalhos de teclado
     * @param {KeyboardEvent} event - Evento de teclado
     */
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + K para busca rápida (futuro)
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            logger.debug('Quick search shortcut triggered');
            // Implementar busca rápida
        }

        // Ctrl/Cmd + N para nova tarefa (futuro)
        if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
            event.preventDefault();
            logger.debug('New task shortcut triggered');
            // Implementar criação rápida de tarefa
        }

        // Esc para fechar modais (futuro)
        if (event.key === 'Escape') {
            logger.debug('Escape key pressed');
            // Implementar fechamento de modais
        }
    }

    /**
     * Manipula erros globais
     * @param {ErrorEvent} event - Evento de erro
     */
    handleError(event) {
        logger.error('Global error caught', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error
        });

        // Mostrar erro amigável para o usuário
        this.showError('Ocorreu um erro inesperado. Tente recarregar a página.');
    }

    /**
     * Exibe a aplicação
     */
    showApp() {
        // Remover classe de loading se existir
        document.body.classList.remove('loading');

        // Adicionar classe de pronto
        document.body.classList.add('app-ready');

        // Animar entrada dos elementos
        this.animateEntrance();
    }

    /**
     * Anima a entrada dos elementos
     */
    animateEntrance() {
        const elements = document.querySelectorAll('.card, header, footer');
        elements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('fade-in');
            }, index * 50);
        });
    }

    /**
     * Exibe mensagem de erro
     * @param {string} message - Mensagem de erro
     */
    showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        errorEl.textContent = message;

        document.body.appendChild(errorEl);

        // Remover após 5 segundos
        setTimeout(() => {
            errorEl.remove();
        }, 5000);
    }

    /**
     * Exibe notificação
     * @param {string} message - Mensagem
     * @param {string} type - Tipo (success, info, warning, error)
     */
    showNotification(message, type = 'info') {
        const colors = {
            success: 'bg-green-500',
            info: 'bg-blue-500',
            warning: 'bg-yellow-500',
            error: 'bg-red-500',
        };

        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 fade-in`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remover após 3 segundos
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    /**
     * Recarrega a aplicação
     */
    async reload() {
        logger.info('Reloading application...');
        try {
            // Limpar caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }

            // Recarregar página
            window.location.reload();
        } catch (error) {
            logger.error('Failed to reload application', error);
            window.location.reload();
        }
    }

    /**
     * Obtém informações da aplicação
     * @returns {Object}
     */
    getInfo() {
        return {
            name: 'Lista de Tarefas',
            version: '1.0.0',
            initialized: this.initialized,
            stateInitialized: appState.initialized,
            storageAvailable: taskStorage.isAvailable,
            browser: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                online: navigator.onLine,
            },
            features: {
                localStorage: typeof Storage !== 'undefined',
                modules: typeof window.importShim === 'undefined', // ES6 modules nativos
                customElements: 'customElements' in window,
                intersectionObserver: 'IntersectionObserver' in window,
            },
        };
    }

    /**
     * Destrói a aplicação (cleanup)
     */
    destroy() {
        logger.info('Destroying application...');

        // Destruir ThemeManager se existir
        if (this.themeManager) {
            this.themeManager.destroy();
            this.themeManager = null;
        }

        // Para ReminderChecker se existir
        if (this.components.has('reminderChecker')) {
            this.components.get('reminderChecker').stop();
        }

        // Remover event listeners
        window.removeEventListener('error', this.handleError);
        document.removeEventListener('DOMContentLoaded', this.handleDOMLoaded);

        // Limpar estados
        this.components.clear();
        this.eventListeners.clear();

        // Salvar estado final
        if (appState.initialized) {
            appState.saveToStorage();
        }

        this.initialized = false;
        logger.info('Application destroyed');
    }

    /**
     * Configura listeners para edição e remoção de tarefas
     */
    setupEditDeleteListeners() {
        // Event delegation para menus de ação em todos os cards
        document.addEventListener('click', (e) => {
            // Menu dropdown toggle
            if (e.target.matches('.task-card__menu-button') || e.target.closest('.task-card__menu-button')) {
                e.stopPropagation();
                const button = e.target.closest('.task-card__menu-button');
                const taskId = button.dataset.taskId;
                this.toggleTaskMenu(taskId);
                return;
            }

            // Editar tarefa
            if (e.target.matches('.task-card__menu-item--edit') || e.target.closest('.task-card__menu-item--edit')) {
                e.stopPropagation();
                const menuItem = e.target.closest('.task-card__menu-item--edit');
                const taskId = menuItem.dataset.taskId;
                this.editTask(taskId);
                return;
            }

            // Remover tarefa
            if (e.target.matches('.task-card__menu-item--delete') || e.target.closest('.task-card__menu-item--delete')) {
                e.stopPropagation();
                const menuItem = e.target.closest('.task-card__menu-item--delete');
                const taskId = menuItem.dataset.taskId;
                this.deleteTask(taskId);
                return;
            }

            // Fechar menus ao clicar fora
            if (!e.target.closest('.task-card__actions')) {
                TaskCard.closeAllMenus();
            }
        });

        // Listener para tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                TaskCard.closeAllMenus();
                if (this.taskEditForm.isOpen) {
                    this.taskEditForm.close();
                }
                if (this.confirmDialog.isOpen) {
                    this.confirmDialog.close();
                }
            }
        });
    }

    /**
     * Alterna a visibilidade do menu de ações
     */
    toggleTaskMenu(taskId) {
        const menu = document.querySelector(`.task-card__menu[data-task-id="${taskId}"]`);
        if (menu) {
            const isOpen = menu.classList.contains('task-card__menu--open');
            TaskCard.closeAllMenus();
            if (!isOpen) {
                menu.classList.add('task-card__menu--open');
            }
        }
    }

    /**
     * Abre o formulário de edição
     */
    async editTask(taskId) {
        try {
            await this.taskEditForm.open(taskId);
        } catch (error) {
            logger.error('Error opening edit form:', error);
            this.showFeedback('Erro ao abrir edição', 'error');
        }
    }

    /**
     * Remove uma tarefa
     */
    async deleteTask(taskId) {
        try {
            // Buscar tarefa do taskStorage
            const tasks = await taskStorage.getAll();
            const task = tasks.find(t => t.id === taskId);

            if (!task) {
                logger.error(`Task ${taskId} not found`);
                return;
            }

            // Verificar preferência "Não perguntar novamente"
            const skipConfirm = localStorage.getItem('skipDeleteConfirm') === 'true';

            if (skipConfirm) {
                // Deletar diretamente
                await this.performTaskDelete(taskId);
            } else {
                // Mostrar diálogo de confirmação
                await this.confirmDialog.show(task, async (dontAskAgain) => {
                    if (dontAskAgain) {
                        localStorage.setItem('skipDeleteConfirm', 'true');
                    }
                    await this.performTaskDelete(taskId);
                });
            }

        } catch (error) {
            logger.error('Error deleting task:', error);
            this.showFeedback('Erro ao deletar tarefa', 'error');
        }
    }

    /**
     * Executa a remoção da tarefa
     */
    async performTaskDelete(taskId) {
        try {
            // Usar loading state no card
            const card = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
            if (card) {
                card.classList.add('task-card--loading');
            }

            // Remover do taskStorage - corrigido para async
            const result = await taskStorage.remove(taskId);

            if (result) {
                // Disparar evento de atualização - CORREÇÃO: usar window em vez de document
                window.dispatchEvent(new CustomEvent(STATE_EVENTS.TASK_DELETED, {
                    detail: { taskId }
                }));

                // Remover card com animação
                if (card) {
                    card.classList.add('task-card--removing');
                    setTimeout(() => {
                        card.remove();
                    }, 300);
                }

                this.showFeedback('Tarefa removida com sucesso', 'success');
            } else {
                throw new Error('Failed to delete task');
            }

        } catch (error) {
            logger.error('Error performing task delete:', error);
            this.showFeedback('Erro ao remover tarefa', 'error');

            // Remover loading state em caso de erro
            const card = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
            if (card) {
                card.classList.remove('task-card--loading');
            }
        }
    }

    /**
     * Mostra mensagem de feedback
     */
    showFeedback(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.zIndex = '9999';

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast--hide');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
}

// Iniciar aplicação imediatamente
const taskApp = new TaskApp();

// Tornar disponível globalmente para debug
window.taskApp = taskApp;

// Exportar para uso em módulos
export default taskApp;
export { TaskApp };
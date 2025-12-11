/**
 * Lista de Tarefas - Aplicativo Principal
 * Ponto de entrada e orquestrador da aplicação
 * @author Lista de Tarefas App
 * @version 1.0.0
 */

import { logger } from './utils/logger.js';
import { appState, STATE_EVENTS } from './state/app-state.js';
import { taskStorage } from './services/task-storage.js';
import { ThemeManager } from './components/theme-manager.js';
import { TaskCard } from './components/task-card.js';
import { taskForm } from './components/task-form.js';

/**
 * Classe principal da aplicação
 */
class TaskApp {
    constructor() {
        this.initialized = false;
        this.components = new Map();
        this.eventListeners = new Map();
        this.themeManager = null;

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
                appState.updateTasks(tasks);
                logger.info(`Loaded ${tasks.length} tasks`);
            } else {
                logger.info('No tasks found, starting with empty list');
            }
        } catch (error) {
            logger.error('Failed to load tasks', error);

            // Exibir notificação de erro para o usuário
            this.showNotification(
                'Não foi possível carregar suas tarefas. Verifique a conexão e tente novamente.',
                'error'
            );

            // Continuar com estado vazio
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

        // Inicializar TaskForm
        this.initializeTaskForm();

        // Renderizar tarefas existentes
        this.renderTasks();

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
     * Adiciona event listeners globais
     */
    addGlobalEventListeners() {
        // Eventos de estado
        window.addEventListener(STATE_EVENTS.TASK_CREATED, this.handleTaskEvents);
        window.addEventListener(STATE_EVENTS.TASK_UPDATED, this.handleTaskEvents);
        window.addEventListener(STATE_EVENTS.TASK_DELETED, this.handleTaskEvents);
        window.addEventListener(STATE_EVENTS.TASK_COMPLETED, this.handleTaskEvents);
        window.addEventListener(STATE_EVENTS.THEME_CHANGED, this.handleThemeChange);

        // Eventos de storage (para sincronização entre abas)
        window.addEventListener('storage', (e) => {
            if (e.key === taskStorage.config.key) {
                logger.info('Storage changed in another tab, reloading...');
                this.loadTasks();
            }
        });

        // Eventos de visibilidade da página
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                logger.debug('Page became visible, checking for updates...');
                this.loadTasks();
            }
        });

        // Atalhos de teclado
        document.addEventListener('keydown', this.handleKeyboardShortcuts);
    }

    /**
     * Renderiza a lista de tarefas
     */
    renderTasks() {
        try {
            const tasks = appState.getState('tasks');
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
                // Renderizar cada tarefa
                tasks.forEach(task => {
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
            }

            logger.info(`Rendered ${tasks.length} tasks`);
        } catch (error) {
            logger.error('Failed to render tasks', error);
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
                const success = await taskStorage.remove(taskId);

                if (success) {
                    // Atualizar estado
                    const tasks = appState.getState('tasks');
                    const updatedTasks = tasks.filter(t => t.id !== taskId);
                    appState.setState({ tasks: updatedTasks });

                    // Disparar evento
                    window.dispatchEvent(new CustomEvent(STATE_EVENTS.TASK_DELETED, {
                        detail: { taskId }
                    }));

                    // Re-renderizar
                    this.renderTasks();
                }
            }
        } catch (error) {
            logger.error('Failed to delete task', error);
            this.showError('Erro ao excluir tarefa');
        }
    }

    /**
     * Manipula eventos de tarefas
     * @param {CustomEvent} event - Evento customizado
     */
    handleTaskEvents(event) {
        logger.debug('Task event received', {
            type: event.type,
            detail: event.detail
        });

        // Atualizar UI
        switch (event.type) {
            case STATE_EVENTS.TASK_CREATED:
                this.renderTasks();
                this.showNotification('Tarefa criada com sucesso', 'success');
                break;
            case STATE_EVENTS.TASK_UPDATED:
                this.renderTasks();
                break;
            case STATE_EVENTS.TASK_COMPLETED:
                this.showNotification('Tarefa concluída!', 'success');
                break;
            case STATE_EVENTS.TASK_DELETED:
                this.renderTasks();
                this.showNotification('Tarefa removida', 'info');
                break;
            case STATE_EVENTS.TASKS_LOADED:
                this.renderTasks();
                break;
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
}

// Iniciar aplicação imediatamente
const taskApp = new TaskApp();

// Tornar disponível globalmente para debug
window.taskApp = taskApp;

// Exportar para uso em módulos
export default taskApp;
export { TaskApp };
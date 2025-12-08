/**
 * Logger - Sistema de logging para debug e monitoramento
 * @author Lista de Tarefas App
 * @version 1.0.0
 */

// Níveis de log
export const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
};

// Configuração padrão
const defaultConfig = {
    level: LOG_LEVELS.INFO,
    enableConsole: true,
    enableStorage: false,
    storageKey: 'app_logs',
    maxLogsInStorage: 100,
    prefix: '[ListaTarefas]',
};

class Logger {
    constructor(config = {}) {
        this.config = { ...defaultConfig, ...config };
        this.logs = [];
        this.initialize();
    }

    /**
     * Inicializa o logger
     */
    initialize() {
        // Carregar logs do storage se habilitado
        if (this.config.enableStorage) {
            this.loadFromStorage();
        }

        // Adicionar handler global de erros
        if (typeof window !== 'undefined') {
            window.addEventListener('error', (event) => {
                this.error('Global Error', {
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    error: event.error,
                });
            });

            window.addEventListener('unhandledrejection', (event) => {
                this.error('Unhandled Promise Rejection', {
                    reason: event.reason,
                });
            });
        }
    }

    /**
     * Verifica se o nível de log deve ser exibido
     * @param {number} level - Nível do log
     * @returns {boolean}
     */
    shouldLog(level) {
        return level >= this.config.level;
    }

    /**
     * Formata a mensagem de log
     * @param {string} level - Nome do nível
     * @param {string} message - Mensagem
     * @param {any} data - Dados adicionais
     * @returns {Object}
     */
    formatMessage(level, message, data = null) {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            data,
            source: this.getSource(),
        };
    }

    /**
     * Obtém a origem do log (stack trace simplificado)
     * @returns {string}
     */
    getSource() {
        try {
            const stack = new Error().stack;
            const lines = stack.split('\n');
            // Pular as 3 primeiras linhas (Error, this.formatMessage, o método de log)
            const callerLine = lines[4] || lines[3] || 'unknown';
            const match = callerLine.match(/at\s+(.+?)\s+\((.+?):(\d+):\d+\)/);
            if (match) {
                return `${match[2]}:${match[3]}`;
            }
            return 'unknown';
        } catch {
            return 'unknown';
        }
    }

    /**
     * Salva log no storage
     * @param {Object} logEntry
     */
    saveToStorage(logEntry) {
        if (!this.config.enableStorage || typeof localStorage === 'undefined') {
            return;
        }

        try {
            this.logs.push(logEntry);

            // Manter apenas os logs mais recentes
            if (this.logs.length > this.config.maxLogsInStorage) {
                this.logs = this.logs.slice(-this.config.maxLogsInStorage);
            }

            localStorage.setItem(this.config.storageKey, JSON.stringify(this.logs));
        } catch (error) {
            console.warn('Failed to save log to storage:', error);
        }
    }

    /**
     * Carrega logs do storage
     */
    loadFromStorage() {
        if (!this.config.enableStorage || typeof localStorage === 'undefined') {
            return;
        }

        try {
            const stored = localStorage.getItem(this.config.storageKey);
            if (stored) {
                this.logs = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load logs from storage:', error);
            this.logs = [];
        }
    }

    /**
     * Exibe log no console
     * @param {string} level - Nome do nível
     * @param {Object} logEntry
     */
    logToConsole(level, logEntry) {
        if (!this.config.enableConsole || typeof console === 'undefined') {
            return;
        }

        const prefix = `${this.config.prefix} [${logEntry.timestamp}] ${level}:`;
        const args = [prefix, logEntry.message];

        if (logEntry.data) {
            args.push(logEntry.data);
        }

        switch (level) {
            case 'DEBUG':
                console.debug(...args);
                break;
            case 'INFO':
                console.info(...args);
                break;
            case 'WARN':
                console.warn(...args);
                break;
            case 'ERROR':
                console.error(...args);
                break;
            default:
                console.log(...args);
        }
    }

    /**
     * Método genérico de logging
     * @param {number} level - Nível do log
     * @param {string} levelName - Nome do nível
     * @param {string} message - Mensagem
     * @param {any} data - Dados adicionais
     */
    log(level, levelName, message, data) {
        if (!this.shouldLog(level)) {
            return;
        }

        const logEntry = this.formatMessage(levelName, message, data);

        this.logToConsole(levelName, logEntry);
        this.saveToStorage(logEntry);
    }

    /**
     * Log de nível DEBUG
     * @param {string} message - Mensagem
     * @param {any} data - Dados adicionais
     */
    debug(message, data) {
        this.log(LOG_LEVELS.DEBUG, 'DEBUG', message, data);
    }

    /**
     * Log de nível INFO
     * @param {string} message - Mensagem
     * @param {any} data - Dados adicionais
     */
    info(message, data) {
        this.log(LOG_LEVELS.INFO, 'INFO', message, data);
    }

    /**
     * Log de nível WARN
     * @param {string} message - Mensagem
     * @param {any} data - Dados adicionais
     */
    warn(message, data) {
        this.log(LOG_LEVELS.WARN, 'WARN', message, data);
    }

    /**
     * Log de nível ERROR
     * @param {string} message - Mensagem
     * @param {any} data - Dados adicionais
     */
    error(message, data) {
        this.log(LOG_LEVELS.ERROR, 'ERROR', message, data);
    }

    /**
     * Limpa todos os logs
     */
    clear() {
        this.logs = [];
        if (this.config.enableStorage && typeof localStorage !== 'undefined') {
            localStorage.removeItem(this.config.storageKey);
        }
        console.clear();
    }

    /**
     * Obtém todos os logs
     * @returns {Array}
     */
    getLogs() {
        return [...this.logs];
    }

    /**
     * Obtém logs por nível
     * @param {string} level - Nível desejado
     * @returns {Array}
     */
    getLogsByLevel(level) {
        return this.logs.filter(log => log.level === level);
    }

    /**
     * Exporta logs como string formatada
     * @returns {string}
     */
    exportLogs() {
        return this.logs
            .map(log => `${log.timestamp} [${log.level}] ${log.message} ${log.source}`)
            .join('\n');
    }

    /**
     * Configura o nível de log
     * @param {number} level - Novo nível
     */
    setLevel(level) {
        this.config.level = level;
    }

    /**
     * Habilita/desabilita logging no console
     * @param {boolean} enable - Habilitar logging
     */
    enableConsole(enable) {
        this.config.enableConsole = enable;
    }

    /**
     * Habilita/desabilita persistência no storage
     * @param {boolean} enable - Habilitar storage
     */
    enableStorage(enable) {
        this.config.enableStorage = enable;
        if (enable) {
            this.loadFromStorage();
        }
    }
}

// Instância global do logger
export const logger = new Logger();

// Exportar a classe para permitir múltiplas instâncias se necessário
export default Logger;
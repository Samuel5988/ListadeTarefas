/**
 * Sound Service - Serviço de áudio usando Web Audio API
 * Gera alertas sonoros sintéticos sem necessidade de arquivos externos
 * @author Lista de Tarefas App
 * @version 1.2.0
 */

import { logger } from '../utils/logger.js';

/**
 * Configurações padrão do som
 */
const DEFAULT_SOUND_CONFIG = {
    frequency: 880,        // Frequência em Hz (A5 - La)
    duration: 200,         // Duração em ms
    volume: 0.3,           // Volume (0 a 1)
    type: 'sine',          // Tipo de onda: 'sine', 'square', 'sawtooth', 'triangle'
    beepCount: 2,          // Número de beeps sequenciais
    beepInterval: 150,     // Intervalo entre beeps em ms
};

/**
 * Serviço de som usando Web Audio API (Oscilador)
 * Não requer arquivos de áudio externos
 */
export class SoundService {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.config = { ...DEFAULT_SOUND_CONFIG };

        // Controle de som intermitente
        this.activeReminderId = null;  // ID da tarefa com lembrete ativo
        this.intervalId = null;        // Intervalo do som intermitente
        this.timeoutId = null;         // Timeout para parar automaticamente
        this.maxDuration = 60000;      // 1 minuto máximo de som

        // Controle de retomada do AudioContext
        this.resumeAttemptCount = 0;
        this.maxResumeAttempts = 5;

        // Bind métodos
        this.playReminderBeep = this.playReminderBeep.bind(this);
        this.handleUserInteraction = this.handleUserInteraction.bind(this);

        // Configurar listener de interação do usuário
        this.setupUserInteractionListener();
    }

    /**
     * Configura listener para retomar AudioContext em qualquer interação do usuário
     */
    setupUserInteractionListener() {
        if (typeof window === 'undefined') return;

        const events = [
            'click',
            'keydown',
            'mousedown',
            'touchstart',
            'pointerdown'
        ];

        // Usar capture phase e { once: true } para não interferir muito
        const resumeHandler = () => {
            this.attemptResumeAudioContext();
        };

        events.forEach(eventName => {
            document.addEventListener(eventName, resumeHandler, { once: true, capture: true });
        });

        logger.info('User interaction listeners configured for AudioContext resume');
    }

    /**
     * Tenta retomar o AudioContext
     * @returns {Promise<boolean>} True se conseguiu retomar
     */
    async attemptResumeAudioContext() {
        if (!this.audioContext) {
            return false;
        }

        if (this.audioContext.state === 'running') {
            return true;
        }

        if (this.audioContext.state === 'suspended') {
            try {
                logger.info('Attempting to resume AudioContext...', {
                    state: this.audioContext.state,
                    attempt: this.resumeAttemptCount + 1
                });

                await this.audioContext.resume();

                logger.info('AudioContext resumed successfully!');

                // Disparar evento para notificar que o áudio está pronto
                window.dispatchEvent(new CustomEvent('sound:audio-context-ready'));

                return true;
            } catch (err) {
                this.resumeAttemptCount++;
                logger.warn('Failed to resume AudioContext', {
                    attempt: this.resumeAttemptCount,
                    error: err.message
                });

                if (this.resumeAttemptCount >= this.maxResumeAttempts) {
                    logger.error('Max resume attempts reached, giving up');
                    return false;
                }
            }
        }

        return false;
    }

    /**
     * Manipula interação do usuário
     */
    handleUserInteraction() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.attemptResumeAudioContext();
        }
    }

    /**
     * Inicializa o AudioContext (deve ser chamado após interação do usuário)
     * @returns {Promise<boolean>} True se inicializado com sucesso
     */
    async init() {
        if (this.audioContext) {
            // Se já existe, tentar retomar se estiver suspenso
            if (this.audioContext.state === 'suspended') {
                return await this.attemptResumeAudioContext();
            }
            return true;
        }

        try {
            // Criar AudioContext
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass();

            logger.info('SoundService initialized', {
                sampleRate: this.audioContext.sampleRate,
                state: this.audioContext.state
            });

            // Tentar retomar se estiver suspenso (browsers exigem interação do usuário)
            if (this.audioContext.state === 'suspended') {
                const resumed = await this.attemptResumeAudioContext();
                if (resumed) {
                    logger.info('AudioContext resumed after init');
                }
            }

            return true;
        } catch (error) {
            logger.error('Failed to initialize SoundService', error);
            this.audioContext = null;
            return false;
        }
    }

    /**
     * Toca um beep usando oscilador
     * @param {Object} options - Opções do som
     * @returns {Promise<void>}
     */
    async playBeep(options = {}) {
        if (!this.enabled) {
            logger.debug('Sound disabled, skipping beep');
            return;
        }

        // Inicializar AudioContext se necessário
        if (!this.audioContext) {
            logger.info('AudioContext not initialized, initializing now...');
            this.init();
        }

        if (!this.audioContext) {
            logger.error('AudioContext still not available after init attempt');
            return;
        }

        // Tentar retomar se estiver suspenso
        if (this.audioContext.state === 'suspended') {
            logger.info('AudioContext is suspended, attempting to resume...');
            const resumed = await this.attemptResumeAudioContext();
            if (!resumed) {
                logger.warn('Could not resume AudioContext, skipping beep');
                return;
            }
        }

        const config = { ...this.config, ...options };

        logger.info('Playing beep', {
            frequency: config.frequency,
            duration: config.duration,
            volume: config.volume,
            audioContextState: this.audioContext.state
        });

        try {
            // Criar oscilador
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            // Configurar tipo de onda e frequência
            oscillator.type = config.type;
            oscillator.frequency.setValueAtTime(config.frequency, this.audioContext.currentTime);

            // Configurar envelope de volume (attack e release)
            const currentTime = this.audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, currentTime);
            gainNode.gain.linearRampToValueAtTime(config.volume, currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + (config.duration / 1000));

            // Conectar oscilador -> gain -> saída
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Iniciar e parar oscilador
            oscillator.start(currentTime);
            oscillator.stop(currentTime + (config.duration / 1000));

            logger.debug('Beep played successfully', config);

        } catch (error) {
            logger.error('Error playing beep', error);
        }
    }

    /**
     * Toca uma sequência de beeps para notificação de lembrete
     * @returns {Promise<void>}
     */
    async playReminderBeep() {
        if (!this.enabled) {
            return;
        }

        logger.info('Playing reminder beep');

        // Tocar beeps sequenciais
        for (let i = 0; i < this.config.beepCount; i++) {
            await this.playBeep();
            if (i < this.config.beepCount - 1) {
                await this.delay(this.config.beepInterval);
            }
        }
    }

    /**
     * Inicia som intermitente para um lembrete
     * @param {string} taskId - ID da tarefa com lembrete
     * @param {Object} options - Opções configuráveis
     */
    startIntermittentReminder(taskId, options = {}) {
        if (!this.enabled) {
            logger.debug('Sound disabled, not starting intermittent reminder');
            return;
        }

        // Se já há um lembrete ativo, parar antes de iniciar outro
        if (this.activeReminderId) {
            this.stopReminderSound();
        }

        const {
            interval = 3000,  // Tocar a cada 3 segundos
            maxDuration = this.maxDuration  // Máximo de 1 minuto
        } = options;

        this.activeReminderId = taskId;

        logger.info('Starting intermittent reminder sound', {
            taskId,
            interval: `${interval / 1000}s`,
            maxDuration: `${maxDuration / 1000}s`
        });

        // Tocar imediatamente
        this.playReminderBeep().catch(err => {
            logger.error('Error playing initial reminder beep', err);
        });

        // Configurar som intermitente
        this.intervalId = setInterval(() => {
            this.playReminderBeep().catch(err => {
                logger.error('Error playing intermittent reminder beep', err);
            });
        }, interval);

        // Parar automaticamente após maxDuration
        this.timeoutId = setTimeout(() => {
            logger.info('Max duration reached, stopping reminder sound', { taskId });
            this.stopReminderSound();
        }, maxDuration);

        // Dispatch evento para UI saber que lembrete está ativo
        window.dispatchEvent(new CustomEvent('reminder:sound:started', {
            detail: { taskId }
        }));
    }

    /**
     * Para o som intermitente do lembrete
     * @param {string} taskId - ID da tarefa (opcional, para verificação)
     */
    stopReminderSound(taskId = null) {
        // Se taskId fornecido, verificar se corresponde ao lembrete ativo
        if (taskId && this.activeReminderId !== taskId) {
            logger.debug('TaskId does not match active reminder, not stopping', {
                requested: taskId,
                active: this.activeReminderId
            });
            return;
        }

        if (!this.activeReminderId) {
            logger.debug('No active reminder to stop');
            return;
        }

        const stoppedTaskId = this.activeReminderId;

        // Limpar intervalo
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        // Limpar timeout
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }

        this.activeReminderId = null;

        logger.info('Reminder sound stopped', { taskId: stoppedTaskId });

        // Dispatch evento para UI saber que lembrete parou
        window.dispatchEvent(new CustomEvent('reminder:sound:stopped', {
            detail: { taskId: stoppedTaskId }
        }));
    }

    /**
     * Verifica se há um lembrete ativo
     * @returns {boolean}
     */
    isReminderActive() {
        return this.activeReminderId !== null;
    }

    /**
     * Retorna o ID do lembrete ativo
     * @returns {string|null}
     */
    getActiveReminderId() {
        return this.activeReminderId;
    }

    /**
     * Toca beep de sucesso
     */
    async playSuccessBeep() {
        await this.playBeep({
            frequency: 1047, // C6
            beepCount: 1
        });
    }

    /**
     * Toca beep de erro
     */
    async playErrorBeep() {
        await this.playBeep({
            frequency: 220, // A3
            type: 'square',
            beepCount: 1
        });
    }

    /**
     * Toca beep de aviso/info
     */
    async playInfoBeep() {
        await this.playBeep({
            frequency: 659, // E5
            beepCount: 1
        });
    }

    /**
     * Habilita ou desabilita o som
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.enabled = Boolean(enabled);
        logger.info('Sound ' + (this.enabled ? 'enabled' : 'disabled'));
    }

    /**
     * Verifica se o som está habilitado
     * @returns {boolean}
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Atualiza configurações do som
     * @param {Object} config - Nova configuração
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
        logger.debug('Sound config updated', this.config);
    }

    /**
     * Retorna a configuração atual
     * @returns {Object}
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Delay helper (ms)
     * @param {number} ms
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Testa o som
     */
    async test() {
        logger.info('Testing sound...');
        await this.playReminderBeep();
    }

    /**
     * Retorna status do serviço
     */
    getStatus() {
        return {
            enabled: this.enabled,
            audioContextState: this.audioContext?.state || 'not_initialized',
            config: this.config,
            activeReminderId: this.activeReminderId,
            isReminderActive: this.isReminderActive()
        };
    }

    /**
     * Limpa recursos
     */
    dispose() {
        // Parar som intermitente se estiver ativo
        this.stopReminderSound();

        if (this.audioContext) {
            this.audioContext.close().then(() => {
                logger.info('SoundService disposed');
            }).catch(err => {
                logger.error('Error disposing SoundService', err);
            });
            this.audioContext = null;
        }
    }
}

// Instância global
export const soundService = new SoundService();

// Expor globalmente para debug/teste via console
if (typeof window !== 'undefined') {
    window.soundService = soundService;

    // Testar som (inicializa e toca)
    window.testSound = async () => {
        console.log('🔊 Testing sound...');
        console.log('SoundService status:', soundService.getStatus());
        await soundService.init();
        await soundService.test();
    };

    // Inicializar AudioContext manualmente
    window.initAudioContext = async () => {
        console.log('🎵 Initializing AudioContext...');
        const result = await soundService.init();
        console.log('AudioContext initialized:', result);
        console.log('AudioContext state:', soundService.audioContext?.state);
        return result;
    };

    // Tentar retomar AudioContext
    window.resumeAudioContext = async () => {
        console.log('🎵 Resuming AudioContext...');
        const result = await soundService.attemptResumeAudioContext();
        console.log('AudioContext resumed:', result);
        return result;
    };

    console.log('💡 Sound debugging commands available:');
    console.log('   - window.soundService');
    console.log('   - window.testSound()');
    console.log('   - window.initAudioContext()');
    console.log('   - window.resumeAudioContext()');
}

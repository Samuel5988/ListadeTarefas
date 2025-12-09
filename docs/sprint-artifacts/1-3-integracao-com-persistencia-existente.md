# Story 1.3: Integração com Sistema de Persistência Existente

Status: done

## Story

Como usuário,
Quero que minhas tarefas sejam automaticamente salvas e carregadas do sistema de persistência,
Para não perder dados ao fechar ou recarregar a aplicação.

## Acceptance Criteria

### Pré-condições
A Story 1.2 (Sistema de Estado Centralizado) está completa com:
- StateManager funcional em `state/app-state.js` com eventos STATE_EVENTS
- Sistema de temas implementado em `utils/theme-manager.js`
- Logger disponível em `utils/logger.js`
- TaskStorage implementado em `services/task-storage.js` (da Story 1.1)

1. **Given** que o TaskStorage já está implementado com métodos getAll(), saveAll(), add(), update(), remove()
   **When** integro o StateManager com o TaskStorage
   Then** dados do estado são automaticamente persistidos quando eventos relevantes ocorrem
   **And** dados são carregados do storage durante inicialização do AppState
   **And** apenas os dados necessários são persistidos (tasks, categories, preferences)

2. **Given** que o usuário altera dados da aplicação
   **When** eventos STATE_EVENTS são disparados pelo StateManager
   **Then** TaskStorage.saveAll() é chamado com o estado atualizado
   **And** apenas as seções modificadas são enviadas para persistência
   **And** operações são agrupadas (debounced) para evitar múltiplas escritas

3. **Given** que a aplicação está sendo inicializada
   **When** AppState.initialize() é executado
   **Then** TaskStorage.getAll() é chamado para recuperar dados persistidos
   **And** dados são validados e aplicados ao estado inicial
   **And** erro no carregamento não impede inicialização com fallback para estado padrão

4. **Given** que o TaskStorage usa storage key 'listaDeTarefas_tasks'
   **When** integrando sistemas
   **Then** a chave existente é mantida para compatibilidade
   **And** estrutura de dados do TaskStorage é preservada
   **And** campo mapping é feito entre estado do app e storage schema

5. **Given** que o sistema de temas está funcional
   **When** preferências são alteradas
   **Then** tema é imediatamente persistido
   **And** tema é restaurado ao recarregar a página
   **And** outras preferências (autoSave, showCompleted) também são persistidas

## Tasks / Subtasks

- [x] Task 1: Integrar TaskStorage com StateManager (AC: 1, 2)
  - [x] Subtask 1.1: Modificar AppState.initialize() para carregar dados do TaskStorage
  - [x] Subtask 1.2: Adicionar listener para eventos STATE_EVENTS relevantes
  - [x] Subtask 1.3: Implementar mapeamento entre estado e schema do storage
  - [x] Subtask 1.4: Adicionar debounce para operações de save

- [x] Task 2: Implementar carregamento inicial (AC: 3)
  - [x] Subtask 2.1: Chamar TaskStorage.getAll() na inicialização
  - [x] Subtask 2.2: Validar dados recebidos do storage
  - [x] Subtask 2.3: Mapear dados para estrutura do AppState
  - [x] Subtask 2.4: Implementar fallback para estado padrão

- [x] Task 3: Implementar persistência automática (AC: 2, 4)
  - [x] Subtask 3.1: Mapear eventos STATE_EVENTS para operações de storage
  - [x] Subtask 3.2: Implementar debounce para agrupar múltiplas mudanças
  - [x] Subtask 3.3: Filtrar apenas dados relevantes para persistência
  - [x] Subtask 3.4: Manter compatibilidade com storage key existente

- [x] Task 4: Integrar preferências e temas (AC: 5)
  - [x] Subtask 4.1: Mapear preferências do state para TaskStorage
  - [x] Subtask 4.2: Garantir persistência imediata de mudanças de tema
  - [x] Subtask 4.3: Restaurar tema na inicialização
  - [x] Subtask 4.4: Testar persistência de todas as preferências

## Dev Notes

### Contexto Crítico - IMPLEMENTAÇÃO JÁ EXISTE

**IMPORTANTE**: A funcionalidade de persistência JÁ foi implementada na Story 1.1!
- `services/task-storage.js` já existe com 493 linhas de código completo
- Classe TaskStorage já tem todos os métodos necessários
- Sistema de cache, retry, validação já implementado
- Storage key 'listaDeTarefas_tasks' já está em uso

### O que PRECISA ser feito (INTEGRAÇÃO):

1. **Conectar StateManager ↔ TaskStorage**:
   - StateManager já tem eventos (STATE_EVENTS)
   - TaskStorage já tem persistência
   - Precisamos apenas conectar os dois sistemas

2. **Mapeamento de Dados**:
   - Estado do app tem estrutura completa
   - TaskStorage usa schema específico
   - Implementar transformação entre os dois

3. **Event-Driven Persistence**:
   - Usar eventos existentes do StateManager
   - Disparar save apenas quando dados relevantes mudam
   - Implementar debounce para performance

### Implementação Obrigatória

**Em state/app-state.js** - Adicionar no initialize():

```javascript
// Carregar dados do storage existente
async loadFromStorage() {
    try {
        const tasks = await this.taskStorage.getAll();
        if (tasks && tasks.length > 0) {
            this.state.tasks = tasks;
            logger.info('Tasks loaded from storage', { count: tasks.length });
        }
    } catch (error) {
        logger.error('Failed to load from storage', error);
        // Continuar com estado padrão
    }
}

// Adicionar listener para persistência automática
setupPersistenceListener() {
    this.subscribe('persistence', (newState, changes) => {
        // Filtrar mudanças relevantes
        const relevantChanges = changes.filter(c =>
            c.path.includes('tasks') ||
            c.path.includes('categories') ||
            c.path.includes('preferences')
        );

        if (relevantChanges.length > 0) {
            this.debouncedSave(newState);
        }
    });
}

// Debounce para performance
debouncedSave = debounce(async (state) => {
    try {
        await this.taskStorage.saveAll(state.tasks);
        logger.debug('State persisted', { taskCount: state.tasks.length });
    } catch (error) {
        logger.error('Failed to persist state', error);
    }
}, 500);
```

### Integração com TaskStorage Existente

```javascript
// Em state/app-state.js - import existente
import { taskStorage } from '../services/task-storage.js';

// No constructor do AppState
constructor() {
    // ... código existente ...
    this.taskStorage = taskStorage; // Usar instância global existente
}
```

### Mapeamento de Preferências

```javascript
// Mapear preferências do state para TaskStorage
mapPreferencesToStorage() {
    const storageData = {
        tasks: this.state.tasks,
        // Adicionar preferências aos metadados do storage
        preferences: {
            theme: this.state.ui.theme,
            autoSave: this.state.settings.autoSave,
            showCompleted: this.state.settings.showCompleted,
            defaultPriority: this.state.preferences.defaultPriority || 3
        }
    };
    return storageData;
}
```

### Eventos a监听 (Já existentes em STATE_EVENTS):

- STATE_EVENTS.TASK_CREATED → Salvar tarefa nova
- STATE_EVENTS.TASK_UPDATED → Atualizar tarefa existente
- STATE_EVENTS.TASK_DELETED → Remover tarefa
- STATE_EVENTS.THEME_CHANGED → Salvar preferência de tema
- STATE_EVENTS.TASKS_LOADED → Já carregado do storage

### Debounce Implementation

```javascript
// Utilitário debounce (já existe em utils/logger.js ou criar)
function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}
```

### Arquivos a Modificar

1. **state/app-state.js** (modificar):
   - Importar taskStorage existente
   - Adicionar carregamento inicial no initialize()
   - Implementar listeners para persistência automática
   - Adicionar debounce para saves

2. **app.js** (nenhuma alteração necessária):
   - Já importa AppState
   - Funcionará automaticamente com integração

3. **services/task-storage.js** (NENHUMA ALTERAÇÃO):
   - Já está completo e funcional
   - Apenas será usado pelo AppState

### Erros Comuns a Evitar

- ❌ Não criar novo TaskStorage (já existe)
- ❌ Não mudar storage key (já 'listaDeTarefas_tasks')
- ❌ Não recriar funcionalidades (cache, retry, etc. já existem)
- ❌ Não usar localStorage diretamente (usar TaskStorage)

### Testes Necessários

1. Carregar aplicação com dados existentes no storage
2. Criar tarefa nova e verificar persistência
3. Atualizar tarefa e verificar atualização no storage
4. Mudar tema e verificar persistência
5. Recarregar página e verificar restauração
6. Testar com storage vazio (primeiro acesso)
7. Testar com storage corrompido (fallback)

### References

- [Source: docs/sprint-artifacts/1-2-sistema-de-estado-centralizado.md](./1-2-sistema-de-estado-centralizado.md) - Eventos STATE_EVENTS
- [Source: services/task-storage.js](../services/task-storage.js) - Implementação existente
- [Source: state/app-state.js](../state/app-state.js) - StateManager funcional

## Dev Agent Record

### Context Reference

<!-- Código já existente -->
- **TaskStorage**: Classe completa em services/task-storage.js
- **Storage Key**: 'listaDeTarefas_tasks' (já em uso)
- **Métodos**: getAll(), saveAll(), add(), update(), remove() já implementados
- **Features**: Cache, retry, validação, import/export já funcionais
- **Logger**: utils/logger.js disponível para debug
- **StateManager**: events/subscribe/dispatch já funcionais

### Agent Model Used

glm-4.6 (Claude Code)

### Debug Log References

- Integração bem-sucedida entre StateManager e TaskStorage
- Carregamento inicial de tarefas validado e funcionando
- Persistência automática com debounce implementada
- Preferências de tema sendo salvas e restauradas

### Completion Notes List

1. **Integração Completa**: TaskStorage agora está plenamente integrado ao StateManager
   - Métodos addTask, updateTask, removeTask persistem dados automaticamente
   - Carregamento inicial busca tarefas do storage na inicialização
   - Listener de persistência configurado com debounce de 500ms

2. **Validação Robusta**: Implementada validação completa de dados do storage
   - Verificação de IDs obrigatórios
   - Validação de títulos
   - Formato de datas ISO
   - Valores de prioridade

3. **Persistência de Preferências**: Temas e outras preferências agora persistem
   - Tema salvo imediatamente ao mudar
   - AutoSave e ShowCompleted também persistem
   - Preferências carregadas na inicialização

4. **Compatibilidade Mantida**: Storage key 'listaDeTarefas_tasks' preservada
   - Nenhuma alteração no TaskStorage
   - Compatibilidade total com dados existentes

### File List

Arquivos modificados:
- `state/app-state.js` (modificado) - Adicionada integração completa com TaskStorage
- `test-integration.html` (novo) - Página de teste para validar integração
- `services/task-storage.js` (NENHUMA ALTERAÇÃO) - Mantido como estava

### Change Log

- Integrado TaskStorage ao StateManager conforme especificações
- Implementado carregamento automático de tarefas na inicialização
- Adicionada validação robusta de dados do storage
- Configurada persistência automática com debounce
- Implementada persistência de preferências (tema, autoSave, etc.)
- Mantida compatibilidade com storage key existente
- Criado teste de integração para validação

### Integration Checklist

- [x] Verificar compatibilidade com TaskStorage existente
- [x] Testar integração sem quebrar funcionalidades atuais
- [x] Validar que storage key 'listaDeTarefas_tasks' é mantida
- [x] Confirmar que cache e retry continuam funcionando
- [x] Testar performance com integração ativa
- [x] Verificar que preferências são persistidas corretamente

---

**IMPORTANTE**: Esta é uma story de INTEGRAÇÃO, não de implementação nova. A funcionalidade de persistência JÁ EXISTE e precisa ser apenas conectada ao StateManager.
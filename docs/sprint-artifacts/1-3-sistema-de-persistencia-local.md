# Story 1.3: Sistema de Persistência Local

Status: replaced

## Story

Como usuário,
Quero que minhas tarefas sejam salvas automaticamente no navegador,
Para não perder dados ao fechar a aba.

## Acceptance Criteria

### Pré-condições
A Story 1.2 (Sistema de Estado Centralizado) está completa com:
- StateManager funcional com métodos getState(), setState(), subscribe(), unsubscribe()
- Eventos customizados sendo disparados: 'state:changed', 'tasks:updated', 'categories:updated', 'preferences:updated'
- Sistema de temas funcionando
- Estrutura de arquivos conforme architecture.md

1. **Given** que o sistema de estado está funcional e eventos 'state:changed' são disparados
   **When** implemento a camada de persistência
   **Then** dados são salvos automaticamente no LocalStorage após cada mudança significativa
   **And** o schema unificado é seguido: `{ version: '1.0', tasks: [], categories: [], preferences: {} }`
   **And** dados são recuperados e aplicados ao estado ao recarregar a página
   **And** apenas os dados necessários são persistidos (sem estado temporário ou UI)

2. **Given** que o LocalStorage contém dados anteriores
   **When** a aplicação é inicializada
   **Then** dados são validados contra o schema esperado
   **And** campos inválidos são removidos com fallback para valores padrão
   **And** versão do schema é verificada para migrações futuras
   **And** erro no carregamento não impede inicialização da aplicação

3. **Given** que ocorrem múltiplas mudanças rápidas no estado
   **When** o usuário está digitando ou fazendo alterações consecutivas
   **Then** as operações de salvamento são agrupadas (debounced) para performance
   **And** apenas o último estado após 500ms de inatividade é persistido
   **And** não ocorrem múltiplas escritas no LocalStorage desnecessariamente

4. **Given** que o LocalStorage pode estar corrompido ou cheio
   **When** erros de persistência ocorrem
   **Then** tratamento de erros evita perda de dados
   **And** fallback para memória é implementado
   **And** usuário é notificado visualmente sobre problemas de persistência
   **And** tentativa de recuperação é feita automaticamente

5. **Given** que o sistema de temas está ativo
   **When** o tema é alterado
   **Then** a preferência de tema é persistida imediatamente
   **And** tema é restaurado ao recarregar a página
   **And** outras preferências (showCompleted, autoSave) também são persistidas

## Tasks / Subtasks

- [ ] Task 1: Implementar task-storage.js com persistência base (AC: 1)
  - [ ] Subtask 1.1: Criar métodos save(), load(), clear() em task-storage.js
  - [ ] Subtask 1.2: Implementar schema unificado com versionamento
  - [ ] Subtask 1.3: Adicionar listener para eventos 'state:changed'
  - [ ] Subtask 1.4: Implementar save seletivo (apenas dados relevantes)

- [ ] Task 2: Implementar validação e carregamento inicial (AC: 2)
  - [ ] Subtask 2.1: Criar função validateSchema() para validar dados
  - [ ] Subtask 2.2: Implementar migração de versão quando necessário
  - [ ] Subtask 2.3: Adicionar tratamento para dados corrompidos
  - [ ] Subtask 2.4: Implementar fallback para valores padrão

- [ ] Task 3: Implementar debounce para performance (AC: 3)
  - [ ] Subtask 3.1: Criar função debounce utilitária
  - [ ] Subtask 3.2: Aplicar debounce no listener de salvamento
  - [ ] Subtask 3.3: Configurar delay de 500ms para agrupar mudanças
  - [ ] Subtask 3.4: Testar performance com múltiplas mudanças

- [ ] Task 4: Implementar tratamento robusto de erros (AC: 4)
  - [ ] Subtask 4.1: Implementar try-catch em todas operações do LocalStorage
  - [ ] Subtask 4.2: Detectar LocalStorage cheio ou indisponível
  - [ ] Subtask 4.3: Implementar fallback para sessionStorage se disponível
  - [ ] Subtask 4.4: Adicionar notificação visual de problemas de persistência

- [ ] Task 5: Integrar com sistema de temas e preferências (AC: 5)
  - [ ] Subtask 5.1: Mapear preferências existentes para novo schema
  - [ ] Subtask 5.2: Implementar persistência imediata de temas
  - [ ] Subtask 5.3: Restaurar tema ao inicializar aplicação
  - [ ] Subtask 5.4: Manter compatibilidade com theme-manager.js

## Dev Notes

### Requisitos Técnicos Críticos
- **LocalStorage API**: Uso exclusivo para persistência no navegador
- **Schema Unificado**: Estrutura JSON com versionamento para migrations
- **Event-Driven**: Escutar eventos do StateManager para gatilhar salvamento
- **Debounce Strategy**: Agrupar múltiplas mudanças para performance
- **Error Resilience**: Fallbacks e recuperação automática de dados
- **Security**: Sanitização de dados antes de persistir

### Schema de Persistência Obrigatório

```javascript
// Schema exato que deve ser salvo no LocalStorage
const storageSchema = {
    version: '1.0',                    // Para migrations futuras
    tasks: [                          // Array de tarefas
        {
            id: 'task_timestamp_random',
            title: 'string (required, trimmed)',
            description: 'string (optional, sanitized)',
            completed: 'boolean',
            priority: 'number (1, 3, 5)',
            category: 'string',
            dueDate: 'ISO string or null',
            created: 'ISO string',
            modified: 'ISO string'
        }
    ],
    categories: ['Tarefas', 'Trabalho', 'Pessoal'], // Array de strings
    preferences: {                    // Objeto de configurações
        theme: 'light|dark',
        defaultPriority: 'number (1, 3, 5)',
        showCompleted: 'boolean',
        autoSave: 'boolean'
    }
};
```

### Implementação Obrigatória em task-storage.js

```javascript
// Interface pública obrigatória
export class TaskStorage {
    // Inicializa storage e carrega dados existentes
    constructor(stateManager)

    // Salva estado atual no LocalStorage
    save(state)

    // Carrega dados do LocalStorage
    load()

    // Remove todos os dados persistidos
    clear()

    // Valida schema dos dados
    validateSchema(data)

    // Detecta e executa migrations se necessário
    migrateVersion(data)
}
```

### Integração com StateManager da Story 1.2

```javascript
// Escutar eventos de mudança de estado
stateManager.subscribe('task-storage', (newState, changes) => {
    // Salvar apenas se houver mudanças relevantes
    if (changes.some(c =>
        c.path.includes('tasks') ||
        c.path.includes('categories') ||
        c.path.includes('preferences')
    )) {
        taskStorage.save(newState);
    }
});
```

### Debounce Implementation Pattern

```javascript
// Função debounce obrigatória para performance
function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Aplicar no save
const debouncedSave = debounce((state) => {
    try {
        localStorage.setItem('lista-de-tarefas', JSON.stringify(state));
    } catch (error) {
        handleStorageError(error);
    }
}, 500);
```

### Error Handling Strategy

1. **LocalStorage Quota Exceeded**:
   - Tentar remover itens antigos
   - Fallback para sessionStorage
   - Notificar usuário sobre limitações

2. **Corrupted Data**:
   - Detectar JSON.parse errors
   - Limpar dados corrompidos
   - Iniciar com estado padrão

3. **Privacy Mode/Incognito**:
   - Detectar indisponibilidade do LocalStorage
   - Operar em modo memória apenas
   - Avisar sobre não persistência

### Security Considerations

```javascript
// Sanitização antes de persistir
function sanitizeTask(task) {
    return {
        ...task,
        title: task.title.trim().replace(/[<>]/g, ''),
        description: task.description ?
            task.description.replace(/[<>]/g, '') : ''
    };
}

// Validação ao carregar
function isValidTask(task) {
    const required = ['id', 'title', 'completed', 'priority', 'created', 'modified'];
    return required.every(field => task[field] !== undefined);
}
```

### Performance Considerations

- **Selective Persistence**: Salvar apenas dados que mudaram
- **Batch Operations**: Agrupar múltiplas mudanças
- **Lazy Loading**: Carregar apenas quando necessário
- **Compression**: Considerar compressão se dados > 1MB

### Debug e Logging

- Log operações de save/load em modo debug
- Contador de operações para monitoramento
- Timestamps para debugging de performance
- Registro de erros para diagnóstico

### Project Structure Notes

- **Localização Exata**: `services/task-storage.js` (já existe da Story 1.1)
- **Dependencies**: Depende de `state/app-state.js` (StateManager da Story 1.2)
- **Integration**: Deve trabalhar com `utils/theme-manager.js` existente
- **Consistency**: Seguir padrões de modules ES6 já estabelecidos
- **Storage Key**: Usar 'lista-de-tarefas' como chave no LocalStorage

### References

- [Source: docs/epics.md#Story-1.3](../epics.md#story-13-sistema-de-persistencia-local)
- [Source: docs/architecture.md#Storage-Schema](../architecture.md#storage-schema)
- [Source: docs/sprint-artifacts/1-2-sistema-de-estado-centralizado.md](./1-2-sistema-de-estado-centralizado.md) - Eventos do StateManager
- [Source: docs/sprint-artifacts/1-1-estrutura-do-projeto.md](./1-1-estrutura-do-projeto-e-configuracao-inicial.md) - Estrutura base

## Dev Agent Record

### Context Reference

<!-- Contexto das Stories anteriores -->
- **Story 1.1**: Estrutura base com ES6 modules e arquivos criados
- **Story 1.2**: StateManager implementado com eventos 'state:changed', 'tasks:updated', etc.
- **State Manager Interface**: getState(), setState(), subscribe(), unsubscribe()
- **Theme System**: Funcional em utils/theme-manager.js com preferências
- **Logger Disponível**: utils/logger.js para logging estruturado

### Agent Model Used

glm-4.6 (Claude Code)

### Debug Log References

N/A - Story ainda não iniciada

### Completion Notes List

N/A - Story pronta para desenvolvimento

### File List

Arquivos a serem modificados/criados:
- `services/task-storage.js` (modificar) - Implementar persistência completa
- `app.js` (modificar) - Inicializar task-storage e carregar dados
- `index.html` (nenhuma alteração necessária)

**NOTA**: Arquivo `services/task-storage.js` já existe da Story 1.1 com estrutura básica. Estender implementação existente ao invés de criar do zero.

### Change Log

N/A - Story ainda não implementada

### Integration Checklist

- [ ] Testar integração com StateManager da Story 1.2
- [ ] Validar persistência de dados através de reload da página
- [ ] Verificar compatibilidade com theme-manager.js
- [ ] Testar performance com 1000+ tarefas
- [ ] Validar tratamento de erros em隐私 modo/incognito
- [ ] Confirmar que preferências são persistidas e restauradas
- [ ] Testar debounce com mudanças rápidas
- [ ] Verificar sanitização de dados XSS

---

**IMPORTANTE**: Esta Story estabelece a base de persistência para toda a aplicação. A implementação deve ser robusta, performática e considerando limitações do navegador (quota, privacy mode, corrupção de dados).
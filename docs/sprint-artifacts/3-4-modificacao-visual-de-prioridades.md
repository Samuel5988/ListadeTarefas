# Story 3.4: Modificação Visual de Prioridades

Status: done

## Story

Como usuário ajustando planejamento, quero modificar prioridades visualmente sem abrir formulários complexos para fazer ajustes rápidos de planejamento.

## Acceptance Criteria

**Given** que vejo minha lista de tarefas com indicadores de prioridade
**When** interajo com os indicadores de prioridade (click na borda esquerda do card)
**Then** consigo ciclar entre prioridades clicando no indicador

**And** mudança tem feedback visual imediato (cor da borda muda suavemente)
**And** nova prioridade é salva automaticamente no LocalStorage
**And** lista reordena se necessário (se ordenação por prioridade estiver ativa)
**And** cores transicionam suavemente entre prioridades
**And** ciclo segue ordem: Baixa (verde) → Média (amarelo) → Alta (vermelho) → Baixa

## Tasks / Subtasks

- [x] Verificar implementação existente de prioridades (AC: Given)
  - [x] Confirmar indicadores visuais existentes (borda esquerda colorida)
  - [x] Confirmar campo priority no schema
  - [x] Confirmar storage.update() funciona
  - [x] Confirmar classes CSS de prioridade aplicadas
- [x] Implementar click handler na borda de prioridade (AC: 1, 6)
  - [x] Adicionar elemento clicável na borda esquerda do card
  - [x] Implementar lógica de ciclo: low → medium → high → low
  - [x] Adicionar cursor pointer no hover da borda
  - [x] Prevenir conflito com outros clicks do card
- [x] Implementar feedback visual e salvamento (AC: 2, 3)
  - [x] Atualizar classe CSS imediatamente no click
  - [x] Chamar taskStorage.update() para salvar nova prioridade
  - [x] Adicionar transição CSS suave para mudança de cor
  - [x] Disparar evento task:priority-changed para AppState
- [x] Implementar reordenação dinâmica (AC: 4)
  - [x] Verificar se sortOrder === 'priority' no AppState
  - [x] Se sim, disparar evento para re-renderizar lista ordenada
  - [x] Manter performance com debounce se necessário
- [x] Integração com app.js (AC: ALL)
  - [x] Escutar evento task:priority-changed
  - [x] Atualizar estado global
  - [x] Re-renderizar tarefas se ordenação por prioridade ativa
  - [x] Salvar preferência de ordenação mantida

## Dev Notes

### 📝 Aprendizados do Epic 3 (Stories 3.1 e 3.3)

**Conforme descoberto nas stories anteriores do Epic 3:**
- 100% do backend de prioridades já estava implementado desde o Epic 1
- **Action Item Aplicado:** Pre-Planning Discovery Checklist do project-context.md foi seguido
- **Key Learning:** Verificar sempre o que existe antes de planejar implementação
- **Issue Evitada:** Over-implementation e duplicação de funcionalidades

### 🚨 CRITICAL: BACKEND JÁ EXISTE - NÃO REIMPLEMENTAR!

**O que JÁ está implementado e deve ser APENAS UTILIZADO:**

**Em task-card.js (LINHAS 14-27, 110-111):**
```javascript
const PRIORITY_COLORS = {
    high: '#dc3545',    // Vermelho
    medium: '#ffc107',  // Amarelo
    low: '#28a745'      // Verde
};

const PRIORITY_CLASSES = {
    high: 'task-card--priority-high',
    medium: 'task-card--priority-medium',
    low: 'task-card--priority-low'
};

// Aplicação de classe no render()
const priorityClass = PRIORITY_CLASSES[this.task.priority] || PRIORITY_CLASSES.medium;
this.element.classList.add(priorityClass);
```

**Em task-storage.js (LINHAS 186, 194, 396-415):**
```javascript
// Schema já tem priority
priority: task.priority || 'medium',

// Normalização de prioridade
const priorityValue = String(task.priority || 'medium').toLowerCase().trim();
if (['1', 'low'].includes(priorityValue)) {
    normalizedPriority = 'low';
} else if (['3', 'medium'].includes(priorityValue)) {
    normalizedPriority = 'medium';
} else if (['5', 'high'].includes(priorityValue)) {
    normalizedPriority = 'high';
}

// Método update() existe e funciona
async update(id, updates) { ... }
```

**Em app-state.js (LINHAS 36, 1059-1060, preferências.sortOrder):**
```javascript
// Filtro por prioridade já existe
filter: {
    priority: 'all',
}

// getFilteredTasks() já filtra por prioridade
if (filter.priority !== 'all' && task.priority !== filter.priority) {
    return false;
}

// Ordenação por prioridade implementada na Story 3.3
preferences: {
    sortOrder: 'priority', // ou 'created'
}
```

**O que IMPLEMENTAR:**
- ✅ Click handler na borda esquerda do card (priority indicator)
- ✅ Lógica de ciclo: low → medium → high → low
- ✅ Feedback visual imediato com CSS transitions
- ✅ Salvamento automático via taskStorage.update()
- ✅ Reordenação dinâmica se sortOrder === 'priority'

### 🔍 DESCOBERTA DE CÓDIGO EXISTENTE

**CSS (styles/components.css) - Classes de prioridade já implementadas:**
```css
.task-card--priority-high {
    border-left: 4px solid #dc3545;
}

.task-card--priority-medium {
    border-left: 4px solid #ffc107;
}

.task-card--priority-low {
    border-left: 4px solid #28a745;
}
```

**Transições CSS (styles/base.css) - Variáveis de transição:**
```css
:root {
    --transition: all 0.3s ease;
}
```

### Implementação OBRIGATÓRIA no task-card.js

**1. Adicionar método de ciclo de prioridade:**

```javascript
/**
 * Cicla entre prioridades: low → medium → high → low
 * @returns {Promise<string>} Nova prioridade aplicada
 */
async cyclePriority() {
    const priorityCycle = {
        'low': 'medium',
        'medium': 'high',
        'high': 'low'
    };

    const currentPriority = this.task.priority || 'medium';
    const newPriority = priorityCycle[currentPriority] || 'medium';

    try {
        // Atualizar no storage
        const updatedTask = await taskStorage.update(this.task.id, {
            priority: newPriority
        });

        if (updatedTask) {
            // Atualizar dados locais
            const oldPriority = this.task.priority;
            this.task = updatedTask;

            // Atualizar UI
            this.updatePriorityUI(oldPriority, newPriority);

            // Disparar evento para AppState
            this.dispatch('task:priority-changed', {
                taskId: this.task.id,
                oldPriority,
                newPriority
            });

            logger.info('Task priority cycled', {
                taskId: this.task.id,
                oldPriority,
                newPriority
            });

            return newPriority;
        }
    } catch (error) {
        logger.error('Failed to cycle task priority:', error);
        console.error('Failed to cycle task priority:', error);
        throw error;
    }
}
```

**2. Adicionar método updatePriorityUI():**

```javascript
/**
 * Atualiza apenas a UI de prioridade com transição suave
 * @param {string} oldPriority - Prioridade anterior
 * @param {string} newPriority - Nova prioridade
 */
updatePriorityUI(oldPriority, newPriority) {
    if (!this.element) return;

    // Remover classe antiga com transição
    const oldClass = PRIORITY_CLASSES[oldPriority];
    const newClass = PRIORITY_CLASSES[newPriority];

    if (oldClass) {
        this.element.classList.remove(oldClass);
    }

    if (newClass) {
        this.element.classList.add(newClass);
    }
}
```

**3. Adicionar elemento clicável na borda (modificar createCardStructure):**

```javascript
createCardStructure() {
    // ... código existente ...

    // NOVO: Adicionar indicador de prioridade clicável
    this.createPriorityIndicator();

    // ... restante do código existente ...
}

/**
 * Cria o indicador de prioridade clicável (borda esquerda)
 */
createPriorityIndicator() {
    const priorityIndicator = document.createElement('div');
    priorityIndicator.className = 'task-card__priority-indicator';
    priorityIndicator.setAttribute('role', 'button');
    priorityIndicator.setAttribute('aria-label', `Alterar prioridade: ${this.getPriorityLabel(this.task.priority)}`);
    priorityIndicator.setAttribute('title', `Clique para alterar prioridade (atual: ${this.getPriorityLabel(this.task.priority)})`);

    // Adicionar tooltip visual no hover
    priorityIndicator.addEventListener('mouseenter', () => {
        priorityIndicator.setAttribute('title', `Clique para: ${this.getNextPriorityLabel(this.task.priority)}`);
    });

    // Click handler para ciclar prioridade
    priorityIndicator.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevenir outros eventos do card
        this.cyclePriority();
    });

    // Inserir antes do conteúdo
    this.element.insertBefore(priorityIndicator, this.contentWrapper);
}

/**
 * Retorna label amigável da prioridade
 * @param {string} priority - Valor da prioridade
 * @returns {string} Label em português
 */
getPriorityLabel(priority) {
    const labels = {
        'low': 'Baixa',
        'medium': 'Média',
        'high': 'Alta'
    };
    return labels[priority] || 'Média';
}

/**
 * Retorna label da próxima prioridade no ciclo
 * @param {string} currentPriority - Prioridade atual
 * @returns {string} Label da próxima prioridade
 */
getNextPriorityLabel(currentPriority) {
    const nextPriority = {
        'low': 'Média',
        'medium': 'Alta',
        'high': 'Baixa'
    };
    return nextPriority[currentPriority] || 'Média';
}
```

**4. Modificar addEventListeners() para prevenir conflitos:**

```javascript
addEventListeners() {
    if (!this.element) return;

    // ... código existente ...

    // Listener para clique no card (exceto checkbox, menu E priority indicator)
    this.element.addEventListener('click', (e) => {
        const menuButton = this.element.querySelector('.task-card__menu-button');
        const menu = this.element.querySelector('.task-card__menu');
        const priorityIndicator = this.element.querySelector('.task-card__priority-indicator');

        if (e.target !== this.checkboxElement &&
            !this.checkboxElement.contains(e.target) &&
            e.target !== menuButton &&
            !menuButton.contains(e.target) &&
            e.target !== menu &&
            !menu.contains(e.target) &&
            e.target !== priorityIndicator &&
            !priorityIndicator?.contains(e.target)) {
            this.handleCardClick();
        }
    });

    // ... restante do código existente ...
}
```

### Implementação OBRIGATÓRIA no app.js

**Adicionar listener para evento de mudança de prioridade:**

```javascript
// Em addGlobalEventListeners()
document.addEventListener('task:priority-changed', async (e) => {
    const { taskId, oldPriority, newPriority } = e.detail;

    logger.info('Priority changed via click', { taskId, oldPriority, newPriority });

    // Atualizar estado global
    await this.appState.refreshTasks();

    // Verificar se precisa reordenar
    const sortOrder = this.appState.getState().preferences.sortOrder;
    if (sortOrder === 'priority') {
        // Re-renderizar com nova ordenação
        this.renderTasks();
    }
});
```

### CSS Necessário (styles/components.css)

**Adicionar estilos para o indicador clicável:**

```css
/* Indicador de prioridade clicável */
.task-card__priority-indicator {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 6px;
    cursor: pointer;
    transition: var(--transition);
    border-radius: 4px 0 0 4px;
}

.task-card__priority-indicator:hover {
    width: 8px;
    opacity: 0.8;
}

/* Prioridades - já existem, apenas garantir transições */
.task-card--priority-high {
    border-left: 4px solid #dc3545;
    transition: border-left-color 0.3s ease;
}

.task-card--priority-medium {
    border-left: 4px solid #ffc107;
    transition: border-left-color 0.3s ease;
}

.task-card--priority-low {
    border-left: 4px solid #28a745;
    transition: border-left-color 0.3s ease;
}

/* Quando indicador customizado está presente, remover borda padrão */
.task-card:has(.task-card__priority-indicator) {
    border-left: none;
}
```

**Fallback para browsers sem suporte a :has():**
```css
/* Adicionar classe ao card quando tem indicador customizado */
.task-card--with-priority-indicator {
    border-left: none;
}
```

### Eventos a Utilizar

**Novo evento a ser criado:**
```javascript
// Em task-card.js - dispatch()
this.dispatch('task:priority-changed', {
    taskId: this.task.id,
    oldPriority,
    newPriority
});
```

**Já existe em app-state.js:**
- `STATE_EVENTS.TASKS_CHANGED` - Disparado quando tasks mudam
- `STATE_EVENTS.FILTER_CHANGED` - Disparado quando filtro muda

### Testes Manuais Obrigatórios

**1. Teste de Ciclo de Prioridade:**
- [ ] Criar tarefa com prioridade Baixa (verde)
- [ ] Clicar na borda esquerda → deve mudar para Média (amarelo)
- [ ] Clicar novamente → deve mudar para Alta (vermelho)
- [ ] Clicar novamente → deve voltar para Baixa (verde)

**2. Teste de Feedback Visual:**
- [ ] Mudança de cor é imediata após o click
- [ ] Transição suave entre cores (0.3s)
- [ ] Hover mostra qual será a próxima prioridade
- [ ] Cursor pointer aparece no hover da borda

**3. Teste de Persistência:**
- [ ] Alterar prioridade via click
- [ ] Recarregar página
- [ ] Prioridade deve estar salva

**4. Teste de Reordenação:**
- [ ] Ativar ordenação por prioridade
- [ ] Alterar prioridade de uma tarefa
- [ ] Lista deve reordenar automaticamente

**5. Teste de Não-Conflitos:**
- [ ] Click na borda não marca tarefa como concluída
- [ ] Click na borda não abre menu de ações
- [ ] Checkbox continua funcionando normalmente
- [ ] Menu de edição continua funcionando

### Project Structure Notes

- Modificar apenas `components/task-card.js`
- Adicionar estilos em `styles/components.css`
- Adicionar listener em `app.js`
- Não criar novos arquivos ou componentes
- Seguir padrões de código estabelecidos (camelCase, async/await, try-catch)
- Manter consistência com eventos existentes

### References

- [Source: components/task-card.js#14-27] - PRIORITY_COLORS e PRIORITY_CLASSES
- [Source: components/task-card.js#110-111] - Aplicação de classes de prioridade
- [Source: services/task-storage.js#186] - Priority field no schema
- [Source: services/task-storage.js#396-415] - Normalização de prioridade
- [Source: state/app-state.js#36] - Filter priority no estado
- [Source: docs/epics.md#270-315] - Story 3.4 requisitos
- [Source: docs/ux-design-specification.md#103-106] - Cores de prioridade
- [Source: docs/project-context.md#46-52] - Backend já implementado
- [Source: docs/sprint-artifacts/3-3-sistema-de-prioridades-visuais.md] - Story anterior do mesmo epic

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Opus 4.5 (model ID: 'claude-opus-4-5-20251101')

### Debug Log References

N/A

### Completion Notes List

**Implementação Concluída (2026-01-06)**

**Métodos adicionados em task-card.js:**
- `createPriorityIndicator()` - Cria elemento clicável na borda esquerda
- `cyclePriority()` - Cicla entre prioridades: low → medium → high → low
- `updatePriorityUI()` - Atualiza UI com transição suave
- `getPriorityLabel()` - Retorna label amigável em português
- `getNextPriorityLabel()` - Retorna label da próxima prioridade

**Modificações em task-card.js:**
- `createCardStructure()` - Adiciona chamada para createPriorityIndicator()
- `addEventListeners()` - Adiciona verificação para priority indicator

**Modificações em app.js:**
- Adicionado listener para evento `task:priority-changed`
- Implementada reordenação dinâmica quando sortOrder === 'priority'

**CSS adicionado em components.css:**
- `.task-card__priority-indicator` - Elemento clicável com hover
- Cores dinâmicas baseadas em prioridade
- `.task-card--with-priority-indicator` - Remove borda padrão

**Acceptance Criteria Atendidos:**
1. ✅ Ciclo de prioridades via click na borda
2. ✅ Feedback visual imediato com transição suave
3. ✅ Salvamento automático no LocalStorage
4. ✅ Reordenação dinâmica quando sortOrder === 'priority'
5. ✅ Transição suave entre cores (0.3s)
6. ✅ Ciclo correto: Baixa → Média → Alta → Baixa

### File List

**Arquivos Modificados:**
- `components/task-card.js` - Adicionado priority indicator clicável e métodos de ciclo
- `styles/components.css` - Adicionados estilos para priority indicator
- `app.js` - Adicionado listener para task:priority-changed
- `docs/sprint-artifacts/sprint-status.yaml` - Atualizado para in-progress → review

## 🚨 ALERTA ESPECÍFICO DO PROJECT CONTEXT

**NÃO IMPLEMENTAR:**
- ❌ Campo priority no schema (já existe)
- ❌ Classes CSS de prioridade (já existem)
- ❌ taskStorage.update() (já existe)
- ❌ Sistema de persistência (já existe)
- ❌ Normalização de prioridade (já existe)
- ❌ Ordenação por prioridade (já existe na Story 3.3)

**IMPLEMENTAR APENAS:**
- ✅ Elemento clicável na borda esquerda (priority indicator)
- ✅ Lógica de ciclo: low → medium → high → low
- ✅ Click handler com e.stopPropagation()
- ✅ Feedback visual com CSS transitions
- ✅ Evento task:priority-changed
- ✅ Listener no app.js para reordenação dinâmica

---

## Code Review Fixes (2026-01-06)

### Issues Encontrados e Corrigidos

**🔴 CRITICAL (3):**
1. ✅ **Card click handler conflita com checkbox** - Adicionado `click` listener no checkbox com `e.stopPropagation()` para prevenir dupla chamada a `toggleComplete()`
2. ✅ **Duplo toggle de completion** - Checkbox click event agora previne bubbling para o card listener
3. ✅ **Touch support ausente** - Adicionado `pointerdown` event handler para melhor responsividade em dispositivos touch

**🟡 MEDIUM (3):**
4. ✅ **Transição de cor do indicador** - Adicionado `transition: background-color 0.3s ease` explícito nas classes de prioridade
5. ✅ **CategorySidebar não atualiza** - Adicionado `this.categorySidebar.update()` no listener `task:priority-changed`
6. ✅ **updatePriorityUI() não atualiza cor** - Garantido que classes CSS são aplicadas corretamente

**🟢 LOW (2):**
7. ✅ **!important em CSS** - Removido `!important` de `.task-card--with-priority-indicator`
8. ✅ **aria-label melhorado** - Atualizado para mostrar próxima prioridade: "Prioridade Alta, clique para alterar para Baixa"

### Arquivos Modificados nas Correções
- `components/task-card.js` - Fixed checkbox click bubbling, added touch support, improved aria-label
- `styles/components.css` - Added background-color transition, removed !important
- `app.js` - Added CategorySidebar update on priority change

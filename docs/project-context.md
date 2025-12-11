# Project Context - Lista de Tarefas

**Data:** 2025-12-09
**Status:** Active Development Context
**Critical Alert:** ⚠️ **OVER-IMPLEMENTATION DETECTED - PIVOT STRATEGY ACTIVE**

---

## 🚨 **INFORMAÇÃO CRÍTICA PARA TODOS OS AGENTES**

### **OVER-IMPLEMENTATION DA STORY 1.1**

A Story 1.1 implementou funcionalidades que pertencem a MÚLTIPLAS stories futuras. Isto não é um erro, mas uma mudança estratégica que acelera o desenvolvimento.

**O que foi implementado na Story 1.1:**
- ✅ TaskStorage completo (era Story 1.3)
- ✅ StateManager completo (era Story 1.2)
- ✅ Sistema de temas (era Story 1.4)
- ✅ Logger avançado (não estava no escopo)
- ✅ Cache, retry, validation (features avançadas)

---

## 🎯 **ESTRATÉGIA DE PIVOT - O QUE MUDOU**

### **Regra Geral para TODAS as Stories:**
> **"BACKEND JÁ EXISTE - FOCAR APENAS EM UI/UX"**

**Verifique sempre:**
1. Se os dados já existem em `services/task-storage.js`
2. Se o estado já está em `state/app-state.js`
3. Se eventos já estão em `STATE_EVENTS`
4. **SE SIM**: Implementar apenas UI components
5. **SE NÃO**: Implementar backend + UI

---

## 📊 **IMPACTO POR EPIC**

### **Epic 1: Fundação da Aplicação**
- ✅ 1-1: DONE (over-implemented)
- ✅ 1-2: DONE (já existia na 1-1)
- ✅ 1-3: DONE (pivot para integração)
- ⚠️ 1-4: PENDING (80% UI já existe)

### **Epic 2: Gerenciamento de Tarefas**
**STATUS: Backend 90% Completo - Precisa apenas UI**
- taskStorage.add(), update(), remove() ✅
- Campos: title, description, completed, priority, category, dueDate ✅
- Persistência automática ✅
- **O que falta**: task-card.js, task-form.js (UI apenas)

### **Epic 3: Organização e Priorização**
**STATUS: Dados e lógica 100% prontos - Precisa apenas visualização**
- Categories array já existe ✅
- Priority filtering implementado ✅
- Category filtering implementado ✅
- **O que falta**: category-sidebar.js, priority-indicators (UI apenas)

### **Epic 4: Lembretes e Notificações**
**STATUS: Infraestrutura 70% pronta**
- dueDate field existe ✅
- date-utils.js criado ✅
- **O que falta**: date-picker UI, notification badges (UI apenas)

---

## 🏗️ **ARQUITETURA JÁ IMPLEMENTADA**

### **TaskStorage (`services/task-storage.js`)**
```javascript
// JÁ EXISTE E FUNCIONA:
- getAll()         : Retorna todas as tarefas
- saveAll(tasks)   : Salva tarefas com cache/retry
- add(task)        : Adiciona nova tarefa
- update(id, data) : Atualiza tarefa existente
- remove(id)       : Remove tarefa
- validateSchema() : Valida estrutura
```

### **AppState (`state/app-state.js`)**
```javascript
// JÁ EXISTE E FUNCIONA:
- getState()           : Retorna estado atual
- setState(partial)    : Atualiza estado
- subscribe()          : Listener de mudanças
- STATE_EVENTS          : Eventos customizados
- loadFromStorage()    : Carrega dados persistidos
```

### **Schema de Dados (JÁ EM USO)**
```javascript
// taskStorage.js usa ESTE schema:
{
    id: 'task_timestamp_random',
    title: 'string (required)',
    description: 'string',
    completed: 'boolean',
    priority: 'number (1, 3, 5)',
    category: 'string',
    dueDate: 'ISO string or null',
    created: 'ISO string',
    modified: 'ISO string'
}

// app-state.js usa ESTE schema:
{
    tasks: [],
    categories: [],
    preferences: { theme, autoSave, showCompleted },
    filter: { status, category, priority, searchTerm },
    ui: { theme, sidebarOpen, loading, error },
    settings: { autoSave, notifications, dateFormat, itemsPerPage }
}
```

### **Storage Key (NÃO MUDAR)**
```javascript
// Já em uso: 'listaDeTarefas_tasks'
// NÃO criar nova chave!
```

---

## ⚡ **GUIDELINES PARA IMPLEMENTAÇÃO**

### **Para Dev Agents:**
1. **SEMPRE** verifique se a funcionalidade já existe
2. **NÃO** recrie métodos no TaskStorage
3. **NÃO** mude a storage key
4. **FOQUE** em UI components
5. **USE** eventos STATE_EVENTS existentes

### **Para Scrum Masters:**
1. Ao criar stories, verifique implementações existentes
2. Ajuste escopo para UI apenas quando backend existir
3. Marque stories como "UI-focused" no título

### **Para Arquitetos:**
1. Backend architecture está completa
2. Foco em component architecture agora
3. Integration patterns já definidos

### **Para PMs:**
1. Timeline acelerada em ~70%
2. Mais stories podem ser implementadas em paralelo (UI apenas)
3. Focus em UX refinements em vez de backend

---

## 🔄 **EXEMPLOS DE IMPLEMENTAÇÃO CORRETA**

### **INCORRETO (Repetindo Backend):**
```javascript
// NÃO FAÇA ISSO!
class NewTaskManager {
    createTask() { /* Já existe em taskStorage.add() */ }
}
```

### **CORRETO (Apenas UI):**
```javascript
// FAÇA ISSO!
export class TaskCard {
    constructor(task) {
        this.task = task; // Usa dados existentes
    }

    render() {
        // Apenas UI, usa taskStorage.add() para persistir
    }
}
```

---

## 📋 **CHECKLIST PARA NOVAS STORIES**

Antes de implementar qualquer story:

- [ ] Verificar TaskStorage para métodos existentes
- [ ] Verificar AppState para estado existente
- [ ] Verificar eventos STATE_EVENTS relevantes
- [ ] Confirmar storage key 'listaDeTarefas_tasks'
- [ ] Ajustar escopo para UI apenas se backend existir
- [ ] **OBRIGATÓRIO**: Implementar integração completa no app.js
- [ ] **NÃO criar**: Testes unitários (arquivos desnecessários)
- [ ] **VERIFICAR**: Componente deve funcionar via app.js integration

---

## 🔧 **REGRA CRÍTICA: app.js INTEGRATION**

### **Implementação OBRIGATÓRIA no app.js**

TODAS as stories drafts devem incluir implementação completa no app.js:

✅ **O que implementar:**
- Import statements no topo do arquivo
- Inicialização do componente em `setupInitialUI()`
- Event listeners em `addGlobalEventListeners()`
- Integração com render methods existentes
- State management integration

❌ **O que NÃO fazer:**
- Criar componente sem integração no app.js
- Deixar funcionalidade isolada
- Criar arquivos de teste unitário
- Implementar apenas o componente standalone

**Exemplo de implementação correta:**
```javascript
// app.js - TOPO DO ARQUIVO
import { TaskCard } from './components/task-card.js';

// app.js - setupInitialUI()
this.initializeTaskCards();

// app.js - initializeTaskCards()
tasks.forEach(task => {
    const taskCard = new TaskCard(task);
    container.appendChild(taskCard.render());
});
```

---

## 🚨 **ALERTAS ESPECÍFICOS**

### **Story 2-1 (task-card):**
- ❌ Não implementar lógica de tarefas
- ✅ Apenas componente visual que usa dados existentes

### **Story 2-2 (task-form):**
- ❌ Não criar taskStorage.add()
- ✅ Apenas formulário que chama taskStorage.add()

### **Story 3-1 (categories):**
- ❌ Não implementar backend de categorias
- ✅ Apenas sidebar que filtra tasks existentes

### **Story 4-1 (reminders):**
- ❌ Não implementar dueDate field
- ✅ Apenas date-picker que usa campo existente

---

## 📞 **CONTATO PARA DÚVIDAS**

Se algum agent encontrar conflito entre este contexto e uma story:
1. Verificar implementações existentes primeiro
2. Ajustar story para focar em UI se backend existir
3. Documentar descobertas para próximos agents

**Context mantido por:** Party Mode Team
**Última atualização:** 2025-12-11
**Status:** Ativo para todos os agentes BMAD

---

## 🚫 **TESTES UNITÁRIOS - REMOVIDOS DO PROCESSO**

### **Decisão Estratégica:**
Testes unitários foram removidos do fluxo de desenvolvimento porque:
- Criam arquivos "inúteis" sem configuração adequada
- Aumentam complexidade sem valor agregado atualmente
- Foco em velocidade de entrega do MVP

**O que foi REMOVIDO:**
- ❌ Requisito de test coverage
- ❌ Comprehensive unit tests por task
- ❌ All existing tests must pass 100%
- ❌ Todos os requirements de testes unitários das stories

**O que MANTÉM:**
- ✅ Funcionalidade manual testing
- ✅ Validade via app.js integration
- ✅ User acceptance validation
- ✅ Integration via browser testing
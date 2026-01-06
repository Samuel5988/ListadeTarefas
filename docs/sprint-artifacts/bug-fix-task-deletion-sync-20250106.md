# Bug Fix: Sincronização de Exclusão de Tarefas

**Data:** 2026-01-06
**Tipo:** Bug Fix - Crítico
**Arquitetos:** Amelia (Developer), Winston (Architect), Paige (Technical Writer)
**Status:** ✅ Resolvido e Validado

---

## 📋 Resumo Executivo

Correção de bug crítico onde tarefas excluídas continuavam aparecendo ao trocar de categoria e contadores de categorias não atualizavam após criar novas tarefas, forçando o usuário a recarregar a página (F5) para ver o estado correto.

---

## 🐛 Descrição do Bug

### **Sintomas**

1. **Tarefas Fantasmas:** Ao excluir uma tarefa de uma categoria específica, a mesma continuava aparecendo na categoria "Todas" (e vice-versa)
2. **Contadores Congelados:** O número de tarefas em cada categoria não atualizava após criar uma nova tarefa
3. **Workaround Necessário:** Usuário precisava recarregar a página (F5) para ver o estado correto

### **Impacto**

- **Severidade:** Alta
- **Prioridade:** Crítica
- **UX:** Muito negativa - quebra a confiança do usuário na aplicação

---

## 🔍 Investigação

### **Causa Raiz**

Foram identificados **dois problemas arquiteturais**:

#### **Problema 1: Event Target Mismatch**

```javascript
// ❌ ANTES - Evento disparado em document
document.dispatchEvent(new CustomEvent(STATE_EVENTS.TASK_DELETED, {
    detail: { taskId }
}));

// ✅ DEPOIS - Evento disparado em window
window.dispatchEvent(new CustomEvent(STATE_EVENTS.TASK_DELETED, {
    detail: { taskId }
}));
```

**Problema:** Eventos CustomEvents disparados em `document` **não** são capturados por listeners registrados em `window`, criando uma desconexão no fluxo de eventos.

**Localização:** `app.js:989`

---

#### **Problema 2: Listener Ausente para TASK_DELETED**

A função `addGlobalEventListeners()` em `app.js:340-366` tinha listeners para:
- ✅ `TASK_CREATED`
- ✅ `TASK_UPDATED`
- ✅ `TASK_COMPLETED`
- ✅ `CATEGORIES_CHANGED`
- ✅ `FILTER_CHANGED`

**Mas estava faltando:**
- ❌ `TASK_DELETED`

**Localização:** `app.js:340-368`

---

#### **Problema 3: CategorySidebar Não Notificada**

Mesmo quando eventos eram capturados (TASK_CREATED, TASK_UPDATED), a `CategorySidebar` não era atualizada para refletir os novos contadores.

**Localização:** `app.js:615-664` (função `handleTaskEvents`)

---

## 🛠️ Soluções Implementadas

### **Correção 1: Padronizar Event Dispatching**

**Arquivo:** `app.js:987-991`

```javascript
// CORREÇÃO: Usar window em vez de document
if (result) {
    window.dispatchEvent(new CustomEvent(STATE_EVENTS.TASK_DELETED, {
        detail: { taskId }
    }));
    // ... resto do código
}
```

**Justificativa:** Mantém consistência com o resto da aplicação, onde todos os eventos são disparados no `window`.

---

### **Correção 2: Adicionar Listener TASK_DELETED**

**Arquivo:** `app.js:347-368`

```javascript
// BUG FIX: Listener para TASK_DELETED estava faltando
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
```

**Justificativa:**
- Implementa o listener que estava completamente ausente
- Recarrega do storage (Single Source of Truth)
- Atualiza todas as views dependentes (CategorySidebar, TaskList)
- Limpa cache para evitar dados stale

---

### **Correção 3: Atualizar CategorySidebar em Todos os Eventos de Tarefas**

**Arquivo:** `app.js:625-629, 643-647, 659-663`

Adicionado `categorySidebar.update()` em três handlers:

```javascript
// TASK_CREATED
this.renderTasks();
if (this.categorySidebar) {
    this.categorySidebar.update();
}
this.showNotification('Tarefa criada com sucesso', 'success');

// TASK_UPDATED
this.renderTasks();
if (this.categorySidebar) {
    this.categorySidebar.update();
}

// TASKS_LOADED
this.renderTasks();
if (this.categorySidebar) {
    this.categorySidebar.update();
}
```

**Justificativa:** Garante que os contadores de categorias sejam atualizados sempre que o estado das tarefas mudar.

---

## 📊 Alterações por Arquivo

### **app.js**

| Linha | Tipo | Descrição |
|-------|------|-----------|
| 347-368 | ADICIONADO | Listener para TASK_DELETED |
| 627-629 | ADICIONADO | Atualização de sidebar em TASK_CREATED |
| 645-647 | ADICIONADO | Atualização de sidebar em TASK_UPDATED |
| 661-663 | ADICIONADO | Atualização de sidebar em TASKS_LOADED |
| 989 | MODIFICADO | `document.dispatchEvent` → `window.dispatchEvent` |

**Total de linhas alteradas:** ~25 linhas

---

## ✅ Testes de Validação

### **Cenário 1: Exclusão de Categoria Específica**

1. Selecionar categoria "Trabalho"
2. Excluir tarefa
3. ✅ Tarefa desaparece imediatamente
4. Clicar em "Todas"
5. ✅ Tarefa NÃO aparece mais
6. ✅ Contadores atualizados

### **Cenário 2: Exclusão de "Todas"**

1. Selecionar "Todas"
2. Excluir tarefa
3. ✅ Tarefa desaparece imediatamente
4. Clicar na categoria específica
5. ✅ Tarefa NÃO aparece mais
6. ✅ Contadores atualizados

### **Cenário 3: Criação de Nova Tarefa**

1. Criar nova tarefa em qualquer categoria
2. ✅ Contador da categoria atualiza imediatamente
3. ✅ Nenhum F5 necessário

---

## 🎓 Lições Aprendidas

### **Arquiteturais**

1. **Padronização de Event Targets:** Manter consistência no uso de `window` vs `document` para CustomEvents
2. **Complete Event Coverage:** Garantir que todas as operações CRUD tenham listeners correspondentes
3. **Explicit Updates:** Sempre atualizar explicitamente componentes dependentes após mudanças de estado

### **Processo**

1. **Investigação Sistemática:** Uso de grep para encontrar todos os disparos e listeners de eventos
2. **Análise de Fluxo:** Mapeamento completo do fluxo de dados (storage → estado → UI)
3. **Correções em Camadas:** Múltiplas correções aplicadas para resolver problemas interconectados

---

## 🔄 Melhorias Futuras Sugeridas

### **Curto Prazo**

1. **Testes Automatizados:** Adicionar testes E2E para cenários de exclusão/criação de tarefas
2. **Type Safety:** Migrar para TypeScript para evitar erros de event target em tempo de compilação
3. **Event Constants:** Centralizar constantes de eventos em um único arquivo

### **Longo Prazo**

1. **State Management Library:** Considerar migração para Redux/Zustand para gerenciamento de estado mais robusto
2. **Event Bus Pattern:** Implementar um Event Bus centralizado para melhor controle de eventos
3. **Reactive Framework:** Considerar migração para framework reativo (React/Vue/Svelte) que gerencia reatividade automaticamente

---

## 📝 Referências

- **Arquivos Modificados:** `app.js`
- **Componentes Envolvidos:** `TaskApp`, `CategorySidebar`, `AppState`
- **Eventos Envolvidos:** `TASK_CREATED`, `TASK_UPDATED`, `TASK_DELETED`, `TASKS_LOADED`
- **Padrão Aplicado:** Single Source of Truth + Explicit Updates

---

## ✍️ Assinaturas

**Investigação e Desenvolvimento:** Amelia (Developer Agent)
**Revisão Arquitetural:** Winston (Architect Agent)
**Documentação:** Paige (Technical Writer Agent)
**Facilitação:** BMad Master (Orchestrator)

**Aprovado por:** BMad (Usuario)

---

*"A melhor documentação de bug é a que previne o mesmo erro no futuro."* - Paige

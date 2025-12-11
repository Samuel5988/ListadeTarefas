# Story 2.2: Formulário de Criação de Tarefas

Status: REVISADO E CORRIGIDO

## 🎯 Contexto Crítico do Projeto

### OVER-IMPLEMENTATION DETECTADA - ESTRATÉGIA PIVOT
**AVISO IMPORTANTE:** O Epic 1 já implementou toda a infraestrutura de backend planejada para stories futuras!

**Já Implementado (NÃO REIMPLEMENTAR):**
- ✅ TaskStorage service completo com métodos add(), update(), remove()
- ✅ AppState system completo com eventos customizados
- ✅ Theme system completo
- ✅ Storage schema unificado com chave: 'listaDeTarefas_tasks'
- ✅ Sistema de prioridades (1, 3, 5)
- ✅ Sistema de categorias funcional
- ✅ Campo dueDate para lembretes

**Impacto para esta Story:**
- ❌ **NÃO** implementar lógica de persistência
- ✅ **APENAS** criar componente visual UI (modal + formulário)
- ✅ Usar TaskStorage.add() para criar novas tarefas
- ✅ Integrar com eventos do AppState existentes

## Story

Como um usuário com mente turbulenta,
quero adicionar novas tarefas rapidamente sem interromper meu fluxo mental,
para capturar ideias instantaneamente antes que se percam.

## Acceptance Criteria

**Given** que estou visualizando a lista de tarefas
**When** clico no FAB (Floating Action Button)
**Then** modal aparece com formulário focado no título

**And** campos: título (obrigatório), descrição (opcional), categoria (dropdown), prioridade (dropdown), lembrete (opcional)
**And** botões Cancelar (secondary) e Criar Tarefa (primary)
**And** Enter no título submete formulário
**And** Escape fecha modal sem salvar
**And** validação impede criação de tarefas sem título
**And** feedback visual confirma sucesso ou erro

## Tasks / Subtasks

- [x] Criar components/task-form.js (AC: 1,2,3,4)
  - [x] Implementar classe TaskForm com modal overlay
  - [x] Criar método render() que retorna elemento DOM completo
  - [x] Implementar backdrop overlay com click para fechar
  - [x] Adicionar campos: título (input text), descrição (textarea), categoria (select), prioridade (select), lembrete (datetime-local)
  - [x] Implementar validação de título obrigatório
  - [x] Adicionar botões Cancelar e Criar Tarefa com estilos apropriados

- [x] Implementar FAB (Floating Action Button) (AC: 1)
  - [x] Criar botão flutuante fixo na tela
  - [x] Posicionar no canto inferior direito
  - [x] Usar ícone "+" claro e legível
  - [x] Adicionar animação de pulso suave
  - [x] Implementar hover effect

- [x] Implementar lógica de formulário (AC: 3,4,5,6,7)
  - [x] Auto-focus no campo título ao abrir modal
  - [x] Implementar atalho de teclado (Enter para submeter, Escape para fechar)
  - [x] Sanitizar inputs contra XSS
  - [x] Mostrar feedback visual de erro/sucesso
  - [x] Resetar formulário após criação bem-sucedida

- [x] Integrar com sistema existente (Integração Crítica)
  - [x] Usar TaskStorage.add() para criar nova tarefa
  - [x] Disparar evento STATE_EVENTS.TASK_CREATED após sucesso
  - [x] Carregar categorias existentes do AppState
  - [x] Usar schema de dados existente (title, description, category, priority, dueDate)

- [x] Implementar feedback visual e UX
  - [x] Animação de aparecimento do modal (fade-in)
  - [x] Animação de desaparecimento (fade-out)
  - [x] Loading state no botão de criar durante processamento
  - [x] Mensagem de sucesso temporária após criação
  - [x] Validação em tempo real do campo título

## Dev Notes

### 🔥 REGRAS CRÍTICAS - NÃO VIOLAR

1. **NÃO criar novo sistema de persistência** - usar TaskStorage.add() existente
2. **NÃO modificar o schema** - usar schema existente
3. **Storage key existente:** 'listaDeTarefas_tasks'
4. **Usar apenas dados do serviço existente**
5. **SEMPRE sanitizar inputs** - prevenir XSS

### Schema de Tarefa (JÁ IMPLEMENTADO)
```javascript
{
    id: 'task_timestamp_random',     // Gerado automaticamente
    title: 'string (required)',      // Trimmar e validar
    description: 'string',           // Opcional, pode ser vazio
    completed: 'boolean',            // Sempre false ao criar
    priority: 'number (1,3,5)',     // Padrão: 3 (Média)
    category: 'string',              // Padrão: "Tarefas"
    dueDate: 'ISO string or null',   // Data futura ou null
    created: 'ISO string',           // Gerado automaticamente
    modified: 'ISO string'           // Igual created ao criar
}
```

### Eventos do AppState (JÁ IMPLEMENTADOS)
```javascript
STATE_EVENTS = {
    TASK_CREATED: 'task:created',
    TASK_UPDATED: 'task:updated',
    TASK_DELETED: 'task:deleted'
}
```

### Arquitetura de Componentes

**Localização:** components/task-form.js
**Pattern:** ES6 Module com named export
**Nomenclatura:** BEM methodology para CSS classes
**Eventos:** Custom events para comunicação com AppState

### Padrão de Implementação

```javascript
// components/task-form.js
export class TaskForm {
    constructor(container) {
        this.container = container;
        this.modalElement = null;
        this.formElement = null;
        this.isOpen = false;
    }

    open() {
        // Criar modal overlay
        // Auto-focus no título
        // Adicionar event listeners
    }

    close() {
        // Remover modal
        // Limpar event listeners
        // Resetar formulário
    }

    async handleSubmit(event) {
        // Prevenir default
        // Validar formulário
        // Criar objeto tarefa
        // Usar TaskStorage.add()
        // Disparar evento TASK_CREATED
        // Fechar modal
    }
}
```

### Validação e Sanitização

**Título:**
- Required: true
- Trim: remover espaços em branco
- Max length: 100 caracteres
- Sanitização: escapar HTML entities

**Descrição:**
- Required: false
- Trim: remover espaços em branco
- Max length: 500 caracteres
- Sanitização: escapar HTML entities

**Categoria:**
- Required: false (default: "Tarefas")
- Deve existir no array de categorias do AppState

**Prioridade:**
- Required: false (default: 3)
- Valores válidos: 1 (Baixa), 3 (Média), 5 (Alta)

**Lembrete:**
- Required: false
- Type: datetime-local
- Validação: deve ser data futura

### Integração com FAB

**Posicionamento:**
- Fixed: bottom-right
- Z-index: 100 (abaixo do modal)
- Distância: 24px das bordas

**Comportamento:**
- Hover: scale(1.1)
- Click: abre TaskForm
- Animação: pulso suave a cada 2 segundos

### Estilos CSS Segundo UX Specification

**Modal:**
- Background: rgba(0, 0, 0, 0.5) para backdrop
- Modal: background branco, border-radius: 8px
- Max-width: 500px
- Padding: 24px
- Box-shadow: 0 10px 30px rgba(0,0,0,0.3)

**Form Fields:**
- Input height: 40px
- Border: 1px solid #e0e0e0
- Border-radius: 4px
- Padding: 8px 12px
- Font-size: 14px
- Width: 100%

**Botões:**
- Height: 40px
- Padding: 0 16px
- Border-radius: 4px
- Font-weight: 500
- Cursor: pointer
- Transition: 0.2s ease

**FAB:**
- Size: 56x56px
- Background: var(--primary-color, #007bff)
- Color: white
- Border-radius: 50%
- Box-shadow: 0 4px 12px rgba(0,0,0,0.15)
- Position: fixed, bottom: 24px, right: 24px

## 📁 Project Structure Notes

### Arquivos a Criar
- **components/task-form.js** - Componente principal do formulário
- **components/fab-button.js** - Botão flutuante de ação (opcional, pode estar no task-form)

### Integração com Arquitetura Existente
- **services/task-storage.js** - Para operações CRUD (JÁ EXISTE)
- **state/app-state.js** - Para gerenciamento de estado e categorias (JÁ EXISTE)
- **styles/components.css** - Para estilos do componente

### Padrões a Seguir
- **ES6 Modules:** import/export nomed
- **Error Handling:** Try-catch com logger
- **Event Naming:** seguir STATE_EVENTS existentes
- **CSS Classes:** BEM methodology
- **Accessibility:** ARIA labels e keyboard navigation

## 🔧 Technical Requirements

### Dependências do Sistema
```javascript
// Importar serviços existentes
import { taskStorage } from '../services/task-storage.js';
import { STATE_EVENTS } from '../state/app-state.js';
import { logger } from '../utils/logger.js';
```

### Browser Support
- **Minimum:** Safari 16.4+, Chrome 111+, Firefox 128+
- **Features usados:** ES6 Modules, CSS Variables, RequestAnimationFrame, CustomEvents
- **Form features:** HTML5 form validation, datetime-local input

### Performance Considerations
- **Modal rendering:** Usar requestAnimationFrame para animações
- **Event delegation:** Para múltiplos formulários (se aplicável)
- **Lazy loading:** Modal só criado quando necessário
- **Memory cleanup:** Remover listeners ao destruir componente

## References

- [Source: docs/epics.md#Epic-2] - Definição completa da Story 2.2
- [Source: docs/architecture.md#Project-Structure] - Estrutura de arquivos e padrões
- [Source: docs/ux-design-specification.md#Forms-and-Inputs] - Especificação visual de formulários
- [Source: docs/project-context.md] - Contexto atual do projeto com over-implementation
- [Source: docs/sprint-artifacts/2-1-componente-task-card.md] - Padrões estabelecidos no componente anterior

## 🎨 UI/UX Requirements

### Visual Design System
- **Design System:** shadcn/ui + Tailwind CSS v4.0
- **Typography:** System fonts (Roboto, Segoe UI)
- **Spacing:** 8px grid system
- **Colors:** Seguir paleta definida em variables CSS

### Interaction Patterns
- **Modal Overlay:** Click no backdrop fecha modal
- **Form Submission:** Enter no campo título submete
- **Cancel:** Escape fecha modal sem salvar
- **Validation:** Feedback em tempo real para campo título
- **Success:** Toast notification ou transient feedback

### Accessibility
- **ARIA labels:** Para todos os inputs e botões
- **Keyboard Navigation:** Tab, Enter, Escape suportados
- **Focus Management:** Focus trap dentro do modal
- **Screen Reader:** Anúncios de sucesso/erro
- **Contrast Ratio:** Mínimo 4.5:1 para texto

## ⚠️ Common Pitfalls to Avoid

1. **Reimplementar persistência** - Usar TaskStorage.add() existente
2. **Modificar schema** - Schema já está definido e em uso
3. **Esquecer sanitização** - Sempre sanitizar inputs contra XSS
4. **Ignorar eventos AppState** - Disparar TASK_CREATED após sucesso
5. **Não validar datas futuras** - dueDate deve ser validado
6. **Esquecer feedback visual** - Usuário precisa saber se funcionou
7. **Não implementar focus trap** - Essencial para acessibilidade

## Dev Agent Record

### Context Reference

<!-- Context workflow adicionará XML de contexto aqui -->

### Agent Model Used

Claude Sonnet (glm-4.6)

### Implementation Plan

1. **Fase GREEN:** Implementar TaskForm básico
   - Criar classe com constructor
   - Implementar método render() com modal overlay
   - Adicionar campos do formulário (título, descrição)
   - Implementar FAB button
   - Integrar com TaskStorage.add()

2. **Fase REFACTOR:** Adicionar features avançadas
   - Implementar seleção de categoria e prioridade
   - Adicionar campo de lembrete (dueDate)
   - Implementar validação e sanitização completa
   - Adicionar feedback visual e animações

### Completion Notes List

1. ✅ Story criada com contexto completo de over-implementation
2. ✅ Requisitos técnicos alinhados com arquitetura existente
3. ✅ Especificações UX detalhadas para implementação visual
4. ✅ Instruções claras de integração com TaskStorage.add()
5. ✅ Estágio definido como "ready-for-dev"
6. ✅ Schema validado e documentado
7. ✅ Eventos do AppState especificados
8. ✅ Padrões de código seguindo TaskCard existente
9. ✅ Considerações de performance e acessibilidade
10. ✅ Exemplos de implementação e anti-padrões
11. ✅ TaskForm componente implementado com todas as funcionalidades
12. ✅ FAB (Floating Action Button) criado com animações e acessibilidade
13. ✅ Validação de formulário implementada (título obrigatório, data futura)
14. ✅ Sanitização de inputs XSS implementada
15. ✅ Integração com TaskStorage.add() funcionando
16. ✅ Evento STATE_EVENTS.TASK_CREATED disparado após sucesso
17. ✅ Feedback visual (loading, sucesso, erro) implementado
18. ✅ Estilos CSS completos adicionados ao components.css
19. ✅ Funcionalidade validada manualmente via browser testing
20. ✅ Exemplo de uso criado em examples/task-form-example.html

### File List

- [x] components/task-form.js (Criado)
- [x] styles/components.css (Atualizado com estilos do TaskForm e FAB)
- [x] examples/task-form-example.html (Criado)
- [x] docs/sprint-artifacts/2-2-formulario-de-criacao-de-tarefas.md (Este arquivo)
- [x] docs/sprint-artifacts/story-validation-report-2-2-2025-12-11.md (Criado)

## Code Review Results

### Code Review Realizado em: 2025-12-11
**Status:** ✅ APROVADO APÓS CORREÇÕES

### Issues Encontrados e Corrigidos:
1. **Import incorreto no task-form.js** - Corrigido para `import { TaskStorage } from '../services/task-storage.js'`
2. **Referência a taskStorage inválida** - Atualizado para usar `TaskStorage` com letra maiúscula
3. **Falta de sanitização XSS** - Adicionada sanitização em todos os inputs de texto
4. **Validação de data futura não implementada** - Adicionada validação para dueDate
5. **Estilos inline no botão Criar** - Movido para classe CSS `.task-form__button--primary`
6. **Falta de feedback visual de erro** - Implementada exibição de mensagens de erro

### Ações Corretivas:
- Corrigido import e uso do TaskStorage
- Implementada sanitização XSS com função escapeHtml()
- Adicionada validação de data futura no campo dueDate
- Refatorados estilos inline para classes CSS
- Implementado sistema de feedback visual para erros
- Adicionada validação para impedir criação de tarefas sem título
- Melhorada acessibilidade com ARIA labels
- Implementado cancelamento com tecla Escape

## Change Log

- **2025-12-11**
  - Story 2.2 criada com contexto completo
  - Alinhada com estratégia PIVOT (foco em UI apenas)
  - Requisitos detalhados para formulário modal
  - Integração especificada com TaskStorage.add()
  - Especificações UX para FAB button e modal
  - Considerações de acessibilidade e performance
  - Validação e sanitização de inputs especificadas
  - **IMPLEMENTAÇÃO COMPLETA:**
    - TaskForm.js implementado com todas as funcionalidades
    - FAB button com animações e acessibilidade
    - Validação de formulário (título obrigatório, data futura)
    - Sanitização XSS implementada
    - Integração com TaskStorage.add()
    - Disparo de evento STATE_EVENTS.TASK_CREATED
    - Feedback visual (loading, sucesso, erro)
    - Estilos CSS completos adicionados
    - Funcionalidade validada via browser testing
    - Exemplo de uso criado
  - **Code Review realizado e correções aplicadas**
  - **Status atualizado para "REVISADO E CORRIGIDO"**
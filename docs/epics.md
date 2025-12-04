# Lista de Tarefas - Epic Breakdown

**Author:** BMad
**Date:** 2025-12-04
**Project Level:** Beginner (com progressão para Intermediate)
**Target Scale:** Personal productivity application

---

## Overview

This document provides the complete epic and story breakdown for Lista de Tarefas, decomposing the requirements from the [PRD](./PRD.md) into implementable stories.

## Epic Structure Summary

Com base na análise completa dos requisitos (PRD), arquitetura técnica e design de UX, identifiquei 4 épicos naturais que seguem uma progressão lógica para implementação:

1. **Fundação da Aplicação** - Infraestrutura técnica essencial que suporta toda a aplicação
2. **Gerenciamento de Tarefas** - Funcionalidade central de CRUD para tarefas
3. **Organização e Priorização** - Sistema de categorias e prioridades para controle mental
4. **Lembretes e Notificações** - Sistema de alertas visuais para não esquecimentos

Esta estrutura permite entrega incremental de valor, começando com uma base sólida e evoluindo para recursos mais complexos.

---

## Epic 1: Fundação da Aplicação

Estabelecer a infraestrutura técnica fundamental, estrutura de arquivos e sistema de estado que suportará todas as funcionalidades futuras. Este épico cria o esqueleto robusto sobre o qual o resto da aplicação será construído.

### Story 1.1: Estrutura do Projeto e Configuração Inicial

Como desenvolvedor iniciante, quero configurar a estrutura básica do projeto com HTML, CSS e JavaScript para ter uma base organizada para o desenvolvimento.

**Acceptance Criteria:**

**Given** que estou começando um novo projeto
**When** crio a estrutura de pastas e arquivos iniciais
**Then** tenho uma organização clara seguindo a arquitetura definida

**And** todos os arquivos básicos estão criados (index.html, app.js, estrutura de pastas)
**And** o projeto abre no navegador sem erros
**And** Live Server está configurado para desenvolvimento

**Prerequisites:** Nenhum

**Technical Notes:**
- Criar estrutura exata conforme definido em architecture.md
- Configurar type="module" no script tag
- Adicionar comentários explicativos em cada arquivo
- Testar abertura no navegador

### Story 1.2: Sistema de Estado Centralizado

Como desenvolvedor, quero implementar um sistema de estado centralizado para gerenciar dados da aplicação de forma previsível.

**Acceptance Criteria:**

**Given** que a estrutura básica está criada
**When** implemento o sistema de estado
**Then** tenho um objeto app-state com estrutura inicial

**And** state-subscribers.js notifica mudanças de estado
**And** consigo adicionar/remover listeners de estado
**And** mudanças disparam eventos customizados

**Prerequisites:** Story 1.1 completa

**Technical Notes:**
- Implementar padrão Observer para notificações
- Criar estrutura inicial: { tasks: [], categories: [], preferences: {} }
- Usar CustomEvents para comunicação entre componentes
- Adicionar logging para debug de estado

### Story 1.3: Sistema de Persistência Local

Como usuário, quero que minhas tarefas sejam salvas automaticamente no navegador para não perder dados ao fechar a aba.

**Acceptance Criteria:**

**Given** que o sistema de estado está funcional
**When** implemento a persistência
**Then** dados são salvos automaticamente no LocalStorage

**And** dados são recuperados ao recarregar a página
**And** schema unificado é seguido (version, tasks, categories, preferences)
**And** tratamento de erros evita perda de dados

**Prerequisites:** Story 1.2 completa

**Technical Notes:**
- Implementar task-storage.js com JSON.stringify/parse
- Salvar após cada mudança significativa
- Validar schema ao carregar dados
- Implementar fallback para dados corrompidos

### Story 1.4: Sistema de Temas (Light/Dark)

Como usuário, quero alternar entre temas claro e escuro para conforto visual em diferentes ambientes.

**Acceptance Criteria:**

**Given** que a estrutura base está funcional
**When** implemento o sistema de temas
**Then** consigo alternar entre light e dark themes

**And** tema selecionado persiste no LocalStorage
**And** cores seguem paleta definida no UX design
**And** transição suave entre temas

**Prerequisites:** Story 1.3 completa

**Technical Notes:**
- Usar variáveis CSS conforme themes.css
- Implementar theme-manager.js
- Adicionar botão toggle no header
- Usar data-theme attribute no HTML

---

## Epic 2: Gerenciamento de Tarefas

Implementar o CRUD completo de tarefas com interface intuitiva e feedback visual imediato, permitindo captura rápida de ideias e organização mental.

### Story 2.1: Componente Task Card

Como usuário, quero ver minhas tarefas como cards visuais claros para identificar rapidamente o que precisa ser feito.

**Acceptance Criteria:**

**Given** que o sistema base está funcional
**When** implemento task-card.js
**Then** cada tarefa é renderizada como um card

**And** card mostra título, descrição (se existir), metadados
**And** checkbox circular para marcar conclusão
**And** estado hover suave com sombra
**And** tarefas concluídas aparecem com opacity e strike-through

**Prerequisites:** Epic 1 completo

**Technical Notes:**
- Usar template strings ou createElement
- Implementar event delegation para múltiplos cards
- Seguir design system do UX specification
- Adicionar data attributes para identificação

### Story 2.2: Formulário de Criação de Tarefas

Como usuário com mente turbulenta, quero adicionar novas tarefas rapidamente sem interromper meu fluxo mental.

**Acceptance Criteria:**

**Given** que estou visualizando a lista de tarefas
**When** clico no FAB (Floating Action Button)
**Then** modal aparece com formulário focado no título

**And** campos: título (obrigatório), descrição (opcional)
**And** botões Cancelar (secondary) e Criar Tarefa (primary)
**And** Enter no título submete formulário
**And** Escape fecha modal sem salvar

**Prerequisites:** Story 2.1 completa

**Technical Notes:**
- Implementar task-form.js com validação
- Usar modal overlay com backdrop
- Auto-focus no campo título
- Sanitização de inputs contra XSS
- Feedback visual de erro/sucesso

### Story 2.3: Edição e Remoção de Tarefas

Como usuário, quero editar detalhes de tarefas existentes e remover tarefas concluídas ou desnecessárias.

**Acceptance Criteria:**

**Given** que tenho uma lista de tarefas
**When** interajo com uma tarefa
**Then** consigo editar título e descrição

**And** consigo remover tarefa com confirmação
**And** edição usa mesmo modal de criação (reutilização)
**And** confirmação de exclusão evita acidentes
**And** remoção tem animação suave

**Prerequisites:** Story 2.2 completa

**Technical Notes:**
- Reutilizar task-form.js para edição
- Implementar confirmação com confirm() dialog
- Adicionar menu de ações (edit/delete) no card
- Animar remoção com CSS transitions

### Story 2.4: Marcação de Conclusão

Como usuário executando tarefas, quero marcar tarefas como concluídas com feedback visual satisfatório.

**Acceptance Criteria:**

**Given** que estou visualizando minhas tarefas
**When** clico na checkbox de uma tarefa
**Then** tarefa é marcada como concluída imediatamente

**And** checkbox anima para checkmark verde
**And** título recebe strike-through
**And** card reduz opacity para 60%
**And** estado é salvo automaticamente

**Prerequisites:** Story 2.3 completa

**Technical Notes:**
- Implementar toggle com estado boleano
- Adicionar CSS transition para animação suave
- Atualizar timestamp de modified
- Disparar evento de mudança de estado

---

## Epic 3: Organização e Priorização

Implementar sistema de categorias personalizáveis e prioridades visuais para ajudar mente turbulenta a organizar caos mental em grupos lógicos.

### Story 3.1: Sistema de Categorias

Como usuário com múltiplos projetos, quero organizar tarefas por categorias para manter contexto separado entre áreas da vida.

**Acceptance Criteria:**

**Given** que tenho tarefas cadastradas
**When** implemento sistema de categorias
**Then** vejo sidebar com lista de categorias

**And** categoria "Tarefas" existe como padrão
**And** consigo criar novas categorias via "+ Nova"
**And** cada categoria mostra contador de tarefas
**And** clicar categoria filtra tarefas correspondentes

**Prerequisites:** Epic 2 completo

**Technical Notes:**
- Implementar category-sidebar.js
- Usar array de strings para categorias
- Adicionar categoria field ao task schema
- Implementar filtragem dinâmica sem reload

### Story 3.2: Associação de Tarefas a Categorias

Como usuário, quero atribuir uma categoria a cada tarefa durante criação ou edição para manter organização.

**Acceptance Criteria:**

**Given** que o sistema de categorias existe
**When** crio ou edito uma tarefa
**Then** campo dropdown mostra todas as categorias

**And** categoria padrão é "Tarefas"
**And** categoria selecionada é salva com a tarefa
**And** badge da categoria aparece no task card
**And** filtro por categoria funciona imediatamente

**Prerequisites:** Story 3.1 completa

**Technical Notes:**
- Adicionar category dropdown ao task-form.js
- Implementar category-badge component
- Usar cor #e9ecef para badges conforme UX
- Atualizar task schema com category field

### Story 3.3: Sistema de Prioridades Visuais

Como usuário lidando com múltiplas responsabilidades, quero prioridades visuais claras para focar no que importa agora.

**Acceptance Criteria:**

**Given** que estou organizando minhas tarefas
**When** implemento sistema de prioridades
**Then** cada tarefa pode ter Alta (5), Média (3) ou Baixa (1)

**And** indicadores visuais: vermelho (Alta), amarelo (Média), verde (Baixa)
**And** borda esquerda do card indica prioridade
**And** dropdown no formulário para selecionar prioridade
**And** tarefas ordenadas automaticamente por prioridade

**Prerequisites:** Story 3.2 completa

**Technical Notes:**
- Implementar priority-indicator.js
- Usar cores específicas do UX design
- Adicionar campo priority ao task schema
- Implementar ordenação dinâmica da lista

### Story 3.4: Modificação Visual de Prioridades

Como usuário ajustando planejamento, quero modificar prioridades visualmente sem abrir formulários complexos.

**Acceptance Criteria:**

**Given** que vejo minha lista de tarefas
**When** interajo com indicadores de prioridade
**Then** consigo ciclar entre prioridades clicando

**And** mudança tem feedback visual imediato
**And** nova prioridade é salva automaticamente
**And** lista reordena se necessário
**And** cores transicionam suavemente

**Prerequisites:** Story 3.3 completa

**Technical Notes:**
- Implementar click handler no priority-indicator
- Ciclar: Baixa → Média → Alta → Baixa
- Usar CSS transitions para mudança de cor
- Manter focus na task card durante interação

---

## Epic 4: Lembretes e Notificações

Implementar sistema de lembretes visuais baseados em datas para ajudar usuário a não esquecer tarefas importantes.

### Story 4.1: Configuração de Lembretes

Como usuário com tarefas futuras, quero configurar lembretes para dias específicos para não esquecer compromissos.

**Acceptance Criteria:**

**Given** que estou criando ou editando uma tarefa
**When** adiciono um lembrete
**Then** posso selecionar data e hora específicas

**And** campo é opcional (sem lembrete por padrão)
**And** datetime picker nativo do navegador é usado
**And** data é salva como ISO string no LocalStorage
**And** data aparece formatada no task card

**Prerequisites:** Epic 3 completo

**Technical Notes:**
- Adicionar dueDate field ao task schema
- Usar <input type="datetime-local"> no formulário
- Implementar formatação amigável da data
- Validar datas futuras apenas

### Story 4.2: Notificações Visuais de Lembretes

Como usuário, quero ser alertado visualmente quando uma tarefa atinge sua data de lembrete para não esquecê-la.

**Acceptance Criteria:**

**Given** que tenho tarefas com lembretes
**When** a data/hora atual passa do lembrete
**Then** tarefa recebe destaque visual especial

**And** ícone de lembrete aparece no card
**And** card pode ter fundo amarelo suave
**And** contador de tarefas com lembrete hoje
**And** verificação ocorre a cada minuto

**Prerequisites:** Story 4.1 completa

**Technical Notes:**
- Implementar verificação periódica com setInterval
- Adicionar timestamp comparison lógica
- Criar CSS class para tarefas com lembrete ativo
- Implementar date-utils.js para manipulação de datas

### Story 4.3: Filtro de Tarefas com Lembretes

Como usuário planejando meu dia, quero ver facilmente todas as tarefas que têm lembretes para hoje.

**Acceptance Criteria:**

**Given** que uso o app diariamente
**When** abro a aplicação
**Then** vejo seção "Lembretes de Hoje" destacada

**And** quantidade de tarefas com lembrete hoje é visível
**And** consigo filtrar apenas tarefas de hoje
**And** tarefas vencidas aparecem diferenciadas
**And** contador atualiza automaticamente

**Prerequisites:** Story 4.2 completa

**Technical Notes:**
- Implementar filtro de data no category-service
- Adicionar seção especial no sidebar
- Usar Date.now() para comparação em tempo real
- Considerar timezone do usuário

### Story 4.4: Adiamento de Lembretes

Como usuário, quero poder adiar lembretes quando não posso completar a tarefa imediatamente.

**Acceptance Criteria:**

**Given** que uma tarefa tem lembrete ativo
**When** escolho adiar o lembrete
**Then** posso selecionar novo tempo (1h, 3h, amanhã)

**And** nova data é salva automaticamente
**And** destaque visual é removido temporariamente
**And** novo lembrete aparecerá no futuro
**And** histórico de adiamentos (opcional)

**Prerequisites:** Story 4.3 completa

**Technical Notes:**
- Implementar menu de adiar com opções pré-definidas
- Usar date-utils para calcular novas datas
- Manter timestamp original para auditoria
- Implementar undo caso adiar por engano

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._
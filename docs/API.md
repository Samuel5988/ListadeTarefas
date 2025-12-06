# API Documentation - Lista de Tarefas

## Visão Geral

Este projeto utiliza JavaScript vanilla com LocalStorage para persistência de dados. Não existe uma API REST tradicional, mas sim funções públicas que manipulam o estado da aplicação.

## LocalStorage Schema

### Estrutura principal
```javascript
// tasks: Array de objetos contendo todas as tarefas
localStorage.getItem('tasks') // JSON.stringify([
//   {
//     id: "uuid-v4",
//     title: "Título da tarefa",
//     description: "Descrição detalhada",
//     completed: false,
//     priority: "low|medium|high",
//     createdAt: "2025-01-01T00:00:00.000Z",
//     updatedAt: "2025-01-01T00:00:00.000Z"
//   }
// ])

// settings: Objeto com preferências do usuário
localStorage.getItem('settings') // JSON.stringify({
//   theme: "light|dark",
//   defaultPriority: "medium",
//   autoSave: true
// })

// filters: Estado atual dos filtros aplicados
localStorage.getItem('filters') // JSON.stringify({
//   status: "all|completed|pending",
//   priority: "all|low|medium|high",
//   searchTerm: ""
// })
```

## Funções Principais

### Gerenciamento de Tarefas

#### `addTask(taskData)`
Adiciona uma nova tarefa ao sistema.

**Parâmetros:**
- `taskData` (Object): Dados da tarefa
  - `title` (string, obrigatório): Título da tarefa
  - `description` (string, opcional): Descrição detalhada
  - `priority` (string, opcional): Prioridade ("low", "medium", "high")

**Retorna:**
- `string` ID da tarefa criada

**Exemplo:**
```javascript
const taskId = addTask({
  title: "Estudar JavaScript",
  description: "Revisar conceitos de arrays e objetos",
  priority: "high"
});
```

#### `getTask(taskId)`
Busca uma tarefa específica pelo ID.

**Parâmetros:**
- `taskId` (string): ID da tarefa

**Retorna:**
- `Object|null` Objeto da tarefa ou null se não encontrado

#### `updateTask(taskId, updates)`
Atualiza dados de uma tarefa existente.

**Parâmetros:**
- `taskId` (string): ID da tarefa
- `updates` (Object): Campos a atualizar

**Retorna:**
- `boolean` true se atualizado com sucesso

#### `deleteTask(taskId)`
Remove uma tarefa do sistema.

**Parâmetros:**
- `taskId` (string): ID da tarefa

**Retorna:**
- `boolean` true se removido com sucesso

#### `toggleTaskComplete(taskId)`
Alterna o status de conclusão da tarefa.

**Parâmetros:**
- `taskId` (string): ID da tarefa

**Retorna:**
- `boolean` Novo status (true = completo)

#### `getAllTasks()`
Retorna todas as tarefas cadastradas.

**Retorna:**
- `Array` Lista de todas as tarefas

#### `getFilteredTasks(filters)`
Retorna tarefas filtradas conforme critérios.

**Parâmetros:**
- `filters` (Object): Critérios de filtro
  - `status` (string, opcional): "completed", "pending"
  - `priority` (string, opcional): "low", "medium", "high"

**Retorna:**
- `Array` Tarefas filtradas

### Gerenciamento de UI

#### `renderTasks(tasks)`
Renderiza a lista de tarefas na interface.

**Parâmetros:**
- `tasks` (Array): Lista de tarefas para renderizar

#### `showNotification(message, type)`
Exibe uma notificação para o usuário.

**Parâmetros:**
- `message` (string): Mensagem a exibir
- `type` (string): "success", "error", "info"

### Event Listeners

#### Form Events
- `form.addEventListener('submit', handleTaskSubmit)`: Captura submissão de nova tarefa

#### Task Events
- `click`: Botões de editar, excluir, marcar como completo
- `change`: Filtros de status e prioridade

## Exemplos de Uso

### Adicionando e gerenciando tarefas
```javascript
// Criar nova tarefa
const id = addTask({
  title: "Comprar leite",
  priority: "medium"
});

// Atualizar descrição
updateTask(id, {
  description: "Leite desnatado, 1L"
});

// Marcar como completa
toggleTaskComplete(id);

// Buscar todas as tarefas pendentes
const pending = getFilteredTasks({
  status: "pending"
});
```

### Persistência automática
Todas as operações salvam automaticamente no LocalStorage. Não é necessário chamar funções de save manualmente.

## Debug

### Acessar dados diretamente
```javascript
// Ver todas as tarefas no console
console.log(JSON.parse(localStorage.getItem('tasks')));

// Limpar todos os dados (cuidado!)
localStorage.clear();
```

### Verificar storage disponível
```javascript
function checkStorage() {
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    return true;
  } catch {
    return false;
  }
}
```
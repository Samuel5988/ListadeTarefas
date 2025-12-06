/**
 * Exemplo de como adicionar JSDoc às funções do seu projeto
 * Copie e adapte estes exemplos para seu código real
 */

/**
 * Representa uma tarefa na aplicação
 * @typedef {Object} Task
 * @property {string} id - Identificador único da tarefa (UUID v4)
 * @property {string} title - Título da tarefa
 * @property {string} [description] - Descrição detalhada da tarefa
 * @property {boolean} completed - Indica se a tarefa foi concluída
 * @property {'low'|'medium'|'high'} priority - Nível de prioridade
 * @property {Date} createdAt - Data de criação
 * @property {Date} updatedAt - Data da última atualização
 */

/**
 * Adiciona uma nova tarefa ao sistema e persiste no LocalStorage
 * @param {Object} taskData - Dados da nova tarefa
 * @param {string} taskData.title - Título da tarefa (mínimo 3 caracteres)
 * @param {string} [taskData.description] - Descrição detalhada da tarefa
 * @param {'low'|'medium'|'high'} [taskData.priority='medium'] - Nível de prioridade
 * @returns {Promise<string>} Promise que resolve com o ID da tarefa criada
 * @throws {Error} Quando o título tem menos de 3 caracteres
 * @example
 * // Criar tarefa de alta prioridade
 * const taskId = await addTask({
 *   title: 'Estudar para prova',
 *   description: 'Revisar capítulos 1-5',
 *   priority: 'high'
 * });
 * console.log(`Tarefa criada com ID: ${taskId}`);
 */
async function addTask(taskData) {
  // Validar entrada
  if (!taskData.title || taskData.title.length < 3) {
    throw new Error('Título deve ter pelo menos 3 caracteres');
  }

  // Criar objeto tarefa
  const task = {
    id: generateUUID(),
    title: taskData.title.trim(),
    description: taskData.description?.trim() || '',
    priority: taskData.priority || 'medium',
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Salvar no storage
  const tasks = await getAllTasks();
  tasks.push(task);
  await saveTasks(tasks);

  // Renderizar na UI
  renderTaskElement(task);

  // Notificar usuário
  showNotification('Tarefa adicionada com sucesso!', 'success');

  return task.id;
}

/**
 * Busca uma tarefa específica pelo seu ID
 * @param {string} taskId - ID da tarefa a buscar
 * @returns {Promise<Task|null>} Promise que resolve com a tarefa encontrada ou null
 * @example
 * const task = await getTask('abc-123');
 * if (task) {
 *   console.log(`Tarefa: ${task.title}`);
 * }
 */
async function getTask(taskId) {
  const tasks = await getAllTasks();
  return tasks.find(task => task.id === taskId) || null;
}

/**
 * Atualiza dados de uma tarefa existente
 * @param {string} taskId - ID da tarefa a atualizar
 * @param {Partial<Task>} updates - Campos a serem atualizados
 * @returns {Promise<boolean>} Promise que resolve com true se atualizado com sucesso
 * @throws {Error} Quando a tarefa não é encontrada
 * @example
 * // Atualizar título e marcar como completa
 * const success = await updateTask('abc-123', {
 *   title: 'Novo título',
 *   completed: true
 * });
 */
async function updateTask(taskId, updates) {
  const tasks = await getAllTasks();
  const taskIndex = tasks.findIndex(task => task.id === taskId);

  if (taskIndex === -1) {
    throw new Error('Tarefa não encontrada');
  }

  // Atualizar campos
  tasks[taskIndex] = {
    ...tasks[taskIndex],
    ...updates,
    updatedAt: new Date()
  };

  await saveTasks(tasks);

  // Re-renderizar na UI
  updateTaskElement(tasks[taskIndex]);

  showNotification('Tarefa atualizada com sucesso!', 'success');

  return true;
}

/**
 * Remove uma tarefa do sistema
 * @param {string} taskId - ID da tarefa a remover
 * @returns {Promise<boolean>} Promise que resolve com true se removido com sucesso
 * @example
 * if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
 *   await deleteTask('abc-123');
 * }
 */
async function deleteTask(taskId) {
  const tasks = await getAllTasks();
  const filteredTasks = tasks.filter(task => task.id !== taskId);

  if (filteredTasks.length === tasks.length) {
    return false; // Tarefa não encontrada
  }

  await saveTasks(filteredTasks);

  // Remover da UI com animação
  const element = document.querySelector(`[data-task-id="${taskId}"]`);
  if (element) {
    element.classList.add('fade-out');
    setTimeout(() => element.remove(), 300);
  }

  showNotification('Tarefa excluída com sucesso!', 'info');

  return true;
}

/**
 * Alterna o status de conclusão de uma tarefa
 * @param {string} taskId - ID da tarefa
 * @returns {Promise<boolean>} Promise que resolve com o novo status (true = completa)
 * @example
 * // Ao clicar no checkbox
 * const isComplete = await toggleTaskComplete('abc-123');
 * console.log(`Tarefa ${isComplete ? 'completada' : 'reaberta'}`);
 */
async function toggleTaskComplete(taskId) {
  const task = await getTask(taskId);
  if (!task) {
    throw new Error('Tarefa não encontrada');
  }

  const newStatus = !task.completed;
  await updateTask(taskId, { completed: newStatus });

  return newStatus;
}

/**
 * Retorna todas as tarefas cadastradas
 * @returns {Promise<Task[]>} Promise que resolve com array de todas as tarefas
 */
async function getAllTasks() {
  const stored = localStorage.getItem('tasks');
  return stored ? JSON.parse(stored) : [];
}

/**
 * Filtra tarefas baseado em critérios específicos
 * @param {Object} filters - Critérios de filtro
 * @param {'completed'|'pending'} [filters.status] - Filtrar por status
 * @param {'low'|'medium'|'high'} [filters.priority] - Filtrar por prioridade
 * @param {string} [filters.searchTerm] - Termo para busca no título/descrição
 * @returns {Promise<Task[]>} Promise que resolve com array de tarefas filtradas
 * @example
 * // Todas as tarefas completas de alta prioridade
 * const tasks = await getFilteredTasks({
 *   status: 'completed',
 *   priority: 'high'
 * });
 */
async function getFilteredTasks(filters = {}) {
  const tasks = await getAllTasks();

  return tasks.filter(task => {
    // Filtro por status
    if (filters.status === 'completed' && !task.completed) return false;
    if (filters.status === 'pending' && task.completed) return false;

    // Filtro por prioridade
    if (filters.priority && task.priority !== filters.priority) return false;

    // Filtro por termo de busca
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      const titleMatch = task.title.toLowerCase().includes(term);
      const descMatch = task.description.toLowerCase().includes(term);
      if (!titleMatch && !descMatch) return false;
    }

    return true;
  });
}

/**
 * Gera um UUID v4 único
 * @returns {string} UUID gerado
 * @example
 * const id = generateUUID(); // 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Salva array de tarefas no LocalStorage
 * @private
 * @param {Task[]} tasks - Array de tarefas para salvar
 */
async function saveTasks(tasks) {
  try {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  } catch (error) {
    console.error('Erro ao salvar tarefas:', error);
    showNotification('Erro ao salvar dados no navegador', 'error');
    throw new Error('Falha ao salvar no LocalStorage');
  }
}

/**
 * Renderiza uma tarefa no DOM
 * @param {Task} task - Tarefa a renderizar
 * @example
 * renderTaskElement({
 *   id: 'abc-123',
 *   title: 'Minha tarefa',
 *   completed: false,
 *   priority: 'high'
 * });
 */
function renderTaskElement(task) {
  const template = document.getElementById('task-template');
  const clone = template.content.cloneNode(true);

  // Preencher dados
  clone.querySelector('.task-title').textContent = task.title;
  clone.querySelector('.task-description').textContent = task.description;
  clone.querySelector('.task-checkbox').checked = task.completed;
  clone.querySelector('[data-task-id]').dataset.taskId = task.id;

  // Adicionar classes
  const element = clone.firstElementChild;
  element.classList.add(`priority-${task.priority}`);
  if (task.completed) {
    element.classList.add('completed');
  }

  // Adicionar ao DOM
  document.getElementById('tasks-list').appendChild(element);
}

/**
 * Exibe uma notificação para o usuário
 * @param {string} message - Mensagem a exibir
 * @param {'success'|'error'|'info'} type - Tipo da notificação
 * @param {number} [duration=3000] - Duração em milissegundos
 * @example
 * showNotification('Operação concluída!', 'success');
 */
function showNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div');
  notification.className = `notification notification--${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('notification--hide');
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

// Exportar funções para uso em outros módulos
export {
  addTask,
  getTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
  getAllTasks,
  getFilteredTasks,
  renderTaskElement,
  showNotification
};
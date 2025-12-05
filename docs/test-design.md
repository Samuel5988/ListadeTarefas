# Test Design - Lista de Tarefas

**Author:** Murat (Master Test Architect)
**Date:** 2025-12-05
**Epic:** All Epics
**Scope:** Full

---

## Executive Summary

Este documento define a estratégia abrangente de testes para a aplicação "Lista de Tarefas", baseada em análise de riscos e priorização de cenários críticos. Como aplicação frontend com armazenamento local, o foco principal é na integridade de dados e experiência do usuário.

---

## Risk Assessment Matrix

### Critical Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation |
|---------|----------|-------------|-------------|---------|-------|------------|
| R-001 | DATA | Perda de dados do LocalStorage | 2 | 3 | 6 | Implementar exportação manual e backup |
| R-002 | TECH | Exceder limite do LocalStorage (5-10MB) | 2 | 2 | 4 | Monitorar tamanho, alerta usuário |
| R-003 | PERF | Degradação com 1000+ tarefas | 2 | 2 | 4 | Virtual scrolling, lazy loading |
| R-004 | SEC | XSS em campos de input do usuário | 1 | 3 | 3 | Sanitização, textContent |

### Medium Risks (Score 3-5)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation |
|---------|----------|-------------|-------------|---------|-------|------------|
| R-005 | TECH | Falha em schema unificado | 1 | 3 | 3 | Versionamento, migração |
| R-006 | BUS | Interface confusa para mente turbulenta | 2 | 2 | 4 | Testes de usabilidade |
| R-007 | OPS | Dados corrompidos no localStorage | 1 | 2 | 2 | Validação, fallback |

### Low Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation |
|---------|----------|-------------|-------------|---------|-------|------------|
| R-008 | TECH | Incompatibilidade browser | 1 | 2 | 2 | Progressive enhancement |
| R-009 | PERF | Carregamento inicial >1s | 1 | 1 | 1 | Otimizar CSS delivery |

---

## Coverage Matrix

| Requirement | Epic | Test Level | Priority | Risk Link | Test Count | Owner |
|-------------|------|------------|----------|-----------|------------|-------|
| **FR-001: Criar tarefa** | 2 | Component | P0 | R-004 | 3 | QA |
| **FR-002: Editar tarefa** | 2 | Component | P0 | R-004 | 2 | QA |
| **FR-003: Remover tarefa** | 2 | Component | P0 | R-004 | 2 | QA |
| **FR-004: Marcar concluída** | 2 | Component | P0 | R-004 | 2 | QA |
| **FR-005: Atribuir prioridade** | 3 | Component | P1 | R-006 | 3 | QA |
| **FR-006: Ordenar por prioridade** | 3 | Component | P1 | R-006 | 2 | QA |
| **FR-007: Modificar prioridades** | 3 | Component | P1 | R-006 | 2 | QA |
| **FR-008: Destaque visual** | 3 | Component | P1 | R-006 | 2 | QA |
| **FR-009: Criar categorias** | 3 | Component | P1 | R-006 | 3 | QA |
| **FR-010: Atribuir categoria** | 3 | Component | P1 | R-006 | 2 | QA |
| **FR-011: Filtrar por categoria** | 3 | Component | P1 | R-006 | 2 | QA |
| **FR-012: Contador por categoria** | 3 | Component | P1 | R-006 | 1 | QA |
| **FR-013: Configurar lembrete** | 4 | Component | P2 | R-003 | 2 | QA |
| **FR-014: Notificação visual** | 4 | Component | P2 | R-003 | 2 | QA |
| **FR-015: Ver lembretes hoje** | 4 | Component | P2 | R-003 | 1 | QA |
| **FR-016: Adiar lembretes** | 4 | Component | P2 | R-003 | 1 | QA |

---

## Test Strategy by Level

### Unit Tests (70% = 34 tests)

**Focus:** Pure functions and business logic

**Test Scenarios:**
- Task validation and creation
- Priority calculations
- Date formatting and manipulation
- Theme switching logic
- Category management
- Storage schema validation
- Error handling utilities

**Tools:** Jest or similar lightweight framework

### Component Tests (20% = 10 tests)

**Focus:** UI component behavior in isolation

**Test Scenarios:**
- Task Card rendering and interactions
- Task Form submission and validation
- Category sidebar filtering
- Priority indicator cycling
- Modal open/close behavior
- Theme switcher toggle

**Tools:** Testing Library + Jest

### E2E Tests (10% = 5 tests)

**Focus:** Critical user journeys

**Test Scenarios:**
1. **Complete Task Lifecycle**
   - Create → Edit → Complete → Delete
   - Verify persistence throughout

2. **Priority Management Flow**
   - Create tasks with different priorities
   - Verify automatic ordering
   - Modify priorities visually

3. **Category Organization**
   - Create categories
   - Assign tasks to categories
   - Filter and verify counts

4. **Data Persistence**
   - Add tasks
   - Refresh browser
   - Verify all data intact

5. **Theme Switching**
   - Toggle light/dark
   - Verify preference persists

**Tools:** Playwright or Cypress

---

## Priority Execution Plan

### Smoke Tests (< 5 min)
- Application loads without errors
- Task form opens
- Theme switch works

### P0 Tests (< 10 min) - Core Functionality
1. Create task with title only
2. Create task with title and description
3. Edit existing task
4. Mark task as completed
5. Delete task with confirmation
6. Verify data persists after refresh

### P1 Tests (< 30 min) - Important Features
7. Create and manage categories
8. Assign task to category
9. Filter tasks by category
10. Set task priority (High/Medium/Low)
11. Verify visual priority indicators
12. Modify priority via clicking
13. Verify automatic reordering
14. Toggle between light/dark themes
15. Verify theme persistence

### P2/P3 Tests (< 60 min) - Full Regression
16. Configure reminders for tasks
17. Verify reminder notifications
18. View "Today's reminders" section
19. Postpone reminders (1h, 3h, tomorrow)
20. Create 1000+ tasks and verify performance
21. Test with invalid inputs
22. Verify XSS protection
23. Test offline functionality
24. Export/import data functionality

---

## Resource Estimates

### Test Effort Breakdown

| Priority | Scenarios | Hours per Scenario | Total Hours |
|----------|-----------|-------------------|------------|
| P0 | 14 | 2 | 28 |
| P1 | 18 | 1 | 18 |
| P2 | 6 | 0.5 | 3 |
| **Total** | **38** | - | **49** |

**Total Effort:** ~49 hours (~6 days for 1 QA engineer)

### Infrastructure Needs

- **Test Framework:** Jest + Testing Library
- **E2E Tool:** Playwright (recommended) or Cypress
- **CI Integration:** GitHub Actions or similar
- **Browser Matrix:** Chrome, Firefox, Safari
- **Test Data:** Fixtures for various task scenarios

---

## Quality Gate Criteria

### Go/No-Go Requirements

✅ **Mandatory:**
- All P0 tests passing (100%)
- P1 test pass rate ≥95%
- No critical security vulnerabilities (R-004 mitigated)
- Data integrity verified (R-001 mitigated)

⚠️ **Warnings:**
- Any P2 test failures
- Performance degradation with 1000+ tasks
- Browser compatibility issues

❌ **Blockers:**
- P0 test failures
- Data loss scenarios
- Security vulnerabilities unpatched

### Coverage Targets

- **Statement Coverage:** ≥80% for critical paths
- **Branch Coverage:** ≥70% for business logic
- **E2E Coverage:** 100% of user stories

---

## Test Data Strategy

### Test Factories

```javascript
// Example task factory
const createTask = (overrides = {}) => ({
  id: `task_${Date.now()}_${Math.random()}`,
  title: 'Test Task',
  description: 'Test Description',
  completed: false,
  priority: 3,
  category: 'Tarefas',
  dueDate: null,
  created: new Date().toISOString(),
  modified: new Date().toISOString(),
  ...overrides
});
```

### Data Scenarios

- Empty state (no tasks)
- Single task
- Multiple tasks with variations
- Completed and pending mix
- All priority levels represented
- Maximum limit scenarios
- Corrupted data recovery

---

## Automation Recommendations

### Continuous Testing

1. **On Commit:** Run P0 unit tests
2. **On PR:** Run P0 + P1 tests
3. **Nightly:** Full regression (P0-P2)
4. **Pre-release:** Full test suite + performance

### Test Environment Setup

```javascript
// jest.config.js example
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'components/**/*.js',
    'services/**/*.js',
    'utils/**/*.js',
    '!**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

---

## Risk Mitigation Progress

### High-Priority Items (Score ≥6)

1. **R-001 (DATA): LocalStorage loss**
   - ✅ Test scenarios defined
   - ⏳ Export feature needed
   - ⏳ Backup strategy to implement

2. **R-004 (SEC): XSS prevention**
   - ✅ Input sanitization tests
   - ✅ textContent usage verification
   - ✅ User input validation

---

## Next Steps

1. **Immediate (Day 1-2):**
   - Set up test framework (Jest + Testing Library)
   - Create test factories and fixtures
   - Implement P0 unit tests for task CRUD

2. **Week 1:**
   - Complete all P0 test scenarios
   - Set up CI pipeline
   - Begin P1 component tests

3. **Week 2:**
   - Complete P1 test suite
   - Implement E2E tests for critical paths
   - Performance testing with large datasets

4. **Ongoing:**
   - Add tests for new features
   - Maintain and update test suite
   - Monitor flaky tests and fix promptly

---

## Appendix: Test Framework Template

### Recommended Stack

```json
{
  "dependencies": {
    "@testing-library/jest-dom": "^5.16.4",
    "@testing-library/user-event": "^14.4.3",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.35.0",
    "msw": "^1.2.1"
  }
}
```

### Example Test Structure

```
tests/
├── unit/
│   ├── task-manager.test.js
│   ├── date-utils.test.js
│   └── theme-manager.test.js
├── component/
│   ├── task-card.test.js
│   ├── task-form.test.js
│   └── category-sidebar.test.js
├── e2e/
│   ├── task-lifecycle.spec.js
│   ├── priority-management.spec.js
│   └── data-persistence.spec.js
└── fixtures/
    ├── task-factory.js
    └── mock-data.js
```

---

**Document Status:** Complete
**Next Review:** Before implementation
**Approval:** Pending from development team

---

*Generated by BMad Test Architect Workflow v4.0*
*Date: 2025-12-05*
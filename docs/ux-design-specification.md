# UX Design Specification - Lista de Tarefas

**Author:** BMad (Sally - UX Designer)
**Date:** 2025-12-04
**Version:** 1.0
**Design System:** shadcn/ui + Tailwind CSS
**Emotional Foundation:** Alívio + Controle + Foco + Calma

---

## Executive Summary

Lista de Tarefas é uma aplicação web minimalista e estruturada projetada especificamente para mentes turbulentas que precisam externalizar e organizar o caos mental. O design segue princípios de Clareza Mental com organização por categorias, proporcionando controle total sobre estrutura e fluxo de trabalho.

**Core Experience:** "É o app onde eu tenho controle total porque construí, organizo rapidamente e vejo exatamente o que fazer"

---

## Design Foundation

### Design System Choice
- **System:** shadcn/ui com Tailwind CSS
- **Rationale:** Balance ideal entre aprendizado técnico, velocidade de desenvolvimento, e capacidade de customização
- **Provides:** Botões, cards, modals, forms, notificações - componente library completa
- **Customization:** Adaptado para cores calmas e experiência minimalista

### Visual Identity: Clareza Mental
- **Primary Color:** #6c757d (cinza suave)
- **Secondary:** #495057 (cinza escuro)
- **Accent:** #868e96 (cinza claro)
- **Success:** #28a745 (verde suave)
- **Warning:** #ffc107 (amarelo suave)
- **Error:** #dc3545 (vermelho moderado)
- **Grayscale:** #ffffff → #dee2e6 (5 níveis)

### Typography System
- **Font:** -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto (system fonts)
- **Headings:** Font-weight 300-500, clean hierarchy
- **Body:** Regular weight, excellent readability
- **Small:** 0.8rem, muted colors for meta information

### Spacing Foundation
- **Base Unit:** 8px (0.5rem)
- **Scale:** xs(4px), sm(8px), md(16px), lg(24px), xl(32px), 2xl(48px)
- **Layout:** 16px padding for cards, 24px for sections

---

## Layout Architecture

### Main Structure: Sidebar + Content

```
┌─────────────────────────────────────────┐
│ Header: Logo + User Profile             │
├─────────┬───────────────────────────────┤
│ Sidebar │ Main Content Area             │
│ (250px) │                               │
│         │ Category Header               │
│         │ Task List                     │
│         │                               │
│         │ Floating Action Button (+)    │
└─────────┴───────────────────────────────┘
```

### Sidebar Navigation
- **Width:** 250px on desktop, full-width on mobile with toggle
- **Header:** "Categorias" with "+ Nova" button for creating new categories
- **Categories List:** Clickable items with active state highlighting
- **Category Counters:** Badge showing number of tasks per category
- **Active State:** Primary background with white text
- **Default Category:** "Tarefas" as the starting category

### Content Area
- **Maximum Width:** 800px centered
- **Responsive:** Single column on mobile, optimal readability
- **Category Header:** Title + task count + stats
- **Task Cards:** Full-width with priority indicators

---

## Component Design System

### Task Cards (Core Component)
```
┌─────────────────────────────────────────┐
│ │ Task Title (bold, primary)            │
│ └── Task Description (optional, muted)  │
│                                         │
│ • Category Badge • Due Date • Priority  │
└─────────────────────────────────────────┘
```

**States:**
- **Default:** White background, border
- **Hover:** Translate 4px right, shadow
- **Completed:** Strike-through title, opacity 0.6
- **Priority High:** Left border red
- **Priority Medium:** Left border yellow
- **Priority Low:** Left border green

### Priority Indicators
- **High Priority:** #dc3545 (vermelho), "🔴" + "Alta" text
- **Medium Priority:** #ffc107 (amarelo), "🟡" + "Média" text
- **Low Priority:** #28a745 (verde), "🟢" + "Baixa" text

### Category System
**Default Category:**
- 📋 **Tarefas** - Default category for all tasks

**User-Created Categories:**
Users can create unlimited custom categories through the sidebar:
- Click "+ Nova" button next to "Categorias" header
- Simple modal with just category name input
- Categories appear immediately in sidebar with task counters
- Full flexibility to organize tasks however makes sense for the user

**Category Badges:**
- Background: #e9ecef (gray-3)
- Text: Current text color
- Padding: 2px 8px
- Border-radius: 12px
- Font-size: 0.8rem

### Floating Action Button (FAB)
- **Position:** Fixed bottom-right (30px from edges)
- **Size:** 60px diameter
- **Shape:** Perfect circle
- **Background:** Primary color (#6c757d)
- **Icon:** White "+" symbol (28px)
- **Shadow:** 0 4px 12px rgba(0,0,0,0.2)
- **Hover:** Scale 1.1, darker background

---

## Interaction Patterns

### Creation Flow (Zero-Effort)
1. **Trigger:** Click FAB button
2. **Modal:** Overlay appears with form
3. **Form Fields:**
   - Title (required, auto-focus)
   - Description (optional, textarea)
   - Priority dropdown (default: Média)
   - Category dropdown (default: Tarefas)
   - Reminder (optional, datetime picker)
4. **Actions:** Cancel (secondary) / Create Task (primary)
5. **Success:** Modal closes, task appears in list with animation

### Category Creation Flow
1. **Trigger:** Click "+ Nova" button in sidebar header
2. **Modal:** Simple overlay with single input
3. **Form Field:** Category name (required, auto-focus)
4. **Actions:** Cancel (secondary) / Create Category (primary)
5. **Success:** Modal closes, new category appears in sidebar immediately

### Task Interactions
- **Checkbox:** Circular, transitions to green checkmark on completion
- **Hover:** Subtle right translation with shadow
- **Drag & Drop:** Visual feedback showing reorder capability
- **Priority Change:** Click priority indicator or drag between columns

### Navigation
- **Category Switch:** Click sidebar item to filter tasks
- **Active State:** Primary background, white text
- **Responsive:** Mobile hamburger menu for sidebar
- **Back Button:** Browser back navigation supported

---

## User Journey Flows

### Primary: Capture & Organize Journey
**Goal:** Externalize idea → Organize by context → Track completion

1. **Idea Generation:** User has thought/idea
2. **Quick Capture:** Click FAB → Type title → Save (3 seconds)
3. **Context Assignment:** Category + Priority + Due date
4. **Visual Organization:** Task appears in appropriate category
5. **Daily Review:** See all tasks by priority across categories

### Secondary: Daily Planning Journey
**Goal:** Start day with clarity on what matters most

1. **Morning Review:** Open app, see dashboard stats
2. **Priority Focus:** High-priority tasks highlighted
3. **Category Context:** Work vs personal tasks separated
4. **Execution Plan:** Clear visual hierarchy of what to do first
5. **Progress Tracking:** Checkboxes provide satisfaction

---

## Responsive Strategy

### Breakpoints
- **Mobile:** 0-767px (single column, hamburger menu)
- **Tablet:** 768-1023px (sidebar collapses, full-width content)
- **Desktop:** 1024px+ (sidebar fixed, optimal content width)

### Mobile Adaptations
- **Sidebar:** Hamburger menu icon, overlay navigation
- **FAB:** Larger touch target (60px minimum)
- **Task Cards:** Increased spacing for touch accuracy
- **Modal:** Full-width on small screens
- **Typography:** Slightly larger for readability

### Desktop Enhancements
- **Keyboard Navigation:** Full accessibility support
- **Hover States:** Rich interaction feedback
- **Drag & Drop:** Mouse-based reordering
- **Multi-task:** Batch operations available

---

## Accessibility Requirements

### WCAG 2.1 Level AA Compliance
- **Color Contrast:** All text meets 4.5:1 ratio minimum
- **Keyboard Navigation:** Tab through all interactive elements
- **Focus Indicators:** Visible outlines on all focusable elements
- **Screen Reader:** ARIA labels and semantic HTML
- **Touch Targets:** Minimum 44px for mobile interaction

### Accessibility Features
- **Skip Links:** Jump to main content, navigation
- **Alternative Text:** Descriptive text for all meaningful images
- **Form Labels:** Proper label associations for all inputs
- **Error Messages:** Clear, descriptive error identification
- **Announcements:** Screen reader notifications for state changes

---

## Animation & Feedback

### Micro-interactions
- **Task Completion:** Checkbox fills with green, slight scale effect
- **Priority Change:** Color transition with smooth fade
- **Modal Appearance:** Slide-up animation with backdrop fade
- **FAB Press:** Scale effect with color change
- **Category Switch:** Smooth transition between task lists

### Loading States
- **Initial Load:** Skeleton cards for task structure
- **Form Submission:** Button loading state with spinner
- **Data Fetching:** Subtle progress indicators
- **Error Recovery:** Clear error messaging with retry options

---

## Technical Implementation Notes

### Component Library Integration
```html
<!-- Example Task Card Structure -->
<div class="task-item" data-priority="high">
  <div class="priority-indicator"></div>
  <div class="task-checkbox"></div>
  <div class="task-content">
    <div class="task-title">Task title here</div>
    <div class="task-description" if present>Description here</div>
    <div class="task-meta">
      <span class="task-category">Category</span>
      <span>Due date</span>
      <span>Priority level</span>
    </div>
  </div>
</div>
```

### CSS Variables Theme
```css
:root {
  --primary: #6c757d;
  --primary-dark: #495057;
  --primary-light: #868e96;
  --success: #28a745;
  --warning: #ffc107;
  --error: #dc3545;
  --gray-1: #ffffff;
  --gray-2: #f8f9fa;
  --gray-3: #e9ecef;
  --gray-4: #dee2e6;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.12);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --transition: all 0.3s ease;
}
```

### JavaScript Interactions
- Event delegation for dynamic task lists
- LocalStorage persistence with automatic save
- Modal management with backdrop handling
- Category filtering with URL state management
- Touch gesture support for mobile interactions

---

## Success Metrics

### Emotional Success Indicators
- **Alívio:** Users report feeling less overwhelmed after using app
- **Controle:** Users can easily reorganize tasks by category/priority
- **Foco:** Clear visual hierarchy helps identify important tasks
- **Calma:** Clean interface reduces cognitive load

### Behavioral Success Metrics
- **Adoption Rate:** Daily usage becomes natural habit
- **Task Creation Velocity:** < 3 seconds from idea to capture
- **Completion Rate:** High percentage of tasks marked complete
- **Category Usage:** Users actively organize tasks across categories

---

## Evolution Roadmap

### Phase 1: Core Experience (Current Scope)
- [x] Task CRUD operations
- [x] Category organization
- [x] Priority system
- [x] Basic reminders
- [x] Responsive design

### Phase 2: Enhanced Organization (Future)
- [ ] Drag & drop reordering
- [ ] Advanced filtering and search
- [ ] Bulk operations
- [ ] Custom categories
- [ ] Task templates

### Phase 3: Intelligence & Insights (Vision)
- [ ] Smart suggestions based on patterns
- [ ] Productivity analytics dashboard
- [ ] Recurring task patterns
- [ ] Calendar integration
- [ ] Voice input capabilities

---

## Design Assets & Deliverables

### Created Files
- **ux-color-themes.html:** Interactive color theme explorer
- **ux-design-directions.html:** Complete mockup directions showcase
- **ux-design-specification.md:** This comprehensive design documentation

### Developer Handoff
- **Component Library:** shadcn/ui with custom theme variables
- **Color Palette:** Complete hex codes and usage guidelines
- **Typography:** Font families, sizes, and weights
- **Spacing:** 8px grid system with scale
- **Interaction:** Animation timing and easing functions

---

## Conclusion

This UX specification establishes a foundation for creating a task management application that truly serves the needs of turbulent minds. The combination of structured category organization, calm visual design, and intuitive interactions creates an experience that provides relief, control, focus, and calm.

The design decisions prioritize clarity and ease of use while maintaining flexibility for personalization and growth. The structured approach with shadcn/ui ensures both rapid development and professional results.

**Next Steps:**
1. Implement core components using this specification
2. Test with real users for emotional response validation
3. Iterate based on feedback while maintaining core principles
4. Expand functionality following the established design patterns

---

*This specification represents the collaborative design work between BMad and Sally (UX Designer), focused on creating an exceptional user experience for the Lista de Tarefas application.*
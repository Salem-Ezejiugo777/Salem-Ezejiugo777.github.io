// ============ CALENDAR MANAGEMENT ============
class Calendar {
  constructor() {
    this.currentDate = new Date();
    this.events = this.loadEvents();
    this.tasks = this.loadTasks();
    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
    this.updateAgenda();
    this.updateStats();
    this.loadSampleData();
  }

  // ============ CALENDAR RENDERING ============
  render() {
    this.renderMonthView();
    this.updateMonthYear();
  }

  renderMonthView() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    // Previous month's days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const dayEl = this.createDayElement(day, true, new Date(year, month - 1, day));
      grid.appendChild(dayEl);
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEl = this.createDayElement(day, false, date);
      grid.appendChild(dayEl);
    }

    // Next month's days
    const totalCells = grid.children.length;
    const remainingCells = 42 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
      const dayEl = this.createDayElement(day, true, new Date(year, month + 1, day));
      grid.appendChild(dayEl);
    }
  }

  createDayElement(day, isOtherMonth, date) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    
    if (isOtherMonth) {
      dayEl.classList.add('other-month');
    }

    // Check if today
    const today = new Date();
    if (day === today.getDate() && 
        date.getMonth() === today.getMonth() && 
        date.getFullYear() === today.getFullYear()) {
      dayEl.classList.add('today');
    }

    // Day number
    const dayNum = document.createElement('div');
    dayNum.className = 'day-number';
    dayNum.textContent = day;
    dayEl.appendChild(dayNum);

    // Events for this day
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'day-events';

    const dateStr = this.formatDate(date);
    const dayEvents = this.events.filter(e => e.date === dateStr);

    dayEvents.slice(0, 2).forEach(event => {
      const dot = document.createElement('div');
      dot.className = `event-dot ${event.color}`;
      eventsContainer.appendChild(dot);
    });

    if (dayEvents.length > 2) {
      const more = document.createElement('div');
      more.style.fontSize = '10px';
      more.style.color = '#999';
      more.textContent = `+${dayEvents.length - 2}`;
      eventsContainer.appendChild(more);
    }

    dayEl.appendChild(eventsContainer);

    // Click to add event
    dayEl.addEventListener('click', () => this.openEventModal(date));

    return dayEl;
  }

  updateMonthYear() {
    const options = { month: 'long', year: 'numeric' };
    const monthYear = this.currentDate.toLocaleDateString('en-US', options);
    document.getElementById('month-year').textContent = monthYear;
  }

  // ============ DATE UTILITIES ============
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // ============ NAVIGATION ============
  previousMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.render();
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.render();
  }

  goToToday() {
    this.currentDate = new Date();
    this.render();
  }

  // ============ EVENT MANAGEMENT ============
  openEventModal(date = null) {
    const modal = document.getElementById('event-modal');
    const dateInput = document.getElementById('event-date');

    if (date) {
      dateInput.value = this.formatDate(date);
    }

    modal.classList.add('active');
  }

  closeEventModal() {
    const modal = document.getElementById('event-modal');
    modal.classList.remove('active');
    document.getElementById('event-form').reset();
  }

  addEvent(eventData) {
    this.events.push(eventData);
    this.saveEvents();
    this.render();
    this.updateAgenda();
    this.updateStats();
  }

  saveEvents() {
    localStorage.setItem('planner_events', JSON.stringify(this.events));
  }

  loadEvents() {
    const stored = localStorage.getItem('planner_events');
    return stored ? JSON.parse(stored) : [];
  }

  // ============ TASK MANAGEMENT ============
  addTask(title) {
    const task = {
      id: Date.now(),
      title,
      completed: false,
      createdAt: new Date().toISOString()
    };

    this.tasks.push(task);
    this.saveTasks();
    this.updateTasksList();
    this.updateStats();
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.saveTasks();
    this.updateTasksList();
    this.updateStats();
  }

  toggleTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.updateTasksList();
      this.updateStats();
    }
  }

  saveTasks() {
    localStorage.setItem('planner_tasks', JSON.stringify(this.tasks));
  }

  loadTasks() {
    const stored = localStorage.getItem('planner_tasks');
    return stored ? JSON.parse(stored) : [];
  }

  updateTasksList() {
    const tasksList = document.getElementById('tasks-list');
    tasksList.innerHTML = '';

    if (this.tasks.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No tasks yet. Add one to get started!';
      tasksList.appendChild(empty);
      return;
    }

    this.tasks.forEach(task => {
      const taskEl = document.createElement('div');
      taskEl.className = `task-item ${task.completed ? 'completed' : ''}`;

      taskEl.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} />
        <span class="task-text">${this.escapeHtml(task.title)}</span>
        <button class="task-delete" title="Delete task">
          <i class="fas fa-trash"></i>
        </button>
      `;

      const checkbox = taskEl.querySelector('.task-checkbox');
      checkbox.addEventListener('change', () => this.toggleTask(task.id));

      const deleteBtn = taskEl.querySelector('.task-delete');
      deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

      tasksList.appendChild(taskEl);
    });
  }

  updateStats() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    const monthEvents = this.events.filter(e => {
      const eDate = new Date(e.date);
      return eDate >= monthStart && eDate <= monthEnd;
    }).length;

    const pendingTasks = this.tasks.filter(t => !t.completed).length;

    document.getElementById('stat-events').textContent = monthEvents;
    document.getElementById('stat-pending').textContent = pendingTasks;
  }

  // ============ AGENDA ============
  updateAgenda() {
    const agendaList = document.getElementById('agenda-list');
    const today = this.formatDate(new Date());

    const todayEvents = this.events
      .filter(e => e.date === today)
      .sort((a, b) => {
        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        return timeA.localeCompare(timeB);
      });

    agendaList.innerHTML = '';

    if (todayEvents.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No events today';
      agendaList.appendChild(empty);
      return;
    }

    todayEvents.forEach(event => {
      const agendaItem = document.createElement('div');
      agendaItem.className = 'agenda-item';
      
      const time = event.time ? this.formatTime(event.time) : 'All day';
      
      agendaItem.innerHTML = `
        <div class="agenda-time">${time}</div>
        <div class="agenda-title">${this.escapeHtml(event.title)}</div>
      `;
      
      agendaList.appendChild(agendaItem);
    });
  }

  formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  // ============ EVENT LISTENERS ============
  attachEventListeners() {
    // Navigation
    document.getElementById('prev-month').addEventListener('click', () => this.previousMonth());
    document.getElementById('next-month').addEventListener('click', () => this.nextMonth());
    document.getElementById('today-btn').addEventListener('click', () => this.goToToday());

    // Modal
    document.getElementById('add-event-btn').addEventListener('click', () => this.openEventModal());
    document.getElementById('modal-close').addEventListener('click', () => this.closeEventModal());
    document.getElementById('modal-cancel').addEventListener('click', () => this.closeEventModal());
    document.getElementById('modal-overlay').addEventListener('click', () => this.closeEventModal());

    // Form submission
    document.getElementById('event-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleEventFormSubmit();
    });

    // Tasks
    document.getElementById('add-task-btn').addEventListener('click', () => {
      const input = document.getElementById('task-input');
      if (input.value.trim()) {
        this.addTask(input.value.trim());
        input.value = '';
        input.focus();
      }
    });

    document.getElementById('task-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('add-task-btn').click();
      }
    });

    // Sidebar toggle
    const sidebarToggleOpen = document.querySelector('.sidebar-toggle-open');
    const sidebarToggleClose = document.querySelector('.sidebar-toggle-close');
    const sidebar = document.querySelector('.sidebar');

    sidebarToggleOpen?.addEventListener('click', () => {
      sidebar.classList.add('active');
    });

    sidebarToggleClose?.addEventListener('click', () => {
      sidebar.classList.remove('active');
    });

    // Close sidebar when clicking nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        sidebar.classList.remove('active');
      });
    });
  }

  handleEventFormSubmit() {
    const title = document.getElementById('event-title').value;
    const date = document.getElementById('event-date').value;
    const time = document.getElementById('event-time').value;
    const color = document.getElementById('event-color').value;
    const description = document.getElementById('event-description').value;

    if (!title || !date) return;

    const event = {
      id: Date.now(),
      title,
      date,
      time,
      color,
      description,
      createdAt: new Date().toISOString()
    };

    this.addEvent(event);
    this.closeEventModal();
  }

  // ============ SAMPLE DATA ============
  loadSampleData() {
    if (this.events.length === 0) {
      const today = this.formatDate(new Date());
      const tomorrow = this.formatDate(new Date(Date.now() + 86400000));
      const nextWeek = this.formatDate(new Date(Date.now() + 7 * 86400000));

      const sampleEvents = [
        {
          id: 1,
          title: 'DSA Lecture',
          date: today,
          time: '10:00',
          color: 'blue',
          description: 'Data Structures & Algorithms lecture'
        },
        {
          id: 2,
          title: 'Lunch Break',
          date: today,
          time: '12:30',
          color: 'green',
          description: 'Time to relax and eat'
        },
        {
          id: 3,
          title: 'Math Tutorial',
          date: today,
          time: '14:00',
          color: 'green',
          description: 'Calculus tutorial session'
        },
        {
          id: 4,
          title: 'Study Session',
          date: today,
          time: '16:00',
          color: 'purple',
          description: 'Evening study session'
        },
        {
          id: 5,
          title: 'Web Development Class',
          date: tomorrow,
          time: '09:00',
          color: 'orange',
          description: 'Frontend development class'
        },
        {
          id: 6,
          title: 'Assignment Due',
          date: nextWeek,
          time: '23:59',
          color: 'red',
          description: 'CSS project submission'
        }
      ];

      sampleEvents.forEach(event => this.addEvent(event));
    }

    if (this.tasks.length === 0) {
      const sampleTasks = [
        'Complete CSS Grid assignment',
        'Review JavaScript fundamentals',
        'Read chapter 5 of textbook'
      ];

      sampleTasks.forEach(title => this.addTask(title));
    }
  }

  // ============ UTILITY ============
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// ============ INITIALIZE ============
document.addEventListener('DOMContentLoaded', () => {
  new Calendar();

  // Year in footer
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
});
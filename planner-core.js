// Planner core: shared task & event storage + pub/sub
class PlannerCore {
  constructor() {
    this.tasksKey = 'planner_tasks';
    this.eventsKey = 'planner_events';
    this.tasks = this._load(this.tasksKey) || [];
    this.events = this._load(this.eventsKey) || [];
    this.listeners = [];
  }

  _load(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('PlannerCore: could not read', key, e);
      return null;
    }
  }

  _save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('PlannerCore: could not save', key, e);
    }
  }

  getTasks() {
    return this.tasks.slice();
  }

  getEvents() {
    return this.events.slice();
  }

  addTask(title) {
    const task = {
      id: Date.now(),
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    this.tasks.push(task);
    this._save(this.tasksKey, this.tasks);
    this._emit();
    return task;
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this._save(this.tasksKey, this.tasks);
    this._emit();
  }

  toggleTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this._save(this.tasksKey, this.tasks);
      this._emit();
    }
  }

  addEvent(event) {
    // Ensure id and createdAt
    if (!event.id) event.id = Date.now();
    if (!event.createdAt) event.createdAt = new Date().toISOString();
    this.events.push(event);
    this._save(this.eventsKey, this.events);
    this._emit();
    return event;
  }

  deleteEvent(id) {
    this.events = this.events.filter(e => e.id !== id);
    this._save(this.eventsKey, this.events);
    this._emit();
  }

  onChange(fn) {
    if (typeof fn === 'function') this.listeners.push(fn);
  }

  _emit() {
    this.listeners.forEach(fn => {
      try { fn(this.getTasks(), this.getEvents()); } catch (e) { console.warn(e); }
    });
  }
}

// make a single shared instance
if (!window.PLANNER_CORE) window.PLANNER_CORE = new PlannerCore();

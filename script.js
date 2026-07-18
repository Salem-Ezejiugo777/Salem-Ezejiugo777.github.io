/* ==========================================================================
   MIVA Portfolio — script.js
   Shared behavior: nav toggle, skill bar reveal, Academic Planner,
   and Contact form validation.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initSkillBars();
  initPlanner();
  initContactForm();
  initFooterYear();
});

/* ---------------------------------------------------------------------- */
/* Mobile navigation toggle                                               */
/* ---------------------------------------------------------------------- */
function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".nav-menu");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Close the menu when a link is tapped (mobile)
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* ---------------------------------------------------------------------- */
/* Skill bar fill animation (About page)                                  */
/* ---------------------------------------------------------------------- */
function initSkillBars() {
  const fills = document.querySelectorAll(".skill-fill");
  if (!fills.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.style.width = el.dataset.level + "%";
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.4 }
  );

  fills.forEach((el) => observer.observe(el));
}

/* ---------------------------------------------------------------------- */
/* Academic Planner (add / complete / delete / filter / persist)          */
/* ---------------------------------------------------------------------- */
function initPlanner() {
  const form = document.getElementById("planner-form");
  if (!form) return; // Not on this page

  const list = document.getElementById("task-list");
  const emptyState = document.getElementById("empty-state");
  const titleInput = document.getElementById("task-title");
  const dueInput = document.getElementById("task-due");
  const priorityInput = document.getElementById("task-priority");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const statTotal = document.getElementById("stat-total");
  const statDone = document.getElementById("stat-done");
  const statPending = document.getElementById("stat-pending");

  const STORAGE_KEY = "miva-planner-tasks";
  let currentFilter = "all";

  let tasks = loadTasks();

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : seedTasks();
    } catch (err) {
      console.warn("Could not read saved tasks, starting fresh.", err);
      return seedTasks();
    }
  }

  function seedTasks() {
    return [
      {
        id: crypto.randomUUID(),
        title: "Submit Web Technologies term project",
        due: "2026-08-10",
        priority: "high",
        done: false,
      },
      {
        id: crypto.randomUUID(),
        title: "Review JavaScript DOM manipulation notes",
        due: "2026-07-22",
        priority: "medium",
        done: false,
      },
      {
        id: crypto.randomUUID(),
        title: "Set up GitHub repository for coursework",
        due: "2026-07-19",
        priority: "low",
        done: true,
      },
    ];
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      console.warn("Could not save tasks locally.", err);
    }
  }

  function formatDue(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d)) return null;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function isOverdue(dateStr, done) {
    if (!dateStr || done) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dateStr + "T00:00:00");
    return d < today;
  }

  function render() {
    list.innerHTML = "";

    const visible = tasks.filter((t) => {
      if (currentFilter === "active") return !t.done;
      if (currentFilter === "completed") return t.done;
      return true;
    });

    if (visible.length === 0) {
      emptyState.style.display = "block";
      emptyState.textContent =
        tasks.length === 0
          ? "No tasks yet — add your first academic task above."
          : "Nothing here for this filter.";
    } else {
      emptyState.style.display = "none";
      visible.forEach((task) => list.appendChild(renderTask(task)));
    }

    statTotal.textContent = tasks.length;
    statDone.textContent = tasks.filter((t) => t.done).length;
    statPending.textContent = tasks.filter((t) => !t.done).length;

    saveTasks();
  }

  function renderTask(task) {
    const li = document.createElement("li");
    li.className = `task-item priority-${task.priority}${task.done ? " done" : ""}`;
    li.dataset.id = task.id;

    const dueLabel = formatDue(task.due);
    const overdue = isOverdue(task.due, task.done);

    li.innerHTML = `
      <button type="button" class="task-check" aria-label="${task.done ? "Mark as not done" : "Mark as done"}">
        ${task.done ? "✓" : ""}
      </button>
      <div class="task-body">
        <div class="task-title"></div>
        <div class="task-meta">
          ${dueLabel ? `<span class="task-due${overdue ? " overdue" : ""}">${overdue ? "Overdue · " : "Due "}${dueLabel}</span>` : "<span>No due date</span>"}
        </div>
      </div>
      <span class="task-priority-tag">${task.priority}</span>
      <button type="button" class="task-delete" aria-label="Delete task">✕</button>
    `;

    // Set title via textContent to avoid HTML injection from user input
    li.querySelector(".task-title").textContent = task.title;

    li.querySelector(".task-check").addEventListener("click", () => toggleTask(task.id));
    li.querySelector(".task-delete").addEventListener("click", () => deleteTask(task.id));

    return li;
  }

  function addTask(title, due, priority) {
    tasks.unshift({
      id: crypto.randomUUID(),
      title,
      due,
      priority,
      done: false,
    });
    render();
  }

  function toggleTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (task) task.done = !task.done;
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    render();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const errorEl = document.getElementById("task-title-error");

    if (!title) {
      errorEl.textContent = "Enter a task title before adding it.";
      titleInput.focus();
      return;
    }
    errorEl.textContent = "";

    addTask(title, dueInput.value, priorityInput.value || "medium");
    form.reset();
    titleInput.focus();
  });

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      render();
    });
  });

  render();
}

/* ---------------------------------------------------------------------- */
/* Contact form validation                                                */
/* ---------------------------------------------------------------------- */
function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const fields = {
    name: {
      input: document.getElementById("name"),
      error: document.getElementById("name-error"),
      validate: (v) => (v.trim().length === 0 ? "Enter your full name." : ""),
    },
    email: {
      input: document.getElementById("email"),
      error: document.getElementById("email-error"),
      validate: (v) => {
        if (v.trim().length === 0) return "Enter your email address.";
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(v.trim()) ? "" : "Enter a valid email address, like name@example.com.";
      },
    },
    phone: {
      input: document.getElementById("phone"),
      error: document.getElementById("phone-error"),
      validate: (v) => {
        if (v.trim().length === 0) return "Enter your phone number.";
        const digitsOnly = /^[0-9]+$/;
        return digitsOnly.test(v.trim()) ? "" : "Use digits only, no spaces or symbols (e.g. 08012345678).";
      },
    },
    message: {
      input: document.getElementById("message"),
      error: document.getElementById("message-error"),
      validate: (v) => (v.trim().length === 0 ? "Enter a message." : ""),
    },
  };

  const statusEl = document.getElementById("form-status");

  function validateField(key) {
    const field = fields[key];
    const message = field.validate(field.input.value);
    field.error.textContent = message;
    field.input.closest(".form-field").classList.toggle("invalid", Boolean(message));
    return message === "";
  }

  Object.keys(fields).forEach((key) => {
    fields[key].input.addEventListener("blur", () => validateField(key));
    fields[key].input.addEventListener("input", () => {
      if (fields[key].input.closest(".form-field").classList.contains("invalid")) {
        validateField(key);
      }
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const results = Object.keys(fields).map(validateField);
    const allValid = results.every(Boolean);

    statusEl.classList.remove("success", "error", "show");

    if (!allValid) {
      statusEl.textContent = "Please fix the highlighted fields before sending.";
      statusEl.classList.add("show", "error");
      const firstInvalid = form.querySelector(".form-field.invalid input, .form-field.invalid textarea");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // No backend is connected in this student project — simulate a send.
    statusEl.textContent = "Message sent — thank you! I'll get back to you soon.";
    statusEl.classList.add("show", "success");
    form.reset();
    Object.values(fields).forEach((f) => f.input.closest(".form-field").classList.remove("invalid"));
  });
}

/* ---------------------------------------------------------------------- */
/* Footer year                                                            */
/* ---------------------------------------------------------------------- */
function initFooterYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

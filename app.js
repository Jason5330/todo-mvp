const STORAGE_KEY = "minimal-todo-items";
const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const MONTH_NAMES = [
  "一月", "二月", "三月", "四月", "五月", "六月",
  "七月", "八月", "九月", "十月", "十一月", "十二月",
];

const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const list = document.querySelector("#todo-list");
const count = document.querySelector("#todo-count");
const emptyState = document.querySelector("#empty-state");
const template = document.querySelector("#todo-template");
const calDayTemplate = document.querySelector("#cal-day-template");
const calGrid = document.querySelector("#calendar-grid");
const calTitle = document.querySelector("#cal-title");
const calPrev = document.querySelector("#cal-prev");
const calNext = document.querySelector("#cal-next");
const calToday = document.querySelector("#cal-today");
const selectedDateLabel = document.querySelector("#selected-date-label");

let todos = loadTodos();
let selectedDate = toKey(new Date()); // YYYY-MM-DD
let viewDate = startOfMonth(new Date()); // currently displayed month

function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function parseKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function loadTodos() {
  try {
    const savedTodos = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(savedTodos)) return [];
    // 為舊資料補上日期（預設今天）
    const todayKey = toKey(new Date());
    return savedTodos.map((todo) => ({
      ...todo,
      date: typeof todo.date === "string" ? todo.date : todayKey,
    }));
  } catch {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

/* ---------- 待辦清單渲染 ---------- */

function visibleTodos() {
  return todos.filter((todo) => todo.date === selectedDate);
}

function renderTodos() {
  list.replaceChildren();

  visibleTodos().forEach((todo) => {
    const fragment = template.content.cloneNode(true);
    const item = fragment.querySelector(".todo-item");
    const toggle = fragment.querySelector(".todo-toggle");
    const text = fragment.querySelector(".todo-text");
    const deleteButton = fragment.querySelector(".delete-button");

    item.dataset.id = todo.id;
    item.classList.toggle("is-complete", todo.completed);
    toggle.checked = todo.completed;
    text.textContent = todo.text;

    toggle.addEventListener("change", () => toggleTodo(todo.id));
    deleteButton.addEventListener("click", () => deleteTodo(todo.id));
    list.append(fragment);
  });

  const remaining = visibleTodos().filter((todo) => !todo.completed).length;
  count.textContent = `${remaining} 件未完成`;
  emptyState.hidden = visibleTodos().length > 0;
}

function addTodo(text) {
  todos.unshift({
    id: createId(),
    text,
    completed: false,
    date: selectedDate,
  });
  saveTodos();
  renderTodos();
  renderCalendar();
}

function toggleTodo(id) {
  todos = todos.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo,
  );
  saveTodos();
  renderTodos();
  renderCalendar();
}

function deleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id);
  saveTodos();
  renderTodos();
  renderCalendar();
}

/* ---------- 日曆渲染 ---------- */

function todosByDate() {
  const map = new Map();
  for (const todo of todos) {
    if (!map.has(todo.date)) map.set(todo.date, []);
    map.get(todo.date).push(todo);
  }
  return map;
}

function renderCalendar() {
  const byDate = todosByDate();
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  calTitle.textContent = `${year} 年 ${MONTH_NAMES[month]}`;

  calGrid.replaceChildren();

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = toKey(new Date());

  // 前置空白（讓 1 號對齊正確欄位）
  for (let i = 0; i < firstWeekday; i++) {
    const blank = document.createElement("span");
    blank.className = "cal-day cal-day--blank";
    blank.setAttribute("aria-hidden", "true");
    calGrid.append(blank);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const key = toKey(new Date(year, month, day));
    const dayTodos = byDate.get(key) ?? [];
    const remaining = dayTodos.filter((t) => !t.completed).length;
    const total = dayTodos.length;

    const fragment = calDayTemplate.content.cloneNode(true);
    const btn = fragment.querySelector(".cal-day");
    const num = fragment.querySelector(".cal-day-num");
    const dots = fragment.querySelector(".cal-day-dots");

    btn.dataset.date = key;
    btn.setAttribute("aria-label", `${month + 1} 月 ${day} 日，${total} 件待辦`);
    if (key === selectedDate) btn.classList.add("is-selected");
    if (key === todayKey) btn.classList.add("is-today");
    num.textContent = day;

    // 以小圓點表示未完成數量（最多 3 個）
    const dotCount = Math.min(remaining, 3);
    for (let i = 0; i < dotCount; i++) {
      const dot = document.createElement("span");
      dot.className = "cal-dot";
      dots.append(dot);
    }
    if (total > 0 && remaining === 0) {
      // 全部完成：顯示打勾記號
      btn.classList.add("is-done");
    }

    btn.addEventListener("click", () => {
      selectedDate = key;
      renderCalendar();
      renderTodos();
      updateSelectedLabel();
    });

    calGrid.append(fragment);
  }

  updateSelectedLabel();
}

function updateSelectedLabel() {
  const d = parseKey(selectedDate);
  const weekday = WEEKDAYS[d.getDay()];
  const todayKey = toKey(new Date());
  let prefix = `${d.getMonth() + 1} 月 ${d.getDate()} 日（${weekday}）`;
  if (selectedDate === todayKey) prefix = `今天 · ${prefix}`;
  selectedDateLabel.textContent = prefix;
}

/* ---------- 事件 ---------- */

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();

  if (!text) {
    input.focus();
    return;
  }

  addTodo(text);
  form.reset();
  input.focus();
});

calPrev.addEventListener("click", () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
  renderCalendar();
});

calNext.addEventListener("click", () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
  renderCalendar();
});

calToday.addEventListener("click", () => {
  const today = new Date();
  selectedDate = toKey(today);
  viewDate = startOfMonth(today);
  renderCalendar();
  renderTodos();
});

// 鍵盤左右切換月份
document.addEventListener("keydown", (event) => {
  if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") return;
  if (event.key === "ArrowLeft" && event.altKey) {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    renderCalendar();
  } else if (event.key === "ArrowRight" && event.altKey) {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    renderCalendar();
  }
});

renderCalendar();
renderTodos();

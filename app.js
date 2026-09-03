const STORAGE_KEY = "minimal-todo-items";

const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const list = document.querySelector("#todo-list");
const count = document.querySelector("#todo-count");
const emptyState = document.querySelector("#empty-state");
const template = document.querySelector("#todo-template");

let todos = loadTodos();

function loadTodos() {
  try {
    const savedTodos = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(savedTodos) ? savedTodos : [];
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

function renderTodos() {
  list.replaceChildren();

  todos.forEach((todo) => {
    const fragment = template.content.cloneNode(true);
    const item = fragment.querySelector(".todo-item");
    const toggle = fragment.querySelector(".todo-toggle");
    const text = fragment.querySelector(".todo-text");
    const deleteButton = fragment.querySelector(".delete-button");

    item.dataset.id = todo.id;
    item.classList.toggle("is-complete", todo.completed);
    toggle.checked = todo.completed;
    toggle.setAttribute(
      "aria-label",
      `${todo.completed ? "標記為未完成" : "標記為已完成"}：${todo.text}`,
    );
    text.textContent = todo.text;
    text.title = "雙擊編輯";

    toggle.addEventListener("change", () => toggleTodo(todo.id));
    text.addEventListener("dblclick", () => startEditing(todo, text));
    deleteButton.addEventListener("click", () => deleteTodo(todo.id));
    list.append(fragment);
  });

  const remaining = todos.filter((todo) => !todo.completed).length;
  count.textContent = `${remaining} 件未完成`;
  emptyState.hidden = todos.length > 0;
}

function addTodo(text) {
  todos.unshift({ id: createId(), text, completed: false });
  saveTodos();
  renderTodos();
}

function toggleTodo(id) {
  todos = todos.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo,
  );
  saveTodos();
  renderTodos();
}

function startEditing(todo, textElement) {
  const editor = document.createElement("input");
  editor.className = "edit-input";
  editor.type = "text";
  editor.maxLength = 120;
  editor.value = todo.text;
  editor.setAttribute("aria-label", "編輯待辦事項");

  let isFinished = false;

  function finishEditing(shouldSave) {
    if (isFinished) return;
    isFinished = true;

    const nextText = editor.value.trim();

    if (shouldSave && nextText) {
      todos = todos.map((item) =>
        item.id === todo.id ? { ...item, text: nextText } : item,
      );
      saveTodos();
    }

    renderTodos();
  }

  editor.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      finishEditing(true);
    }

    if (event.key === "Escape") {
      event.preventDefault();
      finishEditing(false);
    }
  });

  editor.addEventListener("blur", () => finishEditing(true));
  textElement.replaceWith(editor);
  editor.focus();
  editor.select();
}

function deleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id);
  saveTodos();
  renderTodos();
}

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

renderTodos();

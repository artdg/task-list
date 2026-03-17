import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import TodoItem from "./TodoItem";

const STORAGE_KEY = "task-list:v1";
const THEME_KEY = "task-list:theme";

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizePriority(p) {
  if (p === "low" || p === "medium" || p === "high") return p;
  return "medium";
}

function loadInitialTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = safeJsonParse(raw ?? "[]", []);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((t) => t && typeof t === "object")
    .map((t) => ({
      id: typeof t.id === "string" ? t.id : uid(),
      text: typeof t.text === "string" ? t.text : "",
      completed: Boolean(t.completed),
      createdAt: typeof t.createdAt === "number" ? t.createdAt : Date.now(),
      priority: normalizePriority(t.priority),
      due: typeof t.due === "string" ? t.due : "",
    }))
    .filter((t) => t.text.trim().length > 0);
}

function getSystemTheme() {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
}

export default function App() {
  const [tasks, setTasks] = useState(loadInitialTasks);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [due, setDue] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | active | completed
  const [uiError, setUiError] = useState("");

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return getSystemTheme();
  });

  const inputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.reduce((acc, t) => acc + (t.completed ? 1 : 0), 0);
    const active = total - completed;
    return { total, active, completed };
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks
      .filter((t) => {
        if (filter === "active") return !t.completed;
        if (filter === "completed") return t.completed;
        return true;
      })
      .filter((t) => (q ? t.text.toLowerCase().includes(q) : true))
      .slice()
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const prio = { high: 0, medium: 1, low: 2 };
        const p = (prio[a.priority] ?? 1) - (prio[b.priority] ?? 1);
        if (p !== 0) return p;
        if (a.due && b.due) return a.due.localeCompare(b.due);
        if (a.due && !b.due) return -1;
        if (!a.due && b.due) return 1;
        return b.createdAt - a.createdAt;
      });
  }, [tasks, query, filter]);

  const addTask = () => {
    const t = text.trim();
    if (!t) {
      setUiError("Введите текст задачи.");
      return;
    }
    setTasks((prev) => [
      {
        id: uid(),
        text: t,
        completed: false,
        createdAt: Date.now(),
        priority: normalizePriority(priority),
        due: due || "",
      },
      ...prev,
    ]);
    setText("");
    setDue("");
    setPriority("medium");
    setUiError("");
    inputRef.current?.focus();
  };

  const toggleTask = (id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTask = (id, patch) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              ...patch,
              text: typeof patch.text === "string" ? patch.text : t.text,
              priority: patch.priority ? normalizePriority(patch.priority) : t.priority,
              due: typeof patch.due === "string" ? patch.due : t.due,
            }
          : t
      )
    );
  };

  const clearCompleted = () => {
    setTasks((prev) => prev.filter((t) => !t.completed));
  };

  const clearAll = () => {
    setTasks([]);
  };

  const markAll = (completed) => {
    setTasks((prev) => prev.map((t) => (t.completed === completed ? t : { ...t, completed })));
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand__title">Daily Tasks</div>
          <div className="brand__subtitle">Ежедневные дела — быстро и аккуратно</div>
        </div>

        <div className="topbar__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            aria-label="Переключить тему"
            title="Тема"
          >
            {theme === "dark" ? "Светлая" : "Тёмная"}
          </button>
        </div>
      </header>

      <main className="panel">
        <section className="composer" aria-label="Добавить задачу">
          <div className="composer__row">
            <label className="field">
              <span className="field__label">Задача</span>
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (uiError) setUiError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                placeholder="Например: созвон в 15:00, купить продукты…"
                className={uiError ? "is-error" : ""}
              />
              {uiError ? <div className="field__error">{uiError}</div> : null}
            </label>

            <label className="field field--sm">
              <span className="field__label">Приоритет</span>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Приоритет">
                <option value="high">Высокий</option>
                <option value="medium">Средний</option>
                <option value="low">Низкий</option>
              </select>
            </label>

            <label className="field field--sm">
              <span className="field__label">Дедлайн</span>
              <input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Дедлайн" />
            </label>

            <div className="composer__cta">
              <button type="button" className="btn btn--primary" onClick={addTask}>
                Добавить
              </button>
            </div>
          </div>

          <div className="toolbar">
            <div className="toolbar__left">
              <div className="segmented" role="tablist" aria-label="Фильтр">
                <button
                  type="button"
                  className={filter === "all" ? "segmented__btn is-active" : "segmented__btn"}
                  onClick={() => setFilter("all")}
                >
                  Все <span className="segmented__count">{stats.total}</span>
                </button>
                <button
                  type="button"
                  className={filter === "active" ? "segmented__btn is-active" : "segmented__btn"}
                  onClick={() => setFilter("active")}
                >
                  Активные <span className="segmented__count">{stats.active}</span>
                </button>
                <button
                  type="button"
                  className={filter === "completed" ? "segmented__btn is-active" : "segmented__btn"}
                  onClick={() => setFilter("completed")}
                >
                  Готовые <span className="segmented__count">{stats.completed}</span>
                </button>
              </div>

              <label className="search">
                <span className="sr-only">Поиск</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск по задачам…"
                />
              </label>
            </div>

            <div className="toolbar__right">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => markAll(true)}
                disabled={tasks.length === 0 || stats.completed === stats.total}
              >
                Отметить всё
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => markAll(false)}
                disabled={tasks.length === 0 || stats.active === stats.total}
              >
                Снять отметки
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={clearCompleted}
                disabled={stats.completed === 0}
                title="Удалить только выполненные"
              >
                Очистить выполненные
              </button>
              <button type="button" className="btn btn--ghost" onClick={clearAll} disabled={tasks.length === 0}>
                Очистить всё
              </button>
            </div>
          </div>
        </section>

        <section className="list" aria-label="Список задач">
          {visibleTasks.length === 0 ? (
            <div className="empty">
              <div className="empty__title">Пока пусто</div>
              <div className="empty__hint">
                Добавьте задачу сверху или измените фильтр/поиск.
              </div>
            </div>
          ) : (
            <ul className="list__items">
              {visibleTasks.map((task) => (
                <TodoItem
                  key={task.id}
                  task={task}
                  onDelete={() => deleteTask(task.id)}
                  onToggle={() => toggleTask(task.id)}
                  onUpdate={(patch) => updateTask(task.id, patch)}
                />
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="footer">
        <div className="footer__stats">
          Всего: <b>{stats.total}</b> · Активных: <b>{stats.active}</b> · Готовых: <b>{stats.completed}</b>
        </div>
        <div className="footer__hint">Enter — добавить задачу · Двойной клик по задаче — редактировать</div>
      </footer>
    </div>
  );
}
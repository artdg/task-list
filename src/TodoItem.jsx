import { useEffect, useMemo, useRef, useState } from "react";

function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  if (!y || !m || !d) return iso;
  const dt = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short" }).format(dt);
}

export default function TodoItem({ task, onDelete, onToggle, onUpdate }) {
  const [removing, setRemoving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState(task.text);
  const [draftPriority, setDraftPriority] = useState(task.priority ?? "medium");
  const [draftDue, setDraftDue] = useState(task.due ?? "");
  const [error, setError] = useState("");

  const inputRef = useRef(null);

  useEffect(() => {
    if (!editing) {
      setDraftText(task.text);
      setDraftPriority(task.priority ?? "medium");
      setDraftDue(task.due ?? "");
      setError("");
    }
  }, [editing, task.text, task.priority, task.due]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const dueLabel = useMemo(() => formatDate(task.due), [task.due]);

  const handleDelete = () => {
    setRemoving(true);
    setTimeout(onDelete, 220);
  };

  const cancel = () => {
    setEditing(false);
  };

  const save = () => {
    const t = draftText.trim();
    if (!t) {
      setError("Текст не должен быть пустым.");
      return;
    }
    onUpdate({ text: t, priority: draftPriority, due: draftDue });
    setEditing(false);
  };

  return (
    <li
      className={[
        "todo",
        removing ? "is-removing" : "",
        task.completed ? "is-completed" : "",
        `prio-${task.priority ?? "medium"}`,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <label className="todo__check">
        <input type="checkbox" checked={task.completed} onChange={onToggle} aria-label="Готово" />
      </label>

      <div className="todo__body" onDoubleClick={() => setEditing(true)}>
        {editing ? (
          <div className="todo__edit">
            <input
              ref={inputRef}
              value={draftText}
              onChange={(e) => {
                setDraftText(e.target.value);
                if (error) setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") cancel();
              }}
              className={error ? "is-error" : ""}
              aria-label="Редактировать задачу"
            />

            <div className="todo__editRow">
              <select
                value={draftPriority}
                onChange={(e) => setDraftPriority(e.target.value)}
                aria-label="Приоритет"
              >
                <option value="high">Высокий</option>
                <option value="medium">Средний</option>
                <option value="low">Низкий</option>
              </select>
              <input type="date" value={draftDue} onChange={(e) => setDraftDue(e.target.value)} aria-label="Дедлайн" />
              <button type="button" className="btn btn--primary btn--sm" onClick={save}>
                Сохранить
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={cancel}>
                Отмена
              </button>
            </div>
            {error ? <div className="field__error">{error}</div> : null}
          </div>
        ) : (
          <>
            <div className="todo__text">{task.text}</div>
            <div className="todo__meta">
              <span className={`pill pill--${task.priority ?? "medium"}`} title="Приоритет">
                {task.priority === "high" ? "Высокий" : task.priority === "low" ? "Низкий" : "Средний"}
              </span>
              {task.due ? (
                <span className="pill pill--due" title="Дедлайн">
                  {dueLabel}
                </span>
              ) : null}
            </div>
          </>
        )}
      </div>

      <div className="todo__actions">
        {!editing ? (
          <button type="button" className="icon-btn" onClick={() => setEditing(true)} aria-label="Редактировать">
            Править
          </button>
        ) : null}
        <button type="button" className="icon-btn icon-btn--danger" onClick={handleDelete} aria-label="Удалить">
          Удалить
        </button>
      </div>
    </li>
  );
}
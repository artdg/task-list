import { useState } from "react";

export default function TodoItem({ task, onDelete, onToggle }) {
    const [removing, setRemoving] = useState(false);

    const handleDelete = () => {
        setRemoving(true);
        setTimeout(onDelete, 300);
    };

    return (
    <li className={`${removing ? "removing" : ""} ${task.completed ? "completed" : ""}`}>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={onToggle}
      />
      <span>{task.text}</span>
      <button onClick={handleDelete}>Удалить</button>
    </li>
  );
}
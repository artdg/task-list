import { useState, useEffect } from "react";
import TodoItem from "./TodoItem";

export default function App() {
  const [tasks, setTasks] = useState(() => {
    return JSON.parse(localStorage.getItem("tasks") || "[]");
  });
  
  const [input, setInput] = useState("");
  useEffect(() => {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}, [tasks]);

  const [error, setError] = useState(false);

  const addTask = () => {
    if (input.trim()) {
      setTasks([...tasks, { text: input, completed: false }]);
      setInput("");
      setError(false);
    } else {
      setError(true);
    }
  };

  const toggleTask = (index) => {
    const newTasks = [...tasks];
    newTasks[index].completed = !newTasks[index].completed;
    setTasks(newTasks);
  };

  const deleteTask = (index) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const clearTasks = () => {
    document.querySelectorAll("li").forEach((el) => el.classList.add("removing"));
    setTimeout(() => {
    setTasks([]);
  }, 300);
  }

  return (
    <div className="todo-container">
  <h1>Список дел</h1>
  <input
    type="text"
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyDown={(e) => e.key === "Enter" && addTask()}
    className={error ? "error" : ""}
  />
  <div className="button-group">
    <button onClick={addTask}>Добавить</button>
    <button onClick={clearTasks}>Очистить все</button>
  </div>
  <ul>
    {tasks.map((task, index) => (
      <TodoItem key={index} task={task} onDelete={() => deleteTask(index)} onToggle={() => toggleTask(index)} />
    ))}
  </ul>
</div>
  );
}
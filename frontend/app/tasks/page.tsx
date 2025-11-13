"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface Task {
  id: number;
  title: string;
  body: string;
  author_email: string;
}

interface FormData {
  title: string;
  body: string;
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState<FormData>({ title: "", body: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchTasks = async () => {
    if (!token) return;
    try {
      const res = await api.get<Task[]>("/posts", { headers });
      setTasks(res.data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  };

  useEffect(() => {
    if (token) fetchTasks();
  }, [token]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    try {
      if (editingId) {
        await api.put(`/posts/${editingId}`, form, { headers });
      } else {
        await api.post("/posts", form, { headers });
      }
      setForm({ title: "", body: "" });
      setEditingId(null);
      fetchTasks();
    } catch (err) {
      console.error("Error submitting task", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      await api.delete(`/posts/${id}`, { headers });
      fetchTasks();
    } catch (err) {
      console.error("Error deleting task", err);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingId(task.id);
    setForm({ title: task.title, body: task.body });
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    router.push("/");
  };

  if (token === null) return null;

  if (!token) {
    return (
      <div className="p-6">
        Please{" "}
        <a href="/" className="text-blue-500 underline">
          login
        </a>{" "}
        first.
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 mb-4 max-w-md"
      >
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <textarea
          name="body"
          placeholder="Body"
          value={form.body}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <button className="bg-green-600 text-white p-2 rounded hover:bg-green-700">
          {editingId ? "Update Task" : "Add Task"}
        </button>
      </form>

      <ul className="space-y-3">
        {tasks.map((t) => (
          <li
            key={t.id}
            className="border p-3 rounded flex justify-between items-center"
          >
            <div>
              <h2 className="font-semibold">{t.title}</h2>
              <p className="text-sm text-gray-600">{t.body}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(t)} className="text-blue-500">
                Edit
              </button>
              <button
                onClick={() => handleDelete(t.id)}
                className="text-red-500"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

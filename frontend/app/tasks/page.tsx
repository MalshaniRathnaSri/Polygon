"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { HiOutlineTrash, HiOutlinePencil } from "react-icons/hi";
import toast from "react-hot-toast"; 

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
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});
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
      toast.error("Failed to fetch tasks");
    }
  };

  useEffect(() => {
    if (token) fetchTasks();
  }, [token]);

  const validateForm = () => {
    const newErrors: { title?: string; body?: string } = {};
    if (!form.title.trim()) {
      newErrors.title = "Title is required.";
    }
    if (form.body && form.body.length > 500) {
      newErrors.body = "Description cannot exceed 500 characters.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    if (!validateForm()) return;

    try {
      if (editingId) {
        await api.put(`/posts/${editingId}`, form, { headers });
        toast.success("Task updated successfully!");
      } else {
        await api.post("/posts", form, { headers });
        toast.success("Task added successfully!");
      }
      setForm({ title: "", body: "" });
      setEditingId(null);
      setErrors({});
      fetchTasks();
    } catch {
      toast.error("Error submitting task");
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      await api.delete(`/posts/${id}`, { headers });
      toast.success("Task deleted successfully!");
      fetchTasks();
    } catch {
      toast.error("Error deleting task");
    }
  };

  const handleEdit = (task: Task) => {
    setEditingId(task.id);
    setForm({ title: task.title, body: task.body });
    setErrors({});
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    toast("You have been logged out.", { icon: "👋" });
    router.push("/");
  };

  if (token === null) return null;

  if (!token) {
    return (
      <div className="p-6 text-center">
        Please{" "}
        <a href="/" className="text-blue-500 underline">
          login
        </a>{" "}
        first.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex justify-between items-center bg-white shadow-md p-4 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-800">My Tasks</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      <div className="flex-grow flex flex-col items-center justify-start p-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-lg p-6 w-full max-w-md mb-8"
        >
          <h2 className="text-lg font-semibold mb-4 text-center text-gray-500">
            {editingId ? "Edit Task" : "Add New Task"}
          </h2>

          <input
            type="text"
            name="title"
            placeholder="Task Title"
            value={form.title}
            onChange={handleChange}
            className={`border p-2 rounded w-full mb-1 focus:ring focus:ring-blue-900 placeholder-gray-600 text-gray-600 ${
              errors.title ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.title && (
            <p className="text-red-500 text-sm mb-2">{errors.title}</p>
          )}

          <textarea
            name="body"
            placeholder="Task Description (optional)"
            value={form.body}
            onChange={handleChange}
            className={`border p-2 rounded w-full mb-1 h-24 focus:ring focus:ring-blue-900 placeholder-gray-600 text-gray-600 ${
              errors.body ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.body && (
            <p className="text-red-500 text-sm mb-2">{errors.body}</p>
          )}

          <button className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 transition">
            {editingId ? "Update Task" : "Add Task"}
          </button>
        </form>

        <div className="w-full max-w-md bg-white shadow-md rounded-lg p-4 overflow-y-auto max-h-[400px] border border-gray-200">
          {tasks.length === 0 ? (
            <p className="text-gray-500 text-center">No tasks yet.</p>
          ) : (
            <ul className="space-y-3">
              {tasks.map((t) => (
                <li
                  key={t.id}
                  className="bg-gray-50 border p-4 rounded-lg flex justify-between items-start"
                >
                  <div>
                    <h2 className="font-semibold text-gray-800">{t.title}</h2>
                    {t.body && <p className="text-sm text-gray-600">{t.body}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(t)}
                      className="text-blue-500 hover:underline"
                    >
                      <HiOutlinePencil size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-red-500 hover:underline"
                    >
                      <HiOutlineTrash size={20} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

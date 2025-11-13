"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast"; 

interface FormData {
  name: string;
  email: string;
  password: string;
}

export default function HomePage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState<FormData>({ name: "", email: "", password: "" });
  const [token, setToken] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  const validateField = (field: string, value: string) => {
    switch (field) {
      case "name":
        if (!isLogin && !value.trim()) return "Name is required";
        return "";
      case "email":
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!value.trim()) return "Email is required";
        if (!emailRegex.test(value.trim())) return "Invalid email address";
        return "";
      case "password":
        const errors = [];
        if (value.length < 8) errors.push("Must be at least 8 characters");
        if (!/[A-Z]/.test(value)) errors.push("Include uppercase letter");
        if (!/[a-z]/.test(value)) errors.push("Include lowercase letter");
        if (!/[0-9]/.test(value)) errors.push("Include number");
        if (!/[!@#$%^&*(),.?\":{}|<>]/.test(value)) errors.push("Include special character");
        return errors.length ? errors.join(", ") : "";
      default:
        return "";
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const validateForm = () => {
    const newErrors = {
      name: validateField("name", form.name),
      email: validateField("email", form.email),
      password: validateField("password", form.password),
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((e) => !e);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (isLogin) {
        const res = await api.post("/auth/login", { email: form.email, password: form.password });
        localStorage.setItem("token", res.data.token);
        setToken(res.data.token);
        toast.success("Login successful!");
        router.push("/tasks");
      } else {
        const res = await api.post("/auth/register", form);
        localStorage.setItem("token", res.data.token);
        setToken(res.data.token);
        toast.success("Registration successful!");
        router.push("/tasks");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Something went wrong");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    toast("You have been logged out.", { icon: "👋" });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {token && (
        <div className="flex justify-between items-center bg-white shadow-md p-4">
          <h1 className="text-2xl font-bold text-gray-800">My Tasks</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      )}

      <div className="flex-grow flex flex-col items-center justify-center p-10">
        {!token ? (
          <form
            onSubmit={handleSubmit}
            className="bg-white shadow-md rounded-lg p-6 w-full max-w-md"
          >
            <h1 className="text-2xl font-semibold text-center mb-4 text-gray-800">
              {isLogin ? "Login" : "Register"}
            </h1>

            {!isLogin && (
              <div className="mb-3">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={handleChange}
                  className="border p-2 rounded w-full mb-1 focus:ring focus:ring-blue-900 placeholder-gray-600 text-gray-600"
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>
            )}

            <div className="mb-3">
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                className="border p-2 rounded w-full mb-1 focus:ring focus:ring-blue-900 placeholder-gray-600 text-gray-600"
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>

            <div className="mb-3">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="border p-2 rounded w-full mb-1 focus:ring focus:ring-blue-900 placeholder-gray-600 text-gray-600"
              />
              {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
            </div>

            <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition">
              {isLogin ? "Login" : "Register"}
            </button>

            <p
              className="mt-3 text-sm text-blue-500 text-center cursor-pointer hover:underline"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Create an account" : "Already have an account? Login"}
            </p>
          </form>
        ) : (
          <div className="mt-4 flex flex-col items-center space-y-6">
            <div className="text-5xl text-amber-800 animate-bounce">
              Welcome to the Task Management.
            </div>
            <div className="flex items-end text-amber-600 text-4xl">
              <a
                href="/tasks"
                className="transform transition-transform duration-500 hover:scale-110 hover:text-amber-400"
              >
                Start Here
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

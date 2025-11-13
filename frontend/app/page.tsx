"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface FormData {
  name: string;
  email: string;
  password: string;
}

export default function HomePage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    password: "",
  });
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await api.post("/auth/login", {
          email: form.email,
          password: form.password,
        });
        localStorage.setItem("token", res.data.token);
        setToken(res.data.token);
        setMessage("Login successful!");
        router.push("/tasks");
      } else {
        const res = await api.post("/auth/register", form);
        localStorage.setItem("token", res.data.token);
        setToken(res.data.token);
        setMessage("Registration successful!");
        router.push("/tasks");
      }
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const errorResponse = (err as any).response;
        setMessage(errorResponse?.data?.message || "Something went wrong");
      } else {
        setMessage("An unknown error occurred");
      }
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setMessage("You have been logged out.");
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {token && (
        <div className="flex justify-end items-center bg-gray-100 p-4 shadow-sm">
          <a
            href="/tasks"
            className="text-blue-600 hover:text-blue-800 mr-4 font-medium"
          >
            Tasks
          </a>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      )}

      <div className="flex-grow flex flex-col items-center justify-center p-10">
        {!token ? (
          <>
            <h1 className="text-2xl mb-4">{isLogin ? "Login" : "Register"}</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-80">
              {!isLogin && (
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={form.name}
                  onChange={handleChange}
                  className="border p-2 rounded"
                />
              )}
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                className="border p-2 rounded"
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="border p-2 rounded"
              />
              <button className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                {isLogin ? "Login" : "Register"}
              </button>
            </form>
            <p
              className="mt-3 text-sm cursor-pointer text-blue-500"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Create an account" : "Already have an account? Login"}
            </p>
            {message && <p className="mt-3 text-red-500">{message}</p>}
          </>
        ) : (
          <p className="text-green-600 mt-4">{message}</p>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setMessage("");

    if (!username.trim() || !password.trim()) {
      setMessage("Login va parolni kiriting");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login yoki parol noto‘g‘ri");
        return;
      }

      window.location.href = "/dashboard";
    } catch (error) {
      console.error(error);
      setMessage("Server bilan bog‘lanishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white text-3xl font-bold">
              D
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mt-5">
            DO'KON
          </h1>

          <p className="text-gray-500 mt-2">
            Do‘kon boshqaruv tizimi
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Tizimga kirish
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              Login va parolingizni kiriting
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >
            {/* Login */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Login
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                placeholder="Loginni kiriting"
                autoComplete="username"
                className="w-full border border-gray-300 rounded-xl px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Parol
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Parolni kiriting"
                  autoComplete="current-password"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3.5 pr-20 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                />

                <button
  type="button"
  onClick={() =>
    setShowPassword(!showPassword)
  }
  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
  aria-label={showPassword ? "Parolni yashirish" : "Parolni ko‘rsatish"}
>
  {showPassword ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-3.1 4.3" />
      <path d="M6.1 6.1C3.7 7.7 2 11 2 11s3 7 10 7a10.8 10.8 0 0 0 2.1-.2" />
    </svg>
  )}
</button>
              </div>
            </div>

            {/* Error */}
            {message && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                {message}
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {loading ? "KIRILMOQDA..." : "KIRISH"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Do‘kon boshqaruv tizimi
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
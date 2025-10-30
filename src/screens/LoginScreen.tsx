import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(username, password);
    if (!success) setError("❌ اسم المستخدم أو كلمة المرور غير صحيحة");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">Purple IPTV</h1>

      <form onSubmit={handleLogin} className="w-80 p-6 bg-gray-800 rounded-lg shadow-lg">
        <input
          type="text"
          placeholder="اسم المستخدم"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mb-4 p-2 rounded bg-gray-700"
        />
        <input
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 p-2 rounded bg-gray-700"
        />

        {error && <p className="text-red-400 mb-2">{error}</p>}

        <button type="submit" className="w-full bg-purple-600 py-2 rounded hover:bg-purple-700">
          تسجيل الدخول
        </button>
      </form>
    </div>
  );
};

export default LoginScreen;

"use client";

import { useEffect, useState } from "react";

type Seller = {
  id: number;
  name: string;
  username: string;
  role: string;
  createdAt: string;
};

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadSellers = async () => {
    try {
      const response = await fetch("/api/sellers");
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setSellers(data);
    } catch (error) {
      console.error(error);
      setMessage("Sotuvchilarni olishda xatolik");
    }
  };

  useEffect(() => {
    loadSellers();
  }, []);

  const startEdit = (seller: Seller) => {
    setEditingId(seller.id);
    setName(seller.name);
    setUsername(seller.username);
    setPassword("");
    setMessage("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
    setUsername("");
    setPassword("");
    setMessage("");
  };

  const saveSeller = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingId) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/sellers", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingId,
          name,
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setMessage("Sotuvchi ma’lumotlari yangilandi");

      cancelEdit();
      await loadSellers();
    } catch (error) {
      console.error(error);
      setMessage("Server bilan bog‘lanishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Sotuvchilar
            </h1>

            <p className="text-gray-500 mt-1">
              Sotuvchilarni boshqarish
            </p>
          </div>

          <button
            onClick={() => {
              window.location.href = "/dashboard";
            }}
            className="bg-gray-800 text-white px-5 py-2 rounded-lg hover:bg-gray-900"
          >
            Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sotuvchilar ro'yxati */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">
                Sotuvchilar ro‘yxati
              </h2>

              <span className="text-sm text-gray-500">
                {sellers.length} ta sotuvchi
              </span>
            </div>

            {sellers.length === 0 ? (
              <div className="py-10 text-center text-gray-500">
                Sotuvchilar mavjud emas
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-3 px-2">ID</th>
                      <th className="py-3 px-2">Ism</th>
                      <th className="py-3 px-2">Login</th>
                      <th className="py-3 px-2">Rol</th>
                      <th className="py-3 px-2">Amal</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sellers.map((seller) => (
                      <tr
                        key={seller.id}
                        className="border-b"
                      >
                        <td className="py-4 px-2">
                          {seller.id}
                        </td>

                        <td className="py-4 px-2 font-medium">
                          {seller.name}
                        </td>

                        <td className="py-4 px-2">
                          {seller.username}
                        </td>

                        <td className="py-4 px-2">
                          <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                            SELLER
                          </span>
                        </td>

                        <td className="py-4 px-2">
                          <button
                            onClick={() =>
                              startEdit(seller)
                            }
                            className="bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-600"
                          >
                            Tahrirlash
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Tahrirlash formasi */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-5">
              {editingId
                ? "Sotuvchini tahrirlash"
                : "Sotuvchini tanlang"}
            </h2>

            {!editingId ? (
              <div className="text-gray-500">
                Ro‘yxatdan sotuvchini tanlang.
              </div>
            ) : (
              <form
                onSubmit={saveSeller}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ism
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Login
                  </label>

                  <input
                    type="text"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value)
                    }
                    className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Yangi parol
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="O‘zgartirmasangiz bo‘sh qoldiring"
                    className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading
                    ? "Saqlanmoqda..."
                    : "SAQLASH"}
                </button>

                <button
                  type="button"
                  onClick={cancelEdit}
                  className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300"
                >
                  BEKOR QILISH
                </button>

                {message && (
                  <p className="text-center text-sm text-gray-700">
                    {message}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
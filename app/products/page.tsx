"use client";

import { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  price: string;
  quantity: number;
  image: string | null;
};

type User = {
  id: number;
  name: string;
  username: string;
  role: "ADMIN" | "SELLER";
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const isAdmin = user?.role === "ADMIN";

  const loadUser = async () => {
    try {
      const response = await fetch("/api/me");
      const data = await response.json();

      if (response.ok) {
        setUser(data);
      } else {
        window.location.href = "/";
      }
    } catch (error) {
      console.error(error);
      window.location.href = "/";
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();

      if (response.ok) {
        setProducts(data);
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      console.error(error);
      setMessage("Mahsulotlarni olishda xatolik");
    }
  };

  useEffect(() => {
    const load = async () => {
      await loadUser();
      await loadProducts();
      setPageLoading(false);
    };

    load();
  }, []);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile) {
      return null;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    return data.image;
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setQuantity("");
    setSelectedFile(null);
    setPreview("");
    setEditingId(null);
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      setMessage("Bu amal faqat Admin uchun");
      return;
    }

    setMessage("");
    setLoading(true);

    try {
      let image = editingId !== null
        ? products.find((p) => p.id === editingId)?.image ?? null
        : null;

      if (selectedFile) {
        image = await uploadImage();
      }

      const method = editingId !== null ? "PATCH" : "POST";

      const body =
        editingId !== null
          ? {
              id: editingId,
              name,
              price,
              quantity,
              image,
            }
          : {
              name,
              price,
              quantity,
              image,
            };

      const response = await fetch("/api/products", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setMessage(
        editingId !== null
          ? "Mahsulot yangilandi"
          : "Mahsulot qo‘shildi"
      );

      resetForm();
      await loadProducts();
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Server bilan bog‘lanishda xatolik"
      );
    } finally {
      setLoading(false);
    }
  };

  const editProduct = (product: Product) => {
    if (!isAdmin) {
      return;
    }

    setEditingId(product.id);
    setName(product.name);
    setPrice(product.price);
    setQuantity(String(product.quantity));
    setSelectedFile(null);
    setPreview(product.image || "");
    setMessage("");
  };

  const deleteProduct = async (id: number) => {
    if (!isAdmin) {
      setMessage("Bu amal faqat Admin uchun");
      return;
    }

    const confirmed = window.confirm(
      "Bu mahsulotni o‘chirmoqchimisiz?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch("/api/products", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setMessage("Mahsulot o‘chirildi");

      if (editingId === id) {
        resetForm();
      }

      await loadProducts();
    } catch (error) {
      console.error(error);
      setMessage("Mahsulotni o‘chirishda xatolik");
    }
  };

  if (pageLoading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">
          Yuklanmoqda...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Mahsulotlar
            </h1>

            <p className="text-gray-500 mt-1">
              Mahsulotlar ro‘yxati
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">
              {user?.name} — {user?.role}
            </span>

            <button
              onClick={() => {
                window.location.href = "/dashboard";
              }}
              className="bg-gray-800 text-white px-5 py-2 rounded-lg hover:bg-gray-900"
            >
              Dashboard
            </button>
          </div>
        </div>

        <div
          className={
            isAdmin
              ? "grid grid-cols-1 lg:grid-cols-3 gap-6"
              : "grid grid-cols-1 gap-6"
          }
        >

          {/* Admin formasi */}
          {isAdmin && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-5">
                {editingId !== null
                  ? "Mahsulotni tahrirlash"
                  : "Yangi mahsulot"}
              </h2>

              <form
                onSubmit={saveProduct}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mahsulot nomi
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="Masalan: Coca Cola"
                    className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Narxi
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) =>
                      setPrice(e.target.value)
                    }
                    placeholder="15000"
                    className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Miqdori
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(e.target.value)
                    }
                    placeholder="20"
                    className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Rasm */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mahsulot rasmi
                  </label>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="w-full border rounded-lg px-4 py-3"
                  />

                  <p className="text-xs text-gray-500 mt-2">
                    JPG, PNG yoki WEBP. Maksimal 5 MB.
                  </p>
                </div>

                {/* Preview */}
                {preview && (
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Rasm:
                    </p>

                    <img
                      src={preview}
                      alt={name || "Mahsulot rasmi"}
                      className="w-32 h-32 object-cover rounded-xl border"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading
                    ? "Saqlanmoqda..."
                    : editingId !== null
                    ? "SAQLASH"
                    : "MAHSULOT QO‘SHISH"}
                </button>

                {editingId !== null && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300"
                  >
                    BEKOR QILISH
                  </button>
                )}
              </form>
            </div>
          )}

          {/* Mahsulotlar */}
          <div
            className={
              isAdmin
                ? "lg:col-span-2 bg-white rounded-2xl shadow-sm p-6"
                : "bg-white rounded-2xl shadow-sm p-6"
            }
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">
                Mahsulotlar ro‘yxati
              </h2>

              <span className="text-sm text-gray-500">
                {products.length} ta
              </span>
            </div>

            {products.length === 0 ? (
              <p className="text-gray-500">
                Hozircha mahsulot yo‘q.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-3 px-2">
                        Rasm
                      </th>

                      <th className="py-3 px-2">
                        Nomi
                      </th>

                      <th className="py-3 px-2">
                        Narxi
                      </th>

                      <th className="py-3 px-2">
                        Qoldiq
                      </th>

                      {isAdmin && (
                        <th className="py-3 px-2">
                          Amallar
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b"
                      >
                        <td className="py-4 px-2">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-lg border"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">
                              Rasm yo‘q
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-2 font-medium">
                          {product.name}
                        </td>

                        <td className="py-4 px-2">
                          {Number(
                            product.price
                          ).toLocaleString("uz-UZ")}{" "}
                          so‘m
                        </td>

                        <td className="py-4 px-2">
                          {product.quantity} ta
                        </td>

                        {isAdmin && (
                          <td className="py-4 px-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  editProduct(product)
                                }
                                className="bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-600"
                              >
                                Tahrirlash
                              </button>

                              <button
                                onClick={() =>
                                  deleteProduct(
                                    product.id
                                  )
                                }
                                className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600"
                              >
                                O‘chirish
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {message && (
              <p className="text-center text-sm text-gray-700 mt-5">
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  price: string;
  quantity: number;
  image: string | null;
};

type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
};

type SaleItem = {
  id: number;
  quantity: number;
  price: string;
  product: {
    id: number;
    name: string;
  };
};

type Sale = {
  id: number;
  total: string;
  createdAt: string;
  seller: {
    id: number;
    name: string;
    username: string;
  };
  items: SaleItem[];
};

type User = {
  id: number;
  name: string;
  username: string;
  role: "ADMIN" | "SELLER";
};

type Receipt = {
  id: number;
  sellerName: string;
  createdAt: string;
  items: CartItem[];
  total: number;
};

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const [quantities, setQuantities] = useState<
    Record<number, number>
  >({});

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const loadUser = async () => {
    try {
      const response = await fetch("/api/me");
      const data = await response.json();

      if (response.ok) {
        setUser(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();

      if (response.ok) {
        setProducts(data);

        const initialQuantities: Record<number, number> = {};

        data.forEach((product: Product) => {
          initialQuantities[product.id] = 1;
        });

        setQuantities(initialQuantities);
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      console.error(error);
      setMessage("Mahsulotlarni olishda xatolik");
    }
  };

  const loadSales = async () => {
    try {
      const response = await fetch("/api/sales");
      const data = await response.json();

      if (response.ok) {
        setSales(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadUser();
    loadProducts();
    loadSales();
  }, []);

  const increaseQuantity = (product: Product) => {
    const current = quantities[product.id] ?? 1;

    if (current >= product.quantity) {
      return;
    }

    setQuantities({
      ...quantities,
      [product.id]: current + 1,
    });
  };

  const decreaseQuantity = (product: Product) => {
    const current = quantities[product.id] ?? 1;

    if (current <= 1) {
      return;
    }

    setQuantities({
      ...quantities,
      [product.id]: current - 1,
    });
  };

  const addToCart = (product: Product) => {
    setMessage("");

    const qty = quantities[product.id] ?? 1;

    if (product.quantity <= 0) {
      setMessage(`${product.name} qoldig‘i tugagan`);
      return;
    }

    if (!Number.isInteger(qty) || qty <= 0) {
      setMessage("Miqdor noto‘g‘ri");
      return;
    }

    if (qty > product.quantity) {
      setMessage(
        `${product.name} uchun faqat ${product.quantity} ta mavjud`
      );
      return;
    }

    const existingItem = cart.find(
      (item) => item.productId === product.id
    );

    const newQuantity = existingItem
      ? existingItem.quantity + qty
      : qty;

    if (newQuantity > product.quantity) {
      setMessage(
        `${product.name} uchun yetarli mahsulot mavjud emas`
      );
      return;
    }

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: newQuantity,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          price: Number(product.price),
          quantity: qty,
          image: product.image,
        },
      ]);
    }

    setQuantities({
      ...quantities,
      [product.id]: 1,
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(
      cart.filter((item) => item.productId !== productId)
    );
  };

  const changeCartQuantity = (
    productId: number,
    newQuantity: number
  ) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(
      (item) => item.id === productId
    );

    if (!product) {
      return;
    }

    if (newQuantity > product.quantity) {
      setMessage(
        `${product.name} uchun faqat ${product.quantity} ta mavjud`
      );
      return;
    }

    setCart(
      cart.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: newQuantity,
            }
          : item
      )
    );

    setMessage("");
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const createSale = async () => {
    if (cart.length === 0) {
      setMessage("Savatcha bo‘sh");
      return;
    }

    setLoading(true);
    setMessage("");

    const saleItems = [...cart];
    const saleTotal = total;
    const sellerName = user?.name ?? "Sotuvchi";

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: saleItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      setReceipt({
        id: data.sale.id,
        sellerName,
        createdAt: data.sale.createdAt,
        items: saleItems,
        total: saleTotal,
      });

      setCart([]);

      setMessage(
        `Sotuv muvaffaqiyatli yaratildi. №${data.sale.id}`
      );

      await loadProducts();
      await loadSales();
    } catch (error) {
      console.error(error);
      setMessage("Sotuv yaratishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Sotuvlar
            </h1>

            <p className="text-gray-500 mt-1">
              Mahsulotlarni sotish
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

        {/* Mahsulotlar */}
        <div className="bg-white rounded-2xl shadow-sm p-6 print:hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Mahsulotlar
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Sotish uchun mahsulotni tanlang
              </p>
            </div>

            <span className="text-sm text-gray-500">
              {products.length} ta mahsulot
            </span>
          </div>

          {products.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              Hozircha mahsulot mavjud emas.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {products.map((product) => {
                const selectedQuantity =
                  quantities[product.id] ?? 1;

                const isOutOfStock =
                  product.quantity <= 0;

                return (
                  <div
                    key={product.id}
                    className="border border-gray-200 rounded-2xl overflow-hidden bg-white hover:shadow-md transition"
                  >
                    {/* Rasm */}
                    <div className="w-full h-48 bg-gray-100">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                          Rasm yo‘q
                        </div>
                      )}
                    </div>

                    {/* Ma'lumot */}
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-900 truncate">
                        {product.name}
                      </h3>

                      <p className="text-xl font-bold text-blue-600 mt-2">
                        {Number(
                          product.price
                        ).toLocaleString("uz-UZ")}{" "}
                        so‘m
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        Qoldiq: {product.quantity} ta
                      </p>

                      {/* Miqdor */}
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-sm font-medium text-gray-700">
                          Miqdor
                        </span>

                        <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() =>
                              decreaseQuantity(product)
                            }
                            disabled={
                              isOutOfStock ||
                              selectedQuantity <= 1
                            }
                            className="w-10 h-10 text-xl font-bold hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed"
                          >
                            −
                          </button>

                          <div className="w-10 h-10 flex items-center justify-center border-x border-gray-300 font-semibold">
                            {selectedQuantity}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              increaseQuantity(product)
                            }
                            disabled={
                              isOutOfStock ||
                              selectedQuantity >=
                                product.quantity
                            }
                            className="w-10 h-10 text-xl font-bold hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Savatchaga */}
                      <button
                        onClick={() =>
                          addToCart(product)
                        }
                        disabled={isOutOfStock}
                        className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {isOutOfStock
                          ? "QOLDIQ TUGAGAN"
                          : "SAVATCHAGA QO‘SHISH"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {message && (
            <p className="text-center text-sm text-red-500 mt-5">
              {message}
            </p>
          )}
        </div>

        {/* Savatcha */}
        {cart.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mt-6 print:hidden">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Savatcha
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Tanlangan mahsulotlar
                </p>
              </div>

              <span className="text-sm text-gray-500">
                {cart.length} ta mahsulot
              </span>
            </div>

            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="border border-gray-200 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-gray-100 rounded-lg" />
                      )}

                      <div>
                        <p className="font-semibold text-gray-900">
                          {item.name}
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                          {item.price.toLocaleString("uz-UZ")} so‘m
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center border rounded-lg overflow-hidden">
                        <button
                          onClick={() =>
                            changeCartQuantity(
                              item.productId,
                              item.quantity - 1
                            )
                          }
                          className="px-3 py-2 hover:bg-gray-100"
                        >
                          −
                        </button>

                        <span className="px-4 py-2 font-semibold border-x">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() =>
                            changeCartQuantity(
                              item.productId,
                              item.quantity + 1
                            )
                          }
                          className="px-3 py-2 hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>

                      <p className="font-bold min-w-32 text-right">
                        {(
                          item.price * item.quantity
                        ).toLocaleString("uz-UZ")}{" "}
                        so‘m
                      </p>

                      <button
                        onClick={() =>
                          removeFromCart(
                            item.productId
                          )
                        }
                        className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600"
                      >
                        O‘chirish
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Jami */}
            <div className="mt-6 pt-5 border-t flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Jami summa
                </p>

                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {total.toLocaleString("uz-UZ")} so‘m
                </p>
              </div>

              <button
                onClick={createSale}
                disabled={loading}
                className="bg-green-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading
                  ? "SOTILMOQDA..."
                  : "SOTISH"}
              </button>
            </div>
          </div>
        )}

        {/* Sotuvlar tarixi */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mt-6 print:hidden">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Sotuvlar tarixi
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Yaratilgan sotuvlar
              </p>
            </div>

            <span className="text-sm text-gray-500">
              {sales.length} ta sotuv
            </span>
          </div>

          {sales.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              Hozircha sotuvlar mavjud emas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 px-2">№</th>
                    <th className="py-3 px-2">Sotuvchi</th>
                    <th className="py-3 px-2">
                      Mahsulotlar
                    </th>
                    <th className="py-3 px-2">Jami</th>
                    <th className="py-3 px-2">
                      Sana va vaqt
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {sales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="border-b"
                    >
                      <td className="py-4 px-2 font-semibold">
                        #{sale.id}
                      </td>

                      <td className="py-4 px-2">
                        {sale.seller.name}
                      </td>

                      <td className="py-4 px-2">
                        <div className="space-y-1">
                          {sale.items.map((item) => (
                            <div
                              key={item.id}
                              className="text-sm"
                            >
                              {item.product.name} ×{" "}
                              {item.quantity}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-4 px-2 font-semibold">
                        {Number(
                          sale.total
                        ).toLocaleString("uz-UZ")}{" "}
                        so‘m
                      </td>

                      <td className="py-4 px-2 text-sm text-gray-600">
                        {new Date(
                          sale.createdAt
                        ).toLocaleString("uz-UZ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CHEK */}
        {receipt && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 print:static print:bg-white print:p-0">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 print:max-w-none print:w-[80mm] print:rounded-none print:shadow-none print:p-0">

              <div className="receipt-print">
                {/* Do'kon nomi */}
                <div className="text-center border-b border-dashed pb-4">
                  <h2 className="text-2xl font-bold tracking-wide">
                    DO'KON
                  </h2>

                  <p className="text-xs text-gray-500 mt-1">
                    Savdo cheki
                  </p>
                </div>

                {/* Chek ma'lumotlari */}
                <div className="py-4 border-b border-dashed text-sm">
                  <div className="flex justify-between gap-3">
                    <span>Chek raqami:</span>

                    <span className="font-semibold">
                      #{receipt.id}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 mt-2">
                    <span>Sotuvchi:</span>

                    <span className="font-semibold">
                      {receipt.sellerName}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 mt-2">
                    <span>Sana:</span>

                    <span>
                      {new Date(
                        receipt.createdAt
                      ).toLocaleDateString("uz-UZ")}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 mt-2">
                    <span>Vaqt:</span>

                    <span>
                      {new Date(
                        receipt.createdAt
                      ).toLocaleTimeString("uz-UZ")}
                    </span>
                  </div>
                </div>

                {/* Mahsulotlar */}
                <div className="py-4 border-b border-dashed">
                  {receipt.items.map((item) => {
                    const itemTotal =
                      item.price * item.quantity;

                    return (
                      <div
                        key={item.productId}
                        className="mb-4 last:mb-0"
                      >
                        <p className="font-medium">
                          {item.name}
                        </p>

                        <div className="flex justify-between gap-3 text-sm mt-1">
                          <span>
                            {item.quantity} ×{" "}
                            {item.price.toLocaleString(
                              "uz-UZ"
                            )}
                          </span>

                          <span className="font-semibold">
                            {itemTotal.toLocaleString(
                              "uz-UZ"
                            )}{" "}
                            so‘m
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Jami */}
                <div className="py-4 border-b border-dashed">
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-lg font-bold">
                      JAMI
                    </span>

                    <span className="text-xl font-bold">
                      {receipt.total.toLocaleString(
                        "uz-UZ"
                      )}{" "}
                      so‘m
                    </span>
                  </div>
                </div>

                {/* Pastki yozuv */}
                <div className="text-center pt-4">
                  <p className="text-sm font-medium">
                    Xaridingiz uchun rahmat!
                  </p>

                  <p className="text-xs text-gray-500 mt-2">
                    Yana tashrif buyuring
                  </p>
                </div>
              </div>

              {/* Tugmalar */}
              <div className="flex gap-3 mt-6 print:hidden">
                <button
                  onClick={printReceipt}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                >
                  CHEKNI CHOP ETISH
                </button>

                <button
                  onClick={() => setReceipt(null)}
                  className="bg-gray-200 text-gray-800 px-5 py-3 rounded-lg font-semibold hover:bg-gray-300"
                >
                  YOPISH
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
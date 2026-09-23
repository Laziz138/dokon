import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";

export default async function LowStockPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    redirect("/");
  }

  const session = await verifySession(token);

  if (!session) {
    redirect("/");
  }

  const products = await prisma.product.findMany({
    where: {
      quantity: {
        lte: 5,
      },
    },
    orderBy: {
      quantity: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="ml-64">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Kam qolgan mahsulotlar
            </h1>

            <p className="text-gray-500 mt-2">
              Qoldig‘i 5 ta yoki undan kam bo‘lgan mahsulotlar
            </p>
          </div>

          {products.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
              <p className="text-gray-500">
                Hozircha kam qolgan mahsulotlar yo‘q.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="h-52 bg-gray-100">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        Rasm yo‘q
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h2 className="text-xl font-bold text-gray-900">
                      {product.name}
                    </h2>

                    <p className="text-blue-600 font-bold text-lg mt-2">
                      {Number(
                        product.price
                      ).toLocaleString("uz-UZ")}{" "}
                      so‘m
                    </p>

                    <div className="mt-4">
                      {product.quantity === 0 ? (
                        <span className="inline-block bg-red-100 text-red-600 px-4 py-2 rounded-lg font-semibold">
                          Tugagan
                        </span>
                      ) : (
                        <span className="inline-block bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg font-semibold">
                          {product.quantity} ta qoldi
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
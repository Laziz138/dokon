import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import Sidebar from "@/app/components/Sidebar";

function getTashkentTodayRange() {
  const now = new Date();

  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tashkent",
  }).format(now);

  const start = new Date(`${date}T00:00:00+05:00`);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    redirect("/");
  }

  const session = await verifySession(token);

  if (!session) {
    redirect("/");
  }

  const isAdmin = session.role === "ADMIN";

  const { start, end } = getTashkentTodayRange();

  const salesWhere = isAdmin
    ? {}
    : {
        sellerId: session.userId,
      };

  const todaySalesWhere = {
    ...salesWhere,
    createdAt: {
      gte: start,
      lt: end,
    },
  };

  const [
    productCount,
    userCount,
    todaySalesCount,
    todayRevenue,
    recentSales,
  ] = await Promise.all([
    prisma.product.count(),

    prisma.user.count(),

    prisma.sale.count({
      where: todaySalesWhere,
    }),

    prisma.sale.aggregate({
      where: todaySalesWhere,
      _sum: {
        total: true,
      },
    }),

    prisma.sale.findMany({
      where: salesWhere,
      include: {
        seller: {
          select: {
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
  ]);

  const revenue = todayRevenue._sum.total?.toString() ?? "0";

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar isAdmin={isAdmin} />

      {/* Main */}
      <div className="md:ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4 md:py-5 flex items-center justify-between gap-4">
            <div className="pl-12 md:pl-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Boshqaruv paneli
              </h1>

              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {isAdmin
                  ? "Admin boshqaruv paneli"
                  : "Sotuvchi paneli"}
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:block text-right">
                <p className="font-semibold text-gray-900 text-sm">
                  {isAdmin ? "Administrator" : "Sotuvchi"}
                </p>

                <p className="text-xs text-gray-500">
                  {session.role}
                </p>
              </div>

              <Link
                href="/api/logout"
                className="bg-red-500 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition"
              >
                Chiqish
              </Link>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {/* Welcome */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Xush kelibsiz!
            </h2>

            <p className="text-sm sm:text-base text-gray-500 mt-2">
              Do‘koningizdagi asosiy ma’lumotlar
            </p>
          </div>

          {/* Statistics */}
         <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-6 sm:mb-8">
            {/* Products */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-gray-500">
                    Mahsulotlar
                  </p>

                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                    {productCount}
                  </p>

                  <p className="text-xs text-gray-400 mt-2">
                    Jami mahsulot
                  </p>
                </div>

                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-50 flex items-center justify-center text-xl sm:text-2xl shrink-0">
                  📦
                </div>
              </div>
            </div>

            {/* Today sales */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-gray-500">
                    Bugungi sotuvlar
                  </p>

                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                    {todaySalesCount}
                  </p>

                  <p className="text-xs text-gray-400 mt-2">
                    Bugungi savdolar
                  </p>
                </div>

                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-green-50 flex items-center justify-center text-xl sm:text-2xl shrink-0">
                  🛒
                </div>
              </div>
            </div>

            {/* Revenue */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-gray-500">
                    Bugungi tushum
                  </p>

                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-2 break-words">
                    {Number(revenue).toLocaleString("uz-UZ")} so‘m
                  </p>

                  <p className="text-xs text-gray-400 mt-2">
                    Bugungi jami
                  </p>
                </div>

                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-yellow-50 flex items-center justify-center text-xl sm:text-2xl shrink-0">
                  💰
                </div>
              </div>
            </div>

            {/* Users */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-gray-500">
                    Foydalanuvchilar
                  </p>

                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                    {userCount}
                  </p>

                  <p className="text-xs text-gray-400 mt-2">
                    Admin va sotuvchilar
                  </p>
                </div>

                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-purple-50 flex items-center justify-center text-xl sm:text-2xl shrink-0">
                  👥
                </div>
              </div>
            </div>
          </div>

          {/* Recent sales */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                  Oxirgi sotuvlar
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Eng so‘nggi 5 ta sotuv
                </p>
              </div>

              <Link
                href="/sales"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Barchasini ko‘rish
              </Link>
            </div>

            {recentSales.length === 0 ? (
              <div className="py-10 sm:py-12 text-center text-gray-500">
                Hozircha sotuvlar mavjud emas.
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className="font-bold text-gray-900">
                            #{sale.id}
                          </span>

                          <span className="text-sm text-gray-500">
                            {sale.seller.name}
                          </span>
                        </div>

                        <div className="mt-2 space-y-1">
                          {sale.items.map((item) => (
                            <p
                              key={item.id}
                              className="text-sm text-gray-600"
                            >
                              {item.product.name} ×{" "}
                              {item.quantity}
                            </p>
                          ))}
                        </div>

                        <p className="text-xs text-gray-400 mt-2">
                          {new Intl.DateTimeFormat("uz-UZ", {
                            timeZone: "Asia/Tashkent",
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(
                            new Date(sale.createdAt)
                          )}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="font-bold text-gray-900">
                          {Number(
                            sale.total.toString()
                          ).toLocaleString("uz-UZ")}{" "}
                          so‘m
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
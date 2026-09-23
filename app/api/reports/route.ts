import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

function getTashkentDate() {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(
    parts.find((p) => p.type === "year")?.value
  );

  const month = Number(
    parts.find((p) => p.type === "month")?.value
  );

  const day = Number(
    parts.find((p) => p.type === "day")?.value
  );

  return { year, month, day };
}

function getDayRange(year: number, month: number, day: number) {
  const start = new Date(
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}T00:00:00+05:00`
  );

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    start,
    end,
  };
}

function getMonthRange(year: number, month: number) {
  const start = new Date(
    `${year}-${String(month).padStart(2, "0")}-01T00:00:00+05:00`
  );

  const end =
    month === 12
      ? new Date(`${year + 1}-01-01T00:00:00+05:00`)
      : new Date(
          `${year}-${String(month + 1).padStart(
            2,
            "0"
          )}-01T00:00:00+05:00`
        );

  return {
    start,
    end,
  };
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Tizimga kiring" },
        { status: 401 }
      );
    }

    const session = await verifySession(token);

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Faqat Admin uchun" },
        { status: 403 }
      );
    }

    const { year, month, day } = getTashkentDate();

    const today = getDayRange(year, month, day);
    const currentMonth = getMonthRange(year, month);

    const todayWhere = {
      createdAt: {
        gte: today.start,
        lt: today.end,
      },
    };

    const monthWhere = {
      createdAt: {
        gte: currentMonth.start,
        lt: currentMonth.end,
      },
    };

    const [
      todayCount,
      todayTotal,
      monthCount,
      monthTotal,
      sellers,
    ] = await Promise.all([
      prisma.sale.count({
        where: todayWhere,
      }),

      prisma.sale.aggregate({
        where: todayWhere,
        _sum: {
          total: true,
        },
      }),

      prisma.sale.count({
        where: monthWhere,
      }),

      prisma.sale.aggregate({
        where: monthWhere,
        _sum: {
          total: true,
        },
      }),

      prisma.user.findMany({
        where: {
          role: "SELLER",
        },
        select: {
          id: true,
          name: true,
          username: true,
        },
        orderBy: {
          id: "asc",
        },
      }),
    ]);

    const sellerReports = await Promise.all(
      sellers.map(async (seller) => {
        const [todaySeller, monthSeller] =
          await Promise.all([
            prisma.sale.aggregate({
              where: {
                sellerId: seller.id,
                createdAt: {
                  gte: today.start,
                  lt: today.end,
                },
              },
              _count: {
                id: true,
              },
              _sum: {
                total: true,
              },
            }),

            prisma.sale.aggregate({
              where: {
                sellerId: seller.id,
                createdAt: {
                  gte: currentMonth.start,
                  lt: currentMonth.end,
                },
              },
              _count: {
                id: true,
              },
              _sum: {
                total: true,
              },
            }),
          ]);

        return {
          id: seller.id,
          name: seller.name,
          username: seller.username,

          today: {
            salesCount: todaySeller._count.id,
            total:
              todaySeller._sum.total?.toString() ?? "0",
          },

          month: {
            salesCount: monthSeller._count.id,
            total:
              monthSeller._sum.total?.toString() ?? "0",
          },
        };
      })
    );

    return NextResponse.json({
      today: {
        salesCount: todayCount,
        total: todayTotal._sum.total?.toString() ?? "0",
      },

      month: {
        salesCount: monthCount,
        total: monthTotal._sum.total?.toString() ?? "0",
      },

      sellers: sellerReports,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Hisobotlarni olishda xatolik" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return null;
  }

  return await verifySession(token);
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { message: "Tizimga kiring" },
        { status: 401 }
      );
    }

    const sales = await prisma.sale.findMany({
      where:
        session.role === "ADMIN"
          ? undefined
          : {
              sellerId: session.userId,
            },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const result = sales.map((sale) => ({
      id: sale.id,
      total: sale.total.toString(),
      createdAt: sale.createdAt,
      seller: sale.seller,
      items: sale.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price.toString(),
        product: {
          id: item.product.id,
          name: item.product.name,
        },
      })),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Sotuvlarni olishda xatolik" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { message: "Tizimga kiring" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const items = body.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: "Sotuv uchun mahsulot tanlang" },
        { status: 400 }
      );
    }

    const sale = await prisma.$transaction(async (tx) => {
      const saleItemsData: {
        productId: number;
        quantity: number;
        price: Prisma.Decimal;
      }[] = [];

      let total = new Prisma.Decimal(0);

      for (const item of items) {
        const productId = Number(item.productId);
        const quantity = Number(item.quantity);

        if (
          !Number.isInteger(productId) ||
          !Number.isInteger(quantity) ||
          quantity <= 0
        ) {
          throw new Error("Mahsulot yoki miqdor noto‘g‘ri");
        }

        const product = await tx.product.findUnique({
          where: {
            id: productId,
          },
        });

        if (!product) {
          throw new Error("Mahsulot topilmadi");
        }

        const updated = await tx.product.updateMany({
          where: {
            id: productId,
            quantity: {
              gte: quantity,
            },
          },
          data: {
            quantity: {
              decrement: quantity,
            },
          },
        });

        if (updated.count === 0) {
          throw new Error(
            `${product.name} uchun yetarli mahsulot qolmagan`
          );
        }

        const itemTotal = product.price.mul(quantity);

        total = total.add(itemTotal);

        saleItemsData.push({
          productId,
          quantity,
          price: product.price,
        });
      }

      const newSale = await tx.sale.create({
        data: {
          sellerId: session.userId,
          total,
          items: {
            create: saleItemsData,
          },
        },
      });

      return newSale;
    });

    return NextResponse.json({
      message: "Sotuv muvaffaqiyatli yaratildi",
      sale: {
        id: sale.id,
        total: sale.total.toString(),
        sellerId: sale.sellerId,
        createdAt: sale.createdAt,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Sotuv yaratishda xatolik",
      },
      { status: 400 }
    );
  }
}
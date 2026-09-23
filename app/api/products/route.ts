import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return null;
  }

  const session = await verifySession(token);

  if (!session || session.role !== "ADMIN") {
    return null;
  }

  return session;
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      products.map((product) => ({
        ...product,
        price: product.price.toString(),
      }))
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Mahsulotlarni olishda xatolik" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await checkAdmin();

    if (!session) {
      return NextResponse.json(
        { message: "Faqat Admin mahsulot qo‘sha oladi" },
        { status: 403 }
      );
    }

    const { name, price, quantity, image } = await request.json();

    if (!name || price === undefined || quantity === undefined) {
      return NextResponse.json(
        { message: "Barcha kerakli maydonlarni to‘ldiring" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        price: Number(price),
        quantity: Number(quantity),
        image: image || null,
      },
    });

    return NextResponse.json({
      message: "Mahsulot qo‘shildi",
      product: {
        ...product,
        price: product.price.toString(),
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Mahsulot qo‘shishda xatolik" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await checkAdmin();

    if (!session) {
      return NextResponse.json(
        { message: "Faqat Admin mahsulotni tahrirlay oladi" },
        { status: 403 }
      );
    }

    const { id, name, price, quantity, image } = await request.json();

    if (!id || !name || price === undefined || quantity === undefined) {
      return NextResponse.json(
        { message: "Ma’lumotlar to‘liq emas" },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: {
        id: Number(id),
      },
      data: {
        name,
        price: Number(price),
        quantity: Number(quantity),
        image: image || null,
      },
    });

    return NextResponse.json({
      message: "Mahsulot yangilandi",
      product: {
        ...product,
        price: product.price.toString(),
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Mahsulotni yangilashda xatolik" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await checkAdmin();

    if (!session) {
      return NextResponse.json(
        { message: "Faqat Admin mahsulotni o‘chira oladi" },
        { status: 403 }
      );
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { message: "Mahsulot ID kerak" },
        { status: 400 }
      );
    }

    const saleItemsCount = await prisma.saleItem.count({
      where: {
        productId: Number(id),
      },
    });

    if (saleItemsCount > 0) {
      return NextResponse.json(
        {
          message:
            "Bu mahsulot sotuv tarixida mavjud. Uni o‘chirib bo‘lmaydi.",
        },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: {
        id: Number(id),
      },
    });

    return NextResponse.json({
      message: "Mahsulot o‘chirildi",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Mahsulotni o‘chirishda xatolik" },
      { status: 500 }
    );
  }
}
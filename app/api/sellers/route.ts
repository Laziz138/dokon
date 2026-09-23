import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
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
    const session = await checkAdmin();

    if (!session) {
      return NextResponse.json(
        { message: "Faqat Admin kirishi mumkin" },
        { status: 403 }
      );
    }

    const sellers = await prisma.user.findMany({
      where: {
        role: "SELLER",
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json(sellers);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Sotuvchilarni olishda xatolik" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await checkAdmin();

    if (!session) {
      return NextResponse.json(
        { message: "Faqat Admin o‘zgartira oladi" },
        { status: 403 }
      );
    }

    const { id, name, username, password } =
      await request.json();

    if (!id || !name || !username) {
      return NextResponse.json(
        { message: "Ism va loginni kiriting" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        NOT: {
          id: Number(id),
        },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Bu login allaqachon ishlatilmoqda" },
        { status: 400 }
      );
    }

    const data: {
      name: string;
      username: string;
      password?: string;
    } = {
      name,
      username,
    };

    if (password && password.trim() !== "") {
      data.password = await bcrypt.hash(password, 10);
    }

    const seller = await prisma.user.update({
      where: {
        id: Number(id),
      },
      data,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: "Sotuvchi ma’lumotlari yangilandi",
      seller,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Sotuvchini yangilashda xatolik" },
      { status: 500 }
    );
  }
}
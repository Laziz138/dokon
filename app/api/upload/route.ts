import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { verifySession } from "@/lib/auth";

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function POST(request: Request) {
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
        { message: "Faqat Admin rasm yuklay oladi" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Rasm fayli tanlanmagan" },
        { status: 400 }
      );
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "Faqat JPG, PNG yoki WEBP rasm yuklash mumkin" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: "Rasm hajmi 5 MB dan oshmasin" },
        { status: 400 }
      );
    }

    const extension =
      file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/png"
        ? "png"
        : "webp";

    const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads"
    );

    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());

    await writeFile(filePath, buffer);

    return NextResponse.json({
      message: "Rasm yuklandi",
      image: `/uploads/${fileName}`,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Rasm yuklashda xatolik" },
      { status: 500 }
    );
  }
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type SidebarProps = {
  isAdmin: boolean;
};

export default function Sidebar({
  isAdmin,
}: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const menuItems = [
    {
      href: "/dashboard",
      icon: "🏠",
      title: "Dashboard",
      show: true,
    },
    {
      href: "/products",
      icon: "📦",
      title: "Mahsulotlar",
      show: true,
    },
    {
      href: "/sales",
      icon: "🛒",
      title: "Sotuvlar",
      show: true,
    },
    {
      href: "/sellers",
      icon: "👥",
      title: "Sotuvchilar",
      show: isAdmin,
    },
    {
      href: "/reports",
      icon: "📊",
      title: "Hisobotlar",
      show: isAdmin,
    },
    {
      href: "/low-stock",
      icon: "⚠️",
      title: "Kam qolgan",
      show: true,
    },
  ];

  const closeMenu = () => {
    setOpen(false);
  };

  return (
    <>
      {/* Telefon uchun yuqoridagi menyu tugmasi */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-11 h-11 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center justify-center text-xl"
        aria-label="Menyuni ochish"
      >
        ☰
      </button>

      {/* Telefon uchun qoramtir fon */}
      {open && (
        <div
          onClick={closeMenu}
          className="md:hidden fixed inset-0 bg-black/40 z-40"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-screen w-64 bg-white
          border-r border-gray-200 flex flex-col z-50
          transition-transform duration-300
          md:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              DO'KON
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Boshqaruv tizimi
            </p>
          </div>

          {/* Telefon uchun yopish */}
          <button
            type="button"
            onClick={closeMenu}
            className="md:hidden w-9 h-9 rounded-lg hover:bg-gray-100 text-xl"
            aria-label="Menyuni yopish"
          >
            ×
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-2">
            {menuItems
              .filter((item) => item.show)
              .map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-xl">
                      {item.icon}
                    </span>

                    <span>{item.title}</span>
                  </Link>
                );
              })}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <Link
            href="/api/logout"
            onClick={closeMenu}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition font-medium"
          >
            <span className="text-xl">🚪</span>
            <span>Chiqish</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
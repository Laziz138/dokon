"use client";

import { useEffect, useState } from "react";

type SellerReport = {
  id: number;
  name: string;
  username: string;

  today: {
    salesCount: number;
    total: string;
  };

  month: {
    salesCount: number;
    total: string;
  };
};

type ReportData = {
  today: {
    salesCount: number;
    total: string;
  };

  month: {
    salesCount: number;
    total: string;
  };

  sellers: SellerReport[];
};

export default function ReportsPage() {
  const [report, setReport] =
    useState<ReportData | null>(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      try {
        const response = await fetch("/api/reports");
        const data = await response.json();

        if (!response.ok) {
          setMessage(data.message);
          return;
        }

        setReport(data);
      } catch (error) {
        console.error(error);
        setMessage("Hisobotlarni olishda xatolik");
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Hisobotlar
            </h1>

            <p className="text-gray-500 mt-1">
              Kunlik va oylik sotuvlar
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

        {loading ? (
          <div className="bg-white rounded-2xl p-10 text-center">
            Hisobotlar yuklanmoqda...
          </div>
        ) : message ? (
          <div className="bg-white rounded-2xl p-10 text-center text-red-500">
            {message}
          </div>
        ) : report ? (
          <>
            {/* Umumiy bugungi va oylik hisobot */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="text-gray-500 text-sm">
                  Bugungi sotuvlar
                </p>

                <p className="text-3xl font-bold mt-2">
                  {report.today.salesCount} ta
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="text-gray-500 text-sm">
                  Bugungi tushum
                </p>

                <p className="text-3xl font-bold mt-2">
                  {Number(
                    report.today.total
                  ).toLocaleString("uz-UZ")}{" "}
                  so‘m
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="text-gray-500 text-sm">
                  Oylik sotuvlar
                </p>

                <p className="text-3xl font-bold mt-2">
                  {report.month.salesCount} ta
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="text-gray-500 text-sm">
                  Oylik tushum
                </p>

                <p className="text-3xl font-bold mt-2">
                  {Number(
                    report.month.total
                  ).toLocaleString("uz-UZ")}{" "}
                  so‘m
                </p>
              </div>
            </div>

            {/* Sotuvchilar hisoboti */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold">
                Sotuvchilar hisoboti
              </h2>

              <p className="text-sm text-gray-500 mt-1 mb-5">
                Bugungi kun va joriy oy bo‘yicha
              </p>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-3 px-2">
                        Sotuvchi
                      </th>

                      <th className="py-3 px-2">
                        Bugungi sotuv
                      </th>

                      <th className="py-3 px-2">
                        Bugungi tushum
                      </th>

                      <th className="py-3 px-2">
                        Oylik sotuv
                      </th>

                      <th className="py-3 px-2">
                        Oylik tushum
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.sellers.map((seller) => (
                      <tr
                        key={seller.id}
                        className="border-b"
                      >
                        <td className="py-4 px-2">
                          <p className="font-semibold">
                            {seller.name}
                          </p>

                          <p className="text-sm text-gray-500">
                            {seller.username}
                          </p>
                        </td>

                        <td className="py-4 px-2">
                          {seller.today.salesCount} ta
                        </td>

                        <td className="py-4 px-2 font-semibold">
                          {Number(
                            seller.today.total
                          ).toLocaleString("uz-UZ")}{" "}
                          so‘m
                        </td>

                        <td className="py-4 px-2">
                          {seller.month.salesCount} ta
                        </td>

                        <td className="py-4 px-2 font-semibold">
                          {Number(
                            seller.month.total
                          ).toLocaleString("uz-UZ")}{" "}
                          so‘m
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
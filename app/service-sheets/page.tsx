import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAllServiceSheets } from "@/lib/service-sheets-api";
import { getUser, getUserProfile } from "@/lib/auth";
import { redirect } from 'next/navigation';
import { ServiceSheetsClient } from "./service-sheets-client";

export default async function ServiceSheetsPage() {
  // Parallel: auth + data fetch (getUser is cached, so both calls share the same JWT verification)
  const [user, profile, response] = await Promise.all([
    getUser(),
    getUserProfile(),
    getAllServiceSheets(),
  ])

  if (!user) redirect('/login')

  const serviceSheets = response.data || []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Todas as Fichas de Serviço</h1>
        {profile?.role !== 'observer' && (
          <Button asChild>
            <Link href="/service-sheets/new">Criar Nova</Link>
          </Button>
        )}
      </div>

      <ServiceSheetsClient initialData={serviceSheets} />
    </div>
  );
}

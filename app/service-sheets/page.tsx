import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getAllServiceSheets,
} from "@/lib/supabase";
import { format } from "date-fns";
import { Search, Filter, Calendar, Sparkles } from "lucide-react";
import { getUser, getUserProfile } from "@/lib/auth";
import { redirect } from 'next/navigation';
import { ServiceSheetsClient } from "./service-sheets-client";

export default async function ServiceSheetsPage() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const profile = await getUserProfile()
  const serviceSheets = await getAllServiceSheets()

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

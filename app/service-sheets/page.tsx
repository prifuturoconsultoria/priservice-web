import { getUser } from "@/lib/auth";
import { redirect } from 'next/navigation';
import { ServiceSheetsClient } from "./service-sheets-client";

export default async function ServiceSheetsPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  return <ServiceSheetsClient />
}

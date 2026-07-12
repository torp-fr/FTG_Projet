import { Dashboard } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function ProjetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Dashboard projectId={id} />;
}

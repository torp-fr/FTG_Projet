import { getCohort } from "@/lib/data";

export const dynamic = "force-dynamic";

function cell(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export async function GET(): Promise<Response> {
  const { rows } = await getCohort();
  const header = ["Porteur", "Contact", "Ambition", "Porte", "Phase", "Dernier verdict", "V3", "Livrables", "À surveiller"];
  const lines = rows.map((r) =>
    [r.name, r.ownerName, r.ambition ?? "", r.entryDoor, r.currentPhase, r.verdict ?? "", r.v3 ?? "", r.nDeliverables, r.watch ? "oui" : "non"]
      .map((x) => cell(String(x)))
      .join(","),
  );
  // BOM pour Excel + CRLF
  const csv = "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="cohorte-demo.csv"',
    },
  });
}

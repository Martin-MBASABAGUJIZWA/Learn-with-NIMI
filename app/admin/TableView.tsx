'use client';

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";

interface TableViewProps {
  table: string;
}

export default function TableView({ table }: TableViewProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRows = async () => {
      setLoading(true);
      try {
        const tableName = table.toLowerCase(); // enforce lowercase table name
        let data: any[] = [];

        if (tableName === "profiles") {
          // Join with users/admins to show friendly emails
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select(`
              id,
              full_name,
              bio,
              avatar_url,
              created_at,
              updated_at,
              users:user_id ( id, email ),
              admins:admin_id ( id, email )
            `);

          if (profileError) throw profileError;

          data = profileData.map((p) => ({
            id: p.id,
            full_name: p.full_name,
            bio: p.bio,
            avatar_url: p.avatar_url,
            created_at: p.created_at,
            updated_at: p.updated_at,
            owner:
              // if there are multiple, join their emails with commas
              (p.users && Array.isArray(p.users) && p.users.length > 0
                ? p.users.map((u: any) => u.email).join(", ")
                : null) ??
              (p.admins && Array.isArray(p.admins) && p.admins.length > 0
                ? p.admins.map((a: any) => a.email).join(", ")
                : null) ??
              "⚠️ Orphan (no linked user/admin)",
          }));
        } else {
          const { data: normalData, error: normalError } = await supabase
            .from(tableName)
            .select("*");

          if (normalError) throw normalError;
          data = normalData || [];
        }

        setRows(data);
      } catch (err: any) {
        console.error(`Error fetching table "${table}":`, err);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRows();
  }, [table]);

  return (
    <Card className="p-4">
      <CardContent>
        {loading ? (
          <p>Loading {table}...</p>
        ) : rows.length === 0 ? (
          <p>No data found in {table}</p>
        ) : (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr>
                {Object.keys(rows[0]).map((key) => (
                  <th key={key} className="border border-gray-300 px-2 py-1">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="border border-gray-300 px-2 py-1">
                      {typeof val === "object" ? JSON.stringify(val) : String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

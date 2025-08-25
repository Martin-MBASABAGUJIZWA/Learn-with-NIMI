import type { NextApiRequest, NextApiResponse } from "next";
import supabase from "@/lib/supabaseClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { parentId, provider, plan, phone, transactionId } = req.body;

  if (!parentId || !provider || !plan || !phone || !transactionId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const { data, error } = await supabase.from("manual_payments").insert([
      {
        parent_id: parentId,
        provider,
        plan,
        phone,
        transaction_id: transactionId,
      },
    ]);

    if (error) throw error;

    res.status(200).json({ message: "Manual payment submitted", data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// /app/subscription-success/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SubscriptionSuccess() {
  const router = useRouter();

  useEffect(() => {
    // Optional: refresh subscription data from Supabase
    router.replace("/subscription"); // back to subscription page
  }, [router]);

  return <div className="text-center p-8">🎉 Payment successful! Enjoy Premium.</div>;
}

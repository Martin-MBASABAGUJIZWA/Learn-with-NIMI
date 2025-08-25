"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}

function SubscriptionSuccessContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold">Subscription {status}</h1>
      <p className="mt-4">Thank you for your subscription 🎉</p>
    </div>
  );
}

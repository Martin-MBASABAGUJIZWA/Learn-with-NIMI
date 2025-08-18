"use client";

import { useRouter } from "next/navigation";
import { Baby } from "lucide-react";
import { Button } from "@/components/ui/button";

const AuthGate = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-4 text-center">
      <div className="bg-blue-100 p-6 rounded-full">
        <Baby className="h-12 w-12 text-blue-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800">Parent Access Required</h2>
      <p className="text-gray-600 max-w-md">
        Please sign in to view and manage your child's activities and settings.
      </p>
      <div className="flex gap-4 mt-4">
        <Button onClick={() => router.push("/loginpage")}>
          Sign In
        </Button>
        <Button variant="outline" onClick={() => router.push("/")}>
          Go Home
        </Button>
      </div>
    </div>
  );
};

export default AuthGate;

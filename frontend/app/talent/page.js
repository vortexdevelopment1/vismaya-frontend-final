"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TalentRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/talent/dashboard");
  }, [router]);

  return null;
}

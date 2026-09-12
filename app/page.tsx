import { Suspense } from "react";
import { OneStarApp } from "@/components/app-client";

export default function Home() {
  return (
    <Suspense>
      <OneStarApp />
    </Suspense>
  );
}

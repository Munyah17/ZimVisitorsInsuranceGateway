import type { Metadata } from "next";
import { Suspense } from "react";
import { QuoteWizard } from "./quote-wizard";

export const metadata: Metadata = {
  title: "Get Started",
  description: "Get a Zimbabwe visitor insurance quote in minutes.",
};

export default function QuotePage() {
  return (
    <Suspense>
      <QuoteWizard />
    </Suspense>
  );
}

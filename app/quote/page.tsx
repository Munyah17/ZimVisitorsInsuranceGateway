import type { Metadata } from "next";
import { Suspense } from "react";
import { QuoteWizard } from "./quote-wizard";

export const metadata: Metadata = {
  title: "Get Insurance",
  description: "Get a Zimbabwe visitor insurance quote in minutes.",
};

export default function QuotePage() {
  return (
    <Suspense>
      <QuoteWizard />
    </Suspense>
  );
}

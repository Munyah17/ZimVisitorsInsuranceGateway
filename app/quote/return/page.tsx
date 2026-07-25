import type { Metadata } from "next";
import { PaymentReturn } from "./payment-return";

export const metadata: Metadata = {
  title: "Confirming your payment",
  description: "Confirming your Paynow payment.",
};

export default function QuoteReturnPage() {
  return <PaymentReturn />;
}

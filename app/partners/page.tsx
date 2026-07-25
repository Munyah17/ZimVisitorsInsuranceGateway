import type { Metadata } from "next";
import { PartnersDirectory } from "./partners-directory";

export const metadata: Metadata = {
  title: "Service Partners",
  description:
    "Clinics, medical practices, ambulance services and emergency care providers accepting Zim Travelmate cover across Zimbabwe.",
};

export default function PartnersPage() {
  return <PartnersDirectory />;
}

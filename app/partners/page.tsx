import type { Metadata } from "next";
import { PartnersDirectory } from "./partners-directory";

export const metadata: Metadata = {
  title: "Service Partners",
  description:
    "Clinics, medical practices, ambulance services and emergency care providers accepting Travelmate Zim cover across Zimbabwe.",
};

export default function PartnersPage() {
  return <PartnersDirectory />;
}

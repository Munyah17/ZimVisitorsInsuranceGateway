import type { Metadata } from "next";
import { AuthPage } from "./auth-page";

export const metadata: Metadata = {
  title: "Login / Signup",
  description: "Sign in to your Zim Travelmate portal.",
};

export default function PortalsPage() {
  return <AuthPage />;
}

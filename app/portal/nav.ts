import {
  LayoutDashboard,
  FileText,
  FilePlus2,
  Siren,
  User,
} from "lucide-react";
import type { NavItem } from "@/components/dashboard-shell";

/** Client portal sidebar. Each entry is a real route. */
export const CLIENT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/portal", icon: LayoutDashboard },
  { label: "My Policies", href: "/portal/policies", icon: FileText },
  { label: "Submit Claim", href: "/claims", icon: FilePlus2 },
  { label: "Emergency Help", href: "/portal/emergency", icon: Siren },
  { label: "Profile", href: "/portal/profile", icon: User },
];

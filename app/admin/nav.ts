import {
  LayoutDashboard,
  FileText,
  ShieldAlert,
  Users,
  Building2,
  Settings,
} from "lucide-react";
import type { NavItem } from "@/components/dashboard-shell";

/** Admin portal sidebar. Each entry is a real route. */
export const ADMIN_NAV: NavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Policies", href: "/admin/policies", icon: FileText },
  { label: "Claims", href: "/admin/claims", icon: ShieldAlert },
  { label: "Agents", href: "/admin/agents", icon: Users },
  { label: "Organizations", href: "/admin/organizations", icon: Building2 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

import {
  LayoutDashboard,
  FileText,
  Users,
  Wallet,
  ChartNoAxesColumn,
} from "lucide-react";
import type { NavItem } from "@/components/dashboard-shell";

/** Agent portal sidebar. Each entry is a real route. */
export const AGENT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/agent", icon: LayoutDashboard },
  { label: "My Sales", href: "/agent/sales", icon: FileText },
  { label: "Visitors", href: "/agent/visitors", icon: Users },
  { label: "Commissions", href: "/agent/commissions", icon: Wallet },
  { label: "Reports", href: "/agent/reports", icon: ChartNoAxesColumn },
];

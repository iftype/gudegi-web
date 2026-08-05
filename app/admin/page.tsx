import type { Metadata } from "next";
import { AdminExperience } from "@/components/admin-experience";

export const metadata: Metadata = {
  title: "운영 관리",
  robots: { index: false, follow: false }
};

export default function AdminPage() {
  return <AdminExperience />;
}

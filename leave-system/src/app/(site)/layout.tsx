// Server Component OK (ไม่มี "use client")
import AutoTranslateLoader from "@/components/AutoTranslateLoader";
import AppHeader from "@/components/AppHeader";
import AppShell from "@/components/AppShell";
import AuthGate from "@/components/AuthGate"; // ⬅️ เพิ่มแค่นี้

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      {/* โหลดตัวแปลภาษา + Navbar */}
      <AutoTranslateLoader />
      <AppHeader />
      <AppShell>{children}</AppShell>
    </AuthGate>
  );
}

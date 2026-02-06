import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-stable-ink/95 text-stable-sand shadow">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-stable-hay">Stable Manager</p>
            <h1 className="text-lg font-semibold">Ranch Billing Console</h1>
          </div>
          <nav className="flex items-center gap-4 text-sm font-semibold uppercase tracking-wide">
            <Link href="/dashboard" className="hover:text-stable-hay">Dashboard</Link>
            <Link href="/riders" className="hover:text-stable-hay">Riders</Link>
            <Link href="/boarders" className="hover:text-stable-hay">Boarders</Link>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

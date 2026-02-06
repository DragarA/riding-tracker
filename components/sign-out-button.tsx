"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => signOut({ callbackUrl: "/signin" })}
      className="border-stable-hay/40 text-stable-hay hover:bg-stable-hay/10"
    >
      Sign Out
    </Button>
  );
}

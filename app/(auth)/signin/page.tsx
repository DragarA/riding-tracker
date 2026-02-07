"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  const registrationEnabled = process.env.NEXT_PUBLIC_ALLOW_REGISTRATION === "true";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    });

    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="stable-card w-full max-w-md p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-stable-saddle">Stable Manager</p>
        <h1 className="mt-2 text-2xl font-semibold">Sign In</h1>
        <p className="mt-2 text-sm text-stable-ink/70">
          Enter your credentials to access the ranch billing console.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold">
            Email
            <input
              type="email"
              className="stable-input mt-2"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-semibold">
            Password
            <input
              type="password"
              className="stable-input mt-2"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button type="submit" className="stable-button w-full">
            Enter Console
          </button>
        </form>
        {registrationEnabled ? (
          <div className="mt-6 text-center text-sm">
            <Link href="/register" className="text-stable-saddle underline">
              Need an admin account? Register here.
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

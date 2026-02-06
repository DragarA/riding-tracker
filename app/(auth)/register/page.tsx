"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    if (!response.ok) {
      setError("Unable to register. Try a different email.");
      return;
    }

    setSuccess("Account created. Signing you in...");
    await signIn("credentials", {
      email,
      password,
      redirect: true,
      callbackUrl: "/dashboard"
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="stable-card w-full max-w-md p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-stable-saddle">Stable Manager</p>
        <h1 className="mt-2 text-2xl font-semibold">Create Admin</h1>
        <p className="mt-2 text-sm text-stable-ink/70">
          Create the first ranch admin account to manage riders and boarders.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold">
            Name
            <input
              type="text"
              className="stable-input mt-2"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
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
          {success ? <p className="text-sm text-stable-forest">{success}</p> : null}
          <button type="submit" className="stable-button w-full">
            Create Account
          </button>
        </form>
        <div className="mt-6 text-center text-sm">
          <Link href="/signin" className="text-stable-saddle underline">
            Back to sign in.
          </Link>
        </div>
      </div>
    </div>
  );
}

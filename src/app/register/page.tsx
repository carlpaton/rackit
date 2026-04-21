"use client";

import { useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { register } from "./actions";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, null);
  const [displayName, setDisplayName] = useState("");
  const [autoFill, setAutoFill] = useState(true);

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (autoFill) {
      setDisplayName(e.target.value.split("@")[0]);
    }
  }

  function handleDisplayNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDisplayName(e.target.value);
    setAutoFill(false);
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-sm space-y-6 px-4">
        <h1 className="text-2xl font-semibold text-center">Create account</h1>

        <form action={action} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              onChange={handleEmailChange}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="displayName" className="block text-sm font-medium">
              Display name{" "}
              <span className="text-zinc-500 font-normal">(optional)</span>
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="nickname"
              value={displayName}
              onChange={handleDisplayNameChange}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-400">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            {pending ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="text-white underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

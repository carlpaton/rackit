"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, LogOut } from "lucide-react";

type Props = {
  isLoggedIn: boolean;
  displayName: string | null;
  logoutAction: () => Promise<void>;
};

export function MobileNav({ isLoggedIn, displayName, logoutAction }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center size-9 text-chalk/70 hover:text-chalk transition-colors"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          {/* dropdown */}
          <div className="absolute right-4 top-14 z-50 min-w-44 bg-surface border border-white/10 rounded-xl shadow-xl py-2 flex flex-col">
            <NavLink href={isLoggedIn ? "/dashboard" : "/"} onClick={() => setOpen(false)}>
              Dashboard
            </NavLink>
            <NavLink href="/how-it-works" onClick={() => setOpen(false)}>
              How it works
            </NavLink>
            <NavLink href="/glossary" onClick={() => setOpen(false)}>
              Glossary
            </NavLink>
            <NavLink href="/rules" onClick={() => setOpen(false)}>
              Rules
            </NavLink>
            {isLoggedIn && (
              <NavLink href="/rankings" onClick={() => setOpen(false)}>
                Rankings
              </NavLink>
            )}
            <NavLink href="/suggestions" onClick={() => setOpen(false)}>
              Suggestions
            </NavLink>
            {isLoggedIn ? (
              <>
                {displayName && (
                  <div className="px-4 py-2 text-sm text-chalk/50 border-t border-white/10 mt-1 pt-3">
                    {displayName}
                  </div>
                )}
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-chalk hover:bg-white/5 transition-colors"
                  >
                    <LogOut className="size-4" />
                    Log out
                  </button>
                </form>
              </>
            ) : (
              <NavLink href="/login" onClick={() => setOpen(false)}>
                Sign in
              </NavLink>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function NavLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="px-4 py-2 text-sm text-chalk/70 hover:text-chalk hover:bg-white/5 transition-colors"
    >
      {children}
    </Link>
  );
}

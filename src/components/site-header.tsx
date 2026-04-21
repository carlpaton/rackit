import { auth, signOut } from "@/auth";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export async function SiteHeader() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const displayName =
    session?.user?.displayName ?? session?.user?.email?.split("@")[0] ?? null;

  const logoutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  return (
    <header className="bg-surface border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href={isLoggedIn ? "/dashboard" : "/"}
          className="font-heading text-xl text-chalk hover:text-gold transition-colors"
        >
          Rackit
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/how-it-works"
            className="text-sm text-chalk/60 hover:text-chalk transition-colors"
          >
            How it works
          </Link>
          <Link
            href="/glossary"
            className="text-sm text-chalk/60 hover:text-chalk transition-colors"
          >
            Glossary
          </Link>
          {isLoggedIn && (
            <Link
              href="/rankings"
              className="text-sm text-chalk/60 hover:text-chalk transition-colors"
            >
              Rankings
            </Link>
          )}
          {isLoggedIn ? (
            <>
              {displayName && (
                <span className="text-sm text-chalk">{displayName}</span>
              )}
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-chalk transition-colors"
                >
                  <LogOut className="size-4" />
                  Log out
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className={buttonVariants({ size: "sm" })}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

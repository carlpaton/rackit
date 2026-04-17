import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut } from "lucide-react";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const displayName = session.user.displayName ?? session.user.email ?? "User";

  const logoutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  return (
    <>
      <header className="bg-surface border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/dashboard"
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
            <span className="text-sm text-chalk">{displayName}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-chalk transition-colors"
              >
                <LogOut className="size-4" />
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </>
  );
}

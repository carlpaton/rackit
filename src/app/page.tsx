import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-5xl mx-auto px-4 py-12 text-center space-y-6">
          <h1 className="text-5xl tracking-tight text-gold">Rackit</h1>
          <p className="text-chalk/70 text-lg">Pool tournament management</p>
          <Link href="/login" className={buttonVariants({ size: "lg" })}>
            Sign in
          </Link>
        </div>
      </main>
    </div>
  );
}

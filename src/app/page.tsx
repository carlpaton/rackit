import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="max-w-5xl mx-auto px-4 py-12 text-center space-y-6">
        <h1 className="text-5xl tracking-tight text-gold">Rackit</h1>
        <p className="text-chalk/70 text-lg">Pool tournament management</p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/login" className={buttonVariants({ size: "lg" })}>
            Sign in
          </Link>
          <Link
            href="/how-it-works"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            How it works
          </Link>
        </div>
      </div>
    </div>
  );
}

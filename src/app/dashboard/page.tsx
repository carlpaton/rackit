import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-zinc-400 text-sm">Signed in as {session?.user?.email}</p>
      </div>
    </div>
  );
}

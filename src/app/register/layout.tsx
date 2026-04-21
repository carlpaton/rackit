import { SiteHeader } from "@/components/site-header";

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      {children}
    </div>
  );
}

import { SiteHeader } from "@/components/site-header";

export default function LoginLayout({
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

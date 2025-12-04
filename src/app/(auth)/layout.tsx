import { stackServerApp } from "@/stack";
import { redirect } from "next/navigation";
import { Sidebar, Header, MobileNav } from "@/components/layout";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await stackServerApp.getUser();

  if (!user) {
    redirect("/handler/sign-in");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Sidebar />
      <div className="lg:pl-60">
        <Header />
        <main className="px-4 py-6 pb-20 lg:px-6 lg:pb-6">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}

import { stackServerApp } from "@/stack";
import { redirect } from "next/navigation";
import { AuthLayoutClient } from "@/components/layout/AuthLayoutClient";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await stackServerApp.getUser();

  if (!user) {
    redirect("/handler/sign-in");
  }

  return <AuthLayoutClient>{children}</AuthLayoutClient>;
}

import { AuthEntryRedirect } from "@/modules/auth/AuthEntryRedirect";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthEntryRedirect>
      <main className="flex min-h-[100svh] w-full flex-1 flex-col">{children}</main>
    </AuthEntryRedirect>
  );
}

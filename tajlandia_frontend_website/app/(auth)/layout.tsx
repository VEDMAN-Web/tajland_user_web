export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <main className="flex min-h-[100svh] w-full flex-1 flex-col">{children}</main>;
}

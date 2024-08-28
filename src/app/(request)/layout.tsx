export const metadata = {
  title: "Domain Registrar",
  description: "Powered by ICTA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

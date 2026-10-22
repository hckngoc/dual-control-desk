import { Providers } from "./providers";
import "./globals.css";
export const metadata = {
  title: "Dual Control · Expense Desk",
  description:
    "Two independent approvals. No unilateral authority. Built with TideCloak.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

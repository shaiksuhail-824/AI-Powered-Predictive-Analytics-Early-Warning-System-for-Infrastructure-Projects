import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Project Monitoring | MoSPI",
  description: "AI-powered predictive and explainable infrastructure project monitoring platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased min-h-screen text-text-primary bg-background`}>
        {children}
      </body>
    </html>
  );
}

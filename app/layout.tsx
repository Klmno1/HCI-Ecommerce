import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { CartProvider } from "@/components/providers/cart-provider";
import { ExperimentProvider } from "@/components/providers/experiment-provider";

export const metadata: Metadata = {
  title: "Interface A",
  description: "CSV driven ecommerce storefront demo built with Next.js"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>
        <ThemeProvider>
          <ExperimentProvider>
            <CartProvider>{children}</CartProvider>
          </ExperimentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

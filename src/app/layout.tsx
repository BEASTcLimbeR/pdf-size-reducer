import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/rtl.css";
import ErrorBoundary from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DocNestly - All PDF Tools in One Place",
  description: "Complete PDF toolkit with compress, merge, split, convert, edit, and secure PDFs. 100% free, secure, and easy to use. No registration required.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        <html lang="en" className="dark">
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  try {
                    const theme = localStorage.getItem('theme');
                    if (theme === 'light') {
                      document.documentElement.classList.remove('dark');
                    } else {
                      document.documentElement.classList.add('dark');
                    }
                  } catch (e) {
                    // Default to dark mode
                    document.documentElement.classList.add('dark');
                  }
                `,
              }}
            />
          </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}

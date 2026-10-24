import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "../lib/contract";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "CertChain — Soulbound Academic Credentials",
  description:
    "Verify tamper-proof academic credentials issued as non-transferable NFTs on Ethereum. Paste a token ID and check it against the blockchain.",
  openGraph: {
    title: "CertChain — Soulbound Academic Credentials",
    description: "Verify tamper-proof academic credentials directly against the blockchain.",
    siteName: "CertChain",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

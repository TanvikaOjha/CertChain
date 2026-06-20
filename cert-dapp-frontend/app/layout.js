// app/layout.js
import "./globals.css";
// import { SITE_URL } from "../lib/contract";

export const metadata = {
  // metadataBase: new URL(SITE_URL),
  title: "CertChain — On-Chain Credential Registry",
  description: "Verify any academic certificate instantly against the Ethereum blockchain. No trust required.",
  openGraph: {
    title: "CertChain — On-Chain Credential Registry",
    description: "Verify any academic certificate instantly against the Ethereum blockchain.",
    siteName: "CertChain",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CertChain — On-Chain Credential Registry",
    description: "Verify any academic certificate instantly against the Ethereum blockchain.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
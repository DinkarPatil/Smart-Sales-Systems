import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "SalesRAG",
  description: "Answer customer questions faster with AI-powered help",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

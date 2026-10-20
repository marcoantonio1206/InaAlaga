import { Nunito } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/i18n";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

export const metadata = {
  title: "InaAlaga",
  description: "Fictional demonstration only",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="antialiased">
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
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
        <LangProvider>
          <div className="mx-auto min-h-dvh w-full max-w-[430px] bg-brand-50 shadow-xl">
            {children}
          </div>
        </LangProvider>
      </body>
    </html>
  );
}
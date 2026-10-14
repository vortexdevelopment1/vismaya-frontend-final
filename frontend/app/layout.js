import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { WorkflowProvider } from "@/lib/shared/workflowStore";
import { AuthProvider } from "@/context/AuthContext";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-heading",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-body",
});

export const metadata = {
  title: "Vismaya - Casting & Talent Platform",
  description: "Unified premium casting and talent management platform connecting talent, recruiters, and casting directors.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${inter.variable}`}>
      <body>
        <WorkflowProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </WorkflowProvider>
      </body>
    </html>
  );
}

import "./globals.css";
import { WorkflowProvider } from "@/lib/shared/workflowStore";
import { AuthProvider } from "@/context/AuthContext";
import BackendWakeupPing from "@/components/shared/BackendWakeupPing";

export const metadata = {
  title: "Vismaya - Casting & Talent Platform",
  description: "Unified premium casting and talent management platform connecting talent, recruiters, and casting directors.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <BackendWakeupPing />
        <WorkflowProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </WorkflowProvider>
      </body>
    </html>
  );
}

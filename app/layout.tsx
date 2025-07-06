// app/layout.tsx
import "./globals.css"; // or whatever your global CSS is
import { LanguageProvider } from "@/contexts/LanguageContext";

export const metadata = {
  title: "Your Site",
  description: "Your description",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}

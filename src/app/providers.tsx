"use client";

// Next
import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
// Controllers
import { useSettingsController } from "@/core/controllers";
// Models
import { THEMES } from "@/core/models";

// Rendered inside <body>: ThemeProvider injects a <script>, and one as a child of <html> breaks hydration.
export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useSettingsController.persist.rehydrate();
  }, []);

  return (
    <ThemeProvider attribute="class" themes={Object.keys(THEMES)} defaultTheme="charcoal" enableSystem={false} disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}

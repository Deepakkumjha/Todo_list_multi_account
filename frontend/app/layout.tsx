import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = { title: "Focus Todo", description: "A private, multi-account todo list" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

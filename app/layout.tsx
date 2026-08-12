import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BIG3 セットビルダー",
  description: "ベンチプレス・スクワット・デッドリフトの1RMからトレーニングセットを自動計算します。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

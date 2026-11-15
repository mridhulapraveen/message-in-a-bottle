import type { Metadata } from "next";
import { IM_Fell_English, Pirata_One } from "next/font/google";
import { Silkscreen } from "next/font/google";
import { headers } from "next/headers";

import { SeaLife } from "@/components/SeaLife";
import { PlankHeader } from "@/components/ui/PlankHeader";
import { currentUser } from "@/lib/auth";

import "./globals.css";

const fell = IM_Fell_English({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-fell",
});

const pirata = Pirata_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pirata",
});

const pixel = Silkscreen({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pixel",
});

const BUBBLES = [
  { left: "8%", size: 14, duration: "16s", delay: "0s" },
  { left: "22%", size: 8, duration: "12s", delay: "3s" },
  { left: "38%", size: 20, duration: "20s", delay: "6s" },
  { left: "55%", size: 10, duration: "14s", delay: "1s" },
  { left: "68%", size: 16, duration: "18s", delay: "8s" },
  { left: "82%", size: 9, duration: "13s", delay: "4s" },
  { left: "93%", size: 18, duration: "22s", delay: "10s" },
];

export const metadata: Metadata = {
  title: "Friends in a Bottle",
  description: "Answer a short daily prompt with a video or audio message and stay close to your crew.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (pathname === "/frame") {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }

  const user = await currentUser();

  return (
    <html lang="en" className={`${fell.variable} ${pirata.variable} ${pixel.variable}`}>
      <body>
        <div className="bubbles" aria-hidden="true">
          {BUBBLES.map((bubble) => (
            <span
              key={bubble.left}
              style={{
                left: bubble.left,
                width: bubble.size,
                height: bubble.size,
                animationDuration: bubble.duration,
                animationDelay: bubble.delay,
              }}
            />
          ))}
        </div>
        <SeaLife />
        <div className="waves" aria-hidden="true">
          <div className="wave w2" />
          <div className="wave w1" />
        </div>
        <div className="page">
          <PlankHeader user={user} />
          {children}
        </div>
      </body>
    </html>
  );
}

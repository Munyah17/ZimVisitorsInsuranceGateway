import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppButton } from "@/components/whatsapp-button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Hola Amigo Travelmate",
    template: "%s · Hola Amigo Travelmate",
  },
  description:
    "Travel Zimbabwe with confidence. Instant visitor medical and emergency insurance, issued in minutes and verified anywhere.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/*
          Crash-proof scroll-reveal driver. Runs before paint, independent
          of the React bundle: if the app JS fails on an old device or an
          in-app browser, this never hides content, so the page still shows.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
if(!('IntersectionObserver' in window))return;
document.documentElement.classList.add('reveal-ready');
var init=function(){
var els=[].slice.call(document.querySelectorAll('[data-reveal]'));
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('reveal-in');io.unobserve(e.target);}});},{rootMargin:'-40px 0px'});
els.forEach(function(el){
var p=el.closest('[data-stagger]');
if(p&&!el.style.transitionDelay){var sibs=[].slice.call(p.querySelectorAll('[data-reveal]'));el.style.transitionDelay=(sibs.indexOf(el)*0.12)+'s';}
io.observe(el);});
setTimeout(function(){els.forEach(function(el){el.classList.add('reveal-in');});},3000);
};
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}
}catch(e){}})();`,
          }}
        />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <WhatsAppButton />
      </body>
    </html>
  );
}

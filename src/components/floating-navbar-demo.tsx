"use client";

import * as React from "react";
import { Home, Mail, User } from "lucide-react";
import { FloatingNav } from "@/components/ui/floating-navbar";

export default function FloatingNavDemo() {
  const navItems = [
    {
      name: "Home",
      link: "/",
      icon: <Home className="h-4 w-4 text-neutral-500 dark:text-white" />,
    },
    {
      name: "About",
      link: "#about",
      icon: <User className="h-4 w-4 text-neutral-500 dark:text-white" />,
    },
    {
      name: "Contact",
      link: "#contact",
      icon: <Mail className="h-4 w-4 text-neutral-500 dark:text-white" />,
    },
  ];

  return (
    <div className="relative w-full translate-z-0">
      <FloatingNav navItems={navItems} />
      <DummyContent />
    </div>
  );
}

function DummyContent() {
  return (
    <div className="relative grid h-[40rem] w-full grid-cols-1 rounded-md border border-neutral-200 bg-white dark:border-white/[0.2] dark:bg-black">
      <p className="mt-40 text-center text-4xl font-bold text-neutral-600 dark:text-white">
        Scroll back up to reveal Navbar
      </p>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.06)_1px,transparent_1px)] bg-[size:32px_32px] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)]" />
    </div>
  );
}

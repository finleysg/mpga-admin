"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { cn } from "../lib/utils";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "./ui/navigation-menu";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "./ui/sheet";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Tournaments", href: "/tournaments" },
  { label: "Match Play", href: "/match-play" },
  { label: "Members", href: "/members" },
  { label: "News", href: "/news" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 bg-primary-900 text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Left: MPGA branding */}
        <Link
          href="/"
          className="font-heading text-3xl text-white hover:text-primary-100 transition-colors"
        >
          MPGA
        </Link>

        {/* Right side container */}
        <div className="flex items-center">
          {/* Desktop navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {navItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:bg-primary-700 focus:outline-none",
                        pathname === item.href && "bg-primary-700",
                      )}
                    >
                      {item.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Mobile hamburger menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="md:hidden p-2 rounded-md hover:bg-primary-700 transition-colors">
              <Menu className="h-6 w-6 text-white" />
              <span className="sr-only">Open navigation menu</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <nav className="flex flex-col space-y-4 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "text-lg font-medium text-primary-900 hover:text-primary-600 transition-colors py-2",
                      pathname === item.href &&
                        "text-primary-600 font-semibold",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

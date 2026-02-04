"use client";

import Image from "next/image";
import Link from "next/link";

import { Button } from "../ui/button";

export interface HeroSlideProps {
  type: "logo" | "tournament";
  imageUrl: string;
  title?: string;
  subtitle?: string;
  dates?: string;
  venue?: string;
  ctaUrl?: string;
  ctaText?: string;
}

export function HeroSlide({
  type,
  imageUrl,
  title,
  subtitle,
  dates,
  venue,
  ctaUrl,
  ctaText = "Learn More",
}: HeroSlideProps) {
  return (
    <div className="flex h-[400px] w-full overflow-hidden rounded-lg md:h-[500px]">
      {/* Left: Image (66%) */}
      <div className="relative w-2/3">
        <Image
          src={imageUrl}
          alt={title || "MPGA"}
          fill
          className={type === "logo" ? "object-contain" : "object-cover"}
          priority
        />
      </div>

      {/* Right: Content (34%) */}
      <div className="flex w-1/3 flex-col justify-center bg-secondary-500 p-6 text-white">
        {type === "logo" ? (
          <>
            <h1 className="mb-4 text-2xl font-bold leading-tight md:text-3xl">
              Minnesota Public Golf Association
            </h1>
            <p className="text-lg text-secondary-100 md:text-xl">
              Promoting public golf since 1923
            </p>
          </>
        ) : (
          <>
            <h2 className="mb-2 text-xl font-bold leading-tight md:text-2xl">
              {title}
            </h2>
            {subtitle && (
              <p className="mb-4 text-sm text-secondary-200">{subtitle}</p>
            )}
            {dates && (
              <p className="mb-1 text-base font-medium text-secondary-100">
                {dates}
              </p>
            )}
            {venue && (
              <p className="mb-6 text-sm text-secondary-200">{venue}</p>
            )}
            {ctaUrl && (
              <Link href={ctaUrl}>
                <Button
                  variant="outline"
                  className="border-white bg-transparent text-white hover:bg-white hover:text-secondary-500"
                >
                  {ctaText}
                </Button>
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}

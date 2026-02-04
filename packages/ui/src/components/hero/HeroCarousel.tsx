"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";

import { HeroSlide, type HeroSlideProps } from "./HeroSlide";
import { cn } from "../../lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "../ui/carousel";

export interface HeroCarouselProps {
  slides: HeroSlideProps[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const scrollTo = React.useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api],
  );

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = React.useCallback(() => {
    api?.scrollNext();
  }, [api]);

  return (
    <div className="relative mx-auto max-w-7xl overflow-hidden px-6">
      <Carousel
        setApi={setApi}
        opts={{
          loop: true,
        }}
        className="w-full overflow-hidden"
      >
        <CarouselContent className="-ml-0">
          {slides.map((slide, index) => (
            <CarouselItem key={index} className="pl-0">
              <HeroSlide {...slide} />
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Arrow Navigation */}
        <button
          onClick={scrollPrev}
          className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-800 shadow-md transition-colors hover:bg-white"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        {/* Position next arrow at right edge of image area (66% width) */}
        <button
          onClick={scrollNext}
          className="absolute right-[calc(33.333%+1rem)] top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-800 shadow-md transition-colors hover:bg-white"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Dot Indicators - positioned at bottom center of image area */}
        <div className="absolute bottom-4 left-0 z-10 flex w-2/3 justify-center gap-2">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={cn(
                "h-2.5 w-2.5 rounded-full transition-colors",
                current === index
                  ? "bg-white"
                  : "bg-white/50 hover:bg-white/75",
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
}

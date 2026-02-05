"use client";

import { Camera } from "lucide-react";
import * as React from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "./ui/carousel";
import { cn } from "../lib/utils";

export interface PhotoItem {
  id: number;
  imageUrl: string;
  caption: string;
  year?: number;
}

export interface PhotoCarouselProps {
  photos: PhotoItem[];
  autoRotateInterval?: number;
}

export function PhotoCarousel({
  photos,
  autoRotateInterval = 15000,
}: PhotoCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

  React.useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  React.useEffect(() => {
    if (!api || photos.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, autoRotateInterval);

    return () => clearInterval(interval);
  }, [api, photos.length, isPaused, autoRotateInterval]);

  if (photos.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Camera className="mb-2 h-12 w-12" />
          <p className="text-sm">No photos available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg bg-white shadow-sm"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <Carousel setApi={setApi} opts={{ loop: true }} className="relative">
        <CarouselContent>
          {photos.map((photo) => (
            <CarouselItem key={photo.id}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-gray-100">
                <img
                  src={photo.imageUrl}
                  alt={photo.caption}
                  className="h-full w-full object-contain"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {photos.length > 1 && (
          <>
            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white" />
            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white" />
          </>
        )}
      </Carousel>

      <div className="p-4">
        <p className="text-sm text-gray-700">
          {photos[current]?.caption}
          {photos[current]?.year && (
            <span className="ml-1 text-gray-500">({photos[current].year})</span>
          )}
        </p>

        {photos.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  index === current
                    ? "bg-primary-600"
                    : "bg-gray-300 hover:bg-gray-400",
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

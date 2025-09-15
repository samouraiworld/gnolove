'use client';

import React, { useMemo } from 'react';

import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';

import { cn } from '@/utils/style';

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel';

export interface ResponsiveCarouselProps {
  id?: string;
  className?: string;
  items: React.ReactNode[];
}

const ResponsiveCarousel: React.FC<ResponsiveCarouselProps> = ({ className, items }) => {
  const plugins = useMemo(() => [WheelGesturesPlugin()], []);

  return (
    <div className={cn(className, 'select-none')}>
      <Carousel
        opts={{ align: 'start', dragFree: true, containScroll: 'trimSnaps', loop: false }}
        plugins={plugins}
      >
        <CarouselContent>
          {items.map((item, index) => (
            <CarouselItem className="sm:basis-1/3" key={index}>{item}</CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
};

export default ResponsiveCarousel;

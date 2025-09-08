'use client';

import React, { useMemo } from 'react';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import { Carousel, CarouselContent, CarouselItem } from '../ui/carousel';
import { cn } from '@/utils/style';

export interface ResponsiveCarouselProps {
  id?: string;
  className?: string;
  items: React.ReactNode[];
}

const ResponsiveCarousel: React.FC<ResponsiveCarouselProps> = ({
  className,
  items
}) => {
  const wheelPlugin = useMemo(() => WheelGesturesPlugin(), []);

  return (
    <div className={cn(className, 'select-none')}>
      <Carousel opts={{ align: 'start', dragFree: true, containScroll: 'trimSnaps', loop: false }} plugins={[wheelPlugin]}>
        <CarouselContent>
          {items.map((item, index) => (
            <CarouselItem key={index}>{item}</CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default ResponsiveCarousel;

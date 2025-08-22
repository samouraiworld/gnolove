'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { Box, Flex, IconButton } from '@radix-ui/themes';
import { cn } from '@/utils/style';
import useEmblaCarousel from 'embla-carousel-react';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';

export interface ResponsiveCarouselProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  /** How many items to advance when pressing arrows */
  itemsPerScroll?: number;
  /** Show chevrons on sm+ screens */
  showArrows?: boolean;
}

/**
 * ResponsiveCarousel
 * A tiny wrapper around Embla that provides:
 * - Horizontal drag + inertia on desktop/tablet.
 * - Chevron navigation and keyboard left/right.
 *
 * Usage expectations for children:
 * - Pass a single container element (e.g., Radix `Flex`) as the first child.
 *   Embla treats that container as the track, and its direct children as slides.
 * - On sm+ breakpoints, make the track horizontal and prevent wrapping.
 * - Give each slide a fixed, non-shrinking width (e.g., `flex-[0_0_auto] sm:min-w-[280px]`).
 *
 * Example:
 * <ResponsiveCarousel itemsPerScroll={2}>
 *   <Flex direction={{ initial: 'column', sm: 'row' }} wrap={{ initial: 'nowrap', sm: 'nowrap' }} gap="3">
 *     <Box className="sm:snap-start flex-[0_0_auto] sm:min-w-[280px]">...</Box>
 *     <Box className="sm:snap-start flex-[0_0_auto] sm:min-w-[280px]">...</Box>
 *   </Flex>
 * </ResponsiveCarousel>
 */
const ResponsiveCarousel: React.FC<ResponsiveCarouselProps> = ({
  id,
  children,
  className,
  itemsPerScroll = 2,
  showArrows = true,
}) => {
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', dragFree: true, containScroll: 'trimSnaps', loop: false }, [WheelGesturesPlugin()]);

  // track button enabled state via Embla events
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setCanLeft(emblaApi.canScrollPrev());
      setCanRight(emblaApi.canScrollNext());
    };
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);
    onSelect();
    return () => {
      emblaApi.off('reInit', onSelect);
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  const scrollByItems = useCallback((dir: 'left' | 'right') => {
    if (!emblaApi) return;
    for (let i = 0; i < itemsPerScroll; i += 1) {
      if (dir === 'left') emblaApi.scrollPrev();
      else emblaApi.scrollNext();
    }
  }, [emblaApi, itemsPerScroll]);

  return (
    <Box className={cn(className, 'select-none')}>
      <Flex align="center" gap="2">
        {showArrows && (
          <Box className="hidden sm:block">
            <IconButton aria-label="Scroll left" onClick={() => scrollByItems('left')} disabled={!canLeft} variant="soft" size="2">
              <ChevronLeftIcon />
            </IconButton>
          </Box>
        )}

        <Box
          ref={emblaRef}
          id={id}
          role="region"
          aria-label="carousel scroller"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); scrollByItems('left'); }
            else if (e.key === 'ArrowRight') { e.preventDefault(); scrollByItems('right'); }
          }}
          className={'outline-none focus-visible:ring-2 focus-visible:ring-blue-9 overflow-hidden sm:scroll-p-3 flex-1'}
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        >
          {/* Children should render a track. On sm+, Embla uses first child as container and its children as slides. */}
          {children}
        </Box>

        {showArrows && (
          <Box className="hidden sm:block">
            <IconButton aria-label="Scroll right" onClick={() => scrollByItems('right')} disabled={!canRight} variant="soft" size="2">
              <ChevronRightIcon />
            </IconButton>
          </Box>
        )}
      </Flex>
    </Box>
  );
};

export default ResponsiveCarousel;

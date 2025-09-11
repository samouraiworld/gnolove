'use client';

import PreservingLink from '@/components/elements/preserving-link';

import { Button } from '@/components/ui/button';

export default function GlobalNotFound() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Page not found</h1>
      </div>
      <p className="text-muted-foreground text-sm">
        The page you are looking for doesn&apos;t exist or may have been moved.
      </p>
      <div className="flex gap-2">
        <Button asChild>
          <PreservingLink href="/">Go to homepage</PreservingLink>
        </Button>
      </div>
    </div>
  );
}

export const hasClerkKeys =
  process.env.NODE_ENV === 'development' &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.CLERK_SECRET_KEY;
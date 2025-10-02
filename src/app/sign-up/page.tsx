import { Box } from '@radix-ui/themes';
import { SignUp } from '@clerk/nextjs';
import { isClerkEnabled } from '@/utils/clerk';
import { redirect } from 'next/navigation';

export default function Page() {
  if (!isClerkEnabled) {
    redirect('/');
  }

  return (
    <Box p="5" pt="9">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </Box>
  );
}

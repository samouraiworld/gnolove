import { Box } from '@radix-ui/themes';
import { SignIn } from '@clerk/nextjs';
import { hasClerkKeys } from '@/utils/clerk';
import { redirect } from 'next/navigation';

export default function Page() {
  if (!hasClerkKeys) {
    redirect('/');
  }

  return (
    <Box p="5" pt="9">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </Box>
  );
}

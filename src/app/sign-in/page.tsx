import { Box } from '@radix-ui/themes';
import { SignIn } from '@clerk/nextjs';

export default function Page() {
  return (
    <Box p="5" pt="9">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </Box>
  );
}

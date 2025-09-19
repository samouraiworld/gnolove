import { Box } from '@radix-ui/themes';
import { SignUp } from '@clerk/nextjs';

export default function Page() {
  return (
    <Box p="5" pt="9">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </Box>
  );
}

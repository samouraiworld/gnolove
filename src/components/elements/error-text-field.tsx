import { ElementRef, forwardRef } from 'react';

import { Text, TextField } from '@radix-ui/themes';
import { FieldError } from 'react-hook-form';

import { cn } from '@/util/style';

export type ErrorTextFieldElement = ElementRef<'input'>;

export interface IProps extends TextField.RootProps {
  error: FieldError | undefined;
}

const ErrorTextField = forwardRef<ErrorTextFieldElement, IProps>(({ error, className, ...props }, ref) => (
  <>
    <TextField.Root ref={ref} className={cn(error && 'error', className)} {...props} />
    {error && (
      <Text size="1" color="red">
        {error.message}
      </Text>
    )}
  </>
));
ErrorTextField.displayName = 'ErrorTextField';

export default ErrorTextField;

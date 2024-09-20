import { ElementRef, forwardRef } from 'react';

import { Text, TextArea, TextAreaProps } from '@radix-ui/themes';
import { FieldError } from 'react-hook-form';

import { cn } from '@/util/style';

interface IProps extends TextAreaProps {
  error: FieldError | undefined;
}

const ErrorTextArea = forwardRef<ElementRef<'textarea'>, IProps>(({ error, className, ...props }, ref) => (
  <>
    <TextArea ref={ref} className={cn(error && 'error', className)} {...props} />
    {error && (
      <Text size="1" color="red">
        {error.message}
      </Text>
    )}
  </>
));
ErrorTextArea.displayName = 'ErrorTextarea';

export default ErrorTextArea;

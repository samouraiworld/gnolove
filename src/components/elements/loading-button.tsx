import { Button, ButtonProps } from '@radix-ui/themes';
import { Loader2Icon } from 'lucide-react';

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
}

const LoadingButton = ({ isLoading, children, disabled, ...props }: LoadingButtonProps) => (
  <Button {...props} disabled={disabled || isLoading}>
    {children}
    {isLoading && <Loader2Icon size={18} className="animate-spin" />}
  </Button>
);

export default LoadingButton;

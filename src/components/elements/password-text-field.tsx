'use client';

import { forwardRef, useState } from 'react';

import { EyeClosedIcon, EyeOpenIcon } from '@radix-ui/react-icons';
import { TextField } from '@radix-ui/themes';

import ErrorTextField, { ErrorTextFieldElement, IProps as IErrorTextFieldProps } from '@/element/error-text-field';

interface IProps extends Omit<IErrorTextFieldProps, 'type' | 'children'> {}

const PasswordTextField = forwardRef<ErrorTextFieldElement, IProps>(({ ...props }: IProps, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => setShowPassword((value) => !value);

  return (
    <ErrorTextField {...props} type={showPassword ? 'text' : 'password'} ref={ref}>
      <TextField.Slot />
      <TextField.Slot className="cursor-pointer" onClick={handleClickShowPassword}>
        {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
      </TextField.Slot>
    </ErrorTextField>
  );
});
PasswordTextField.displayName = 'PasswordTextField';

export default PasswordTextField;

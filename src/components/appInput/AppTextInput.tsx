import React from "react";
import { InputWrapper, InputShell, HelperText, AppInputLabel } from "./AppInput";

interface Props {
  label?: string;
  description?: string | React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const AppTextInput = ({
  label,
  description,
  value,
  onChange,
  required,
  disabled,
  placeholder,
}: Props) => (
  <InputWrapper>
    <AppInputLabel label={label} required={required} />
    <InputShell>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
      />
    </InputShell>
    {description && <HelperText>{description}</HelperText>}
  </InputWrapper>
);

import React from "react";
import { InputWrapper, InputShell, HelperText, AppInputLabel } from "./AppInput";

interface Props {
  label?: string;
  description?: string | React.ReactNode;
  value: number | undefined;
  onChange: (value: number) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const AppNumberInput = ({
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
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        placeholder={placeholder}
      />
    </InputShell>
    {description && <HelperText>{description}</HelperText>}
  </InputWrapper>
);

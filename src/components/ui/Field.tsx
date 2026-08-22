import { useId, type ReactNode } from 'react';

interface BaseProps {
  label: string;
  hint?: string;
}

interface NumberFieldProps extends BaseProps {
  value: number | '';
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  /** Permite vaciar el campo, que se reporta como `null`. */
  nullable?: boolean;
}

export function NumberField({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
  nullable = false,
}: NumberFieldProps) {
  const id = useId();
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="number"
        className="field__input"
        value={value}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        onChange={(event) => {
          const raw = event.target.value;
          if (raw === '') {
            onChange(nullable ? null : 0);
            return;
          }
          onChange(Number(raw));
        }}
      />
      {hint && <p className="field__hint">{hint}</p>}
    </div>
  );
}

interface SelectFieldProps<T extends string> extends BaseProps {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  disabled?: boolean;
}

export function SelectField<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
  disabled,
}: SelectFieldProps<T>) {
  const id = useId();
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="field__input"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && <p className="field__hint">{hint}</p>}
    </div>
  );
}

interface CheckFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function CheckField({ label, checked, onChange, disabled }: CheckFieldProps) {
  const id = useId();
  return (
    <div className="check">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

export function FieldRow({ children, columns = 2 }: { children: ReactNode; columns?: 2 | 3 }) {
  return <div className={`field-row field-row--${columns}`}>{children}</div>;
}

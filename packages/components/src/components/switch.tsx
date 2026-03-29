import * as React from 'react';
import { cn } from '../utils/cn';

export interface SwitchProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  label?: string;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>((props, ref) => {
  const {
    className,
    label,
    id,
    checked,
    onCheckedChange,
    onChange,
    disabled,
    ...restProps
  } = props;
  const switchId = id || React.useId();
  const isChecked = checked ?? false;

  // Destructure restProps to omit attributes that cause React warnings/errors on buttons
  const { type: _type, ...buttonProps } = restProps as any;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    onCheckedChange?.(e.target.checked);
  };

  return (
    <div className="flex items-center">
      <label
        htmlFor={switchId}
        className="relative inline-flex cursor-pointer items-center"
      >
        <input
          type="checkbox"
          id={switchId}
          ref={ref}
          checked={isChecked}
          onChange={handleChange}
          className="peer sr-only"
          disabled={disabled}
        />
        <button
          type="button"
          role="switch"
          aria-checked={isChecked}
          disabled={disabled}
          className={cn(
            'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
            'bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[""] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            className
          )}
          onClick={() => {
            if (!disabled) {
              const newChecked = !isChecked;
              onCheckedChange?.(newChecked);
            }
          }}
          {...buttonProps}
        />
      </label>
      {label && (
        <span className="ml-3 text-sm font-medium text-foreground">
          {label}
        </span>
      )}
    </div>
  );
});
Switch.displayName = 'Switch';

export { Switch };

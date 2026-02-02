import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, rightElement, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              block w-full rounded-lg border bg-white text-foreground
              placeholder:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted
              ${icon ? 'pl-10' : 'pl-3'}
              ${rightElement ? 'pr-10' : 'pr-3'}
              py-2.5
              ${error ? 'border-destructive focus:ring-destructive' : 'border-input'}
              ${className}
            `}
            {...props}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-destructive font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

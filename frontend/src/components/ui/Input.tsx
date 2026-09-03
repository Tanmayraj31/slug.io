import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export function Input({
  label,
  error,
  icon,
  id,
  className = "",
  ...rest
}: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const errorId = inputId ? `${inputId}-error` : undefined;

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-base font-semibold text-gray-800"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400" aria-hidden="true">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          aria-invalid={!!error || undefined}
          aria-describedby={error && errorId ? errorId : undefined}
          className={`input-field w-full rounded-lg px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 ${icon ? "pl-11" : ""} ${error ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""} ${className}`}
          {...rest}
        />
      </div>
      {error && (
        <p id={errorId} className="text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

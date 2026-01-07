import { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, forwardRef } from "react";

// Button
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary";
  size?: "default" | "compact";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "default", className = "", children, disabled, ...props },
    ref
  ) => {
    const base =
      "font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
    const variants = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300",
      secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
      tertiary: "bg-transparent text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
    };
    const sizes = {
      default: "px-4 py-2 text-base",
      compact: "px-3 py-1.5 text-sm",
    };
    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

// Select
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, className = "", ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
);
Select.displayName = "Select";

// Checkbox
interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = "", ...props }, ref) => {
    return (
      <label className={`inline-flex items-center gap-2 cursor-pointer ${className}`}>
        <input
          ref={ref}
          type="checkbox"
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          {...props}
        />
        <span className="text-gray-700">{label}</span>
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

// FormControl
interface FormControlProps {
  label: string;
  caption?: string;
  children: React.ReactNode;
}

export function FormControl({ label, caption, children }: FormControlProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {caption && <p className="mt-1 text-sm text-gray-500">{caption}</p>}
    </div>
  );
}

// Spinner
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600 ${className}`}
    />
  );
}

// Typography
export function HeadingSmall({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>;
}

export function Paragraph({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={`text-base text-gray-600 ${className}`}>{children}</p>;
}

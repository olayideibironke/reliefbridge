import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export function FieldShell({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)} htmlFor={htmlFor}>
      <span className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold text-ink-2">
        {label}
        {required && <span className="text-red">*</span>}
      </span>
      {children}
      {hint && !error && (
        <span className="mt-1.5 block text-[12px] text-ink-3">{hint}</span>
      )}
      {error && (
        <span className="mt-1.5 block text-[12px] font-medium text-red">
          {error}
        </span>
      )}
    </label>
  );
}

const fieldBase =
  "block w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-[14px] text-ink placeholder:text-ink-3 transition focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue disabled:bg-surface-2 disabled:cursor-not-allowed";

export function Input({
  label,
  hint,
  error,
  required,
  className,
  id,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string | null;
}) {
  const inputId = id ?? rest.name;
  return (
    <FieldShell
      label={label}
      htmlFor={inputId}
      required={required}
      hint={hint}
      error={error}
    >
      <input id={inputId} required={required} className={cn(fieldBase, className)} {...rest} />
    </FieldShell>
  );
}

export function Textarea({
  label,
  hint,
  error,
  required,
  className,
  id,
  rows = 4,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string | null;
}) {
  const inputId = id ?? rest.name;
  return (
    <FieldShell
      label={label}
      htmlFor={inputId}
      required={required}
      hint={hint}
      error={error}
    >
      <textarea
        id={inputId}
        required={required}
        rows={rows}
        className={cn(fieldBase, "resize-y", className)}
        {...rest}
      />
    </FieldShell>
  );
}

export function Select({
  label,
  hint,
  error,
  required,
  className,
  id,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}) {
  const inputId = id ?? rest.name;
  return (
    <FieldShell
      label={label}
      htmlFor={inputId}
      required={required}
      hint={hint}
      error={error}
    >
      <select
        id={inputId}
        required={required}
        className={cn(
          fieldBase,
          "appearance-none bg-[length:14px] bg-[right_12px_center] bg-no-repeat pr-9",
          className
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23565C65' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export function Checkbox({
  label,
  hint,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        {...rest}
        className="mt-[3px] h-4 w-4 rounded-[2px] border-line text-blue focus:ring-blue"
      />
      <span className="flex flex-col">
        <span className="text-[14px] font-medium text-ink">{label}</span>
        {hint && <span className="text-[12px] text-ink-3">{hint}</span>}
      </span>
    </label>
  );
}

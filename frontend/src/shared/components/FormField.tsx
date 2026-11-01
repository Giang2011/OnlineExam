import React from 'react';

export interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ label, error, hint, children, className = '', htmlFor }) => {
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-slate-700">
          {label}
        </label>
      ) : null}
      {children}
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : hint ? <p className="mt-1 text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
};

export default FormField;

import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, error, className = '', id, ...props }) => {
  const textareaId = id || props.name;

  return (
    <div>
      {label ? (
        <label htmlFor={textareaId} className="mb-2 block text-sm font-medium text-slate-700">
          {label}
        </label>
      ) : null}
      <textarea
        id={textareaId}
        className={[
          'min-h-28 w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-100',
          error ? 'border-red-500 bg-red-50' : 'border-slate-300 bg-white',
          className,
        ].join(' ')}
        {...props}
      />
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
};

export default Textarea;

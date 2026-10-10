import React, { useState } from 'react';
import { usePasswordInput } from './usePasswordInput.js';

export function AuthField({ id, label, type = 'text', error, hint, required, ...inputProps }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const { inputError, handlers } = usePasswordInput({ value: inputProps.value, onChange: inputProps.onChange, enabled: isPassword });
  const displayedError = inputError || error;
  const descriptionId = displayedError ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-2">
        {label}{required && <span className="text-red-600 ml-1" aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        <input
          {...inputProps}
          {...handlers}
          id={id}
          name={id}
          type={isPassword && showPassword ? 'text' : type}
          required={required}
          aria-invalid={Boolean(displayedError)}
          aria-describedby={descriptionId}
          className={`w-full h-12 px-3.5 ${isPassword ? 'pr-12' : ''} text-base sm:text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 outline-none transition-colors disabled:bg-slate-50 disabled:text-slate-500 ${
            displayedError
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
              : 'border-slate-300 hover:border-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(value => !value)}
            aria-label={`${showPassword ? 'Ẩn' : 'Hiện'} ${label.toLowerCase()}`}
            aria-pressed={showPassword}
            aria-controls={id}
            disabled={inputProps.disabled}
            className="absolute inset-y-0 right-0 w-12 inline-flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-r-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        )}
      </div>
      {(displayedError || hint) && (
        <p id={descriptionId} role={inputError ? 'status' : undefined} className={`text-xs leading-5 mt-1.5 ${displayedError ? 'text-red-600' : 'text-slate-500'}`}>
          {displayedError || hint}
        </p>
      )}
    </div>
  );
}

"use client";

import { useState, type InputHTMLAttributes } from "react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "id"> & { id: string };

export default function PasswordInput({ id, className = "", disabled, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const label = visible ? "Ocultar senha" : "Mostrar senha";

  return <div className="relative w-full">
    <input {...props} id={id} type={visible ? "text" : "password"} disabled={disabled} className={`${className} pr-28`} />
    <button
      type="button"
      onClick={() => setVisible(current => !current)}
      disabled={disabled}
      aria-label={label}
      aria-controls={id}
      aria-pressed={visible}
      className="absolute inset-y-0 right-0 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-r-lg px-3 text-sm font-semibold text-santa-gold hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-santa-gold disabled:opacity-50"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0">
        {visible ? <>
          <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2c.7-.1 1.4-.2 2.1-.2 5.5 0 9 7 9 7a18 18 0 0 1-3.1 4.1M6.2 6.2A20.6 20.6 0 0 0 3 12s3.5 7 9 7c1.8 0 3.4-.7 4.8-1.7" />
        </> : <>
          <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>}
      </svg>
      {visible ? "Ocultar" : "Mostrar"}
    </button>
  </div>;
}

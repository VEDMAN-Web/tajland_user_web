"use client";

import { useState } from "react";
import { GetInTouchPopup } from "./GetInTouchPopup";

function ChatIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="h-7 w-7 shrink-0">
      <path d="M7.5 5.5h15a3 3 0 0 1 3 3v7.8a3 3 0 0 1-3 3h-5.2l-4.4 4v-4H7.5a3 3 0 0 1-3-3V8.5a3 3 0 0 1 3-3Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M11 11.5h8M11 15.5h5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M21.5 20.5h2a3 3 0 0 1 3 3v1.3l-2.5-1.3h-3a3 3 0 0 1-3-3v-.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export function GetInTouchLauncher() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} aria-label="Get In Touch" className="group absolute bottom-16 right-0 z-30 inline-flex h-14 w-14 items-center overflow-hidden rounded-[1.1rem] bg-navy px-3.5 text-white shadow-[0_10px_25px_rgba(11,31,77,0.2)] transition-[width,background-color] duration-300 hover:bg-navy-deep focus-visible:w-[205px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy sm:bottom-[4.5rem] sm:right-0 md:hover:w-[205px] md:hover:justify-start">
        <ChatIcon />
        <span className="max-w-0 whitespace-nowrap text-[17px] opacity-0 transition-[max-width,margin,opacity] duration-300 md:group-hover:ml-3 md:group-hover:max-w-[150px] md:group-hover:opacity-100">Get In Touch →</span>
      </button>
      {isOpen ? <GetInTouchPopup onClose={() => setIsOpen(false)} /> : null}
    </>
  );
}

"use client"

import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="content-container flex flex-col items-center justify-center text-center gap-4 py-24 min-h-[60vh]">
      <h1
        className="text-2xl md:text-3xl font-semibold"
        style={{ color: "var(--brand-primary)" }}
      >
        Something went wrong
      </h1>
      <p className="text-sm text-ui-fg-subtle max-w-md leading-relaxed">
        Sorry, we hit a snag completing that. Please try again — and if it keeps
        happening, get in touch and we&apos;ll sort it out for you.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-full text-sm font-semibold border border-ui-border-base hover:bg-ui-bg-subtle transition-colors"
        >
          Back to home
        </Link>
      </div>

      {error?.digest && (
        <p className="text-[11px] text-ui-fg-muted mt-2">
          Reference: {error.digest}
        </p>
      )}
    </div>
  )
}

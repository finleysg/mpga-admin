"use client";

import { useEffect } from "react";

import { Button } from "./ui/button";

export interface MatchPlaySignUpProps {
  year: number;
  deadline: string;
}

export function MatchPlaySignUp({ year, deadline }: MatchPlaySignUpProps) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://tally.so/widgets/embed.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="rounded-lg border border-primary-200 bg-primary-50 p-6">
      <h2 className="mb-3 text-xl font-bold text-gray-900">
        {year} Match Play Sign Up
      </h2>
      <p className="mb-4 text-gray-700">
        Click the button below to request a team for your club in the {year}{" "}
        match play season.
      </p>
      <p className="mb-6 text-sm text-gray-600">
        Note: close of entries is midnight on {deadline}.
      </p>
      <Button
        data-tally-open="mJXq9K"
        data-tally-width="432"
        data-tally-layout="modal"
        data-tally-overlay="1"
        data-tally-auto-close="0"
      >
        Sign Up for Match Play
      </Button>
    </div>
  );
}

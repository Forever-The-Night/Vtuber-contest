"use client";

import { useEffect } from "react";

export function VotePageScrollReset() {
  useEffect(() => {
    function resetHorizontalScroll() {
      document.documentElement.scrollLeft = 0;
      document.body.scrollLeft = 0;
      window.scrollTo(0, window.scrollY);
    }

    resetHorizontalScroll();
    const frame = window.requestAnimationFrame(resetHorizontalScroll);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return null;
}

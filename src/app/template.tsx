"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Page-level entrance + route transition. Lives in a template (not the layout) so it re-mounts on
 * every navigation, while the header, footer and mobile nav in the layout stay perfectly stable.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 0.68, 0.16, 1] }}
    >
      {children}
    </motion.div>
  );
}

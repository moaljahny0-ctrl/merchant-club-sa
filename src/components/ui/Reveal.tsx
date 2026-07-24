'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';

const EASE = [0.16, 1, 0.3, 1] as const;

type RevealProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Stagger delay in seconds, e.g. index * 0.08 for grids */
  delay?: number;
  /** Distance (px) content travels in from — set 0 to disable the rise, keep the fade */
  y?: number;
};

/**
 * Scroll-triggered fade+rise, once per element. Server components can pass
 * server-rendered children straight through — only this wrapper is a client
 * boundary. Honors prefers-reduced-motion by collapsing to a plain fade.
 */
export function Reveal({ children, className, style, delay = 0, y = 20 }: RevealProps) {
  const reduceMotion = useReducedMotion();

  const variants: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : y },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0.2 : 0.7, delay, ease: EASE },
    },
  };

  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}

type StaggerProps = {
  children: ReactNode;
  className?: string;
  /** Seconds between each direct child's entrance */
  stagger?: number;
};

/**
 * Wraps direct children in stagger timing — pair each child with
 * <StaggerItem> to opt it into the parent's variants.
 */
export function StaggerGroup({ children, className, stagger = 0.12 }: StaggerProps) {
  const reduceMotion = useReducedMotion();

  const container: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: reduceMotion ? 0 : stagger, delayChildren: 0.1 },
    },
  };

  return (
    <motion.div className={className} initial="hidden" animate="visible" variants={container}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, y = 16 }: { children: ReactNode; className?: string; y?: number }) {
  const reduceMotion = useReducedMotion();

  const item: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : y },
    visible: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0.2 : 0.6, ease: EASE } },
  };

  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}

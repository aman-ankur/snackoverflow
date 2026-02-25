"use client";

import { useRef, useState, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowDown } from "lucide-react";

const THRESHOLD = 60;
const MAX_PULL = 100;

interface PullToRefreshProps {
  onRefresh: () => void | Promise<void>;
  children: ReactNode;
  className?: string;
}

export default function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    const container = scrollContainerRef.current;
    if (!container || container.scrollTop > 0) return;
    touchStartY.current = e.touches[0].clientY;
    isPulling.current = true;
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    const container = scrollContainerRef.current;
    if (!container || container.scrollTop > 0) {
      isPulling.current = false;
      setPullDistance(0);
      return;
    }

    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (deltaY < 0) {
      setPullDistance(0);
      return;
    }

    // Dampen the pull with a logarithmic curve
    const dampened = Math.min(MAX_PULL, deltaY * 0.4);
    setPullDistance(dampened);
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(THRESHOLD * 0.6);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, onRefresh]);

  const progress = Math.min(1, pullDistance / THRESHOLD);

  return (
    <div
      ref={scrollContainerRef}
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: pullDistance > 0 ? pullDistance : 36, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: isRefreshing ? 0.2 : 0 }}
            className="flex items-center justify-center overflow-hidden"
          >
            {isRefreshing ? (
              <Loader2 className="h-5 w-5 text-accent animate-spin" />
            ) : (
              <motion.div
                animate={{ rotate: progress >= 1 ? 180 : 0 }}
                transition={{ duration: 0.15 }}
              >
                <ArrowDown className={`h-5 w-5 transition-colors ${progress >= 1 ? "text-accent" : "text-muted"}`} />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </div>
  );
}

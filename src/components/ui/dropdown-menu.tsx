'use client';

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DropdownMenuProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface DropdownMenuTriggerProps {
  children: ReactNode;
  asChild?: boolean;
  className?: string;
}

interface DropdownMenuContentProps {
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

interface DropdownMenuItemProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const DropdownMenuContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
}>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
});

export function DropdownMenu({ 
  children, 
  open: controlledOpen, 
  onOpenChange 
}: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, setOpen]);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({ 
  children, 
  asChild = false, 
  className 
}: DropdownMenuTriggerProps) {
  const { open, setOpen, triggerRef } = React.useContext(DropdownMenuContext);

  const handleClick = () => {
    setOpen(!open);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ref: triggerRef,
      onClick: handleClick,
      className: cn(children.props.className, className),
    });
  }

  return (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      onClick={handleClick}
      className={className}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({ 
  children, 
  align = 'center', 
  side = 'bottom',
  className 
}: DropdownMenuContentProps) {
  const { open } = React.useContext(DropdownMenuContext);

  const getPositionClasses = () => {
    const positions = {
      'top-start': 'bottom-full left-0 mb-1',
      'top-center': 'bottom-full left-1/2 transform -translate-x-1/2 mb-1',
      'top-end': 'bottom-full right-0 mb-1',
      'bottom-start': 'top-full left-0 mt-1',
      'bottom-center': 'top-full left-1/2 transform -translate-x-1/2 mt-1',
      'bottom-end': 'top-full right-0 mt-1',
      'left-start': 'right-full top-0 mr-1',
      'left-center': 'right-full top-1/2 transform -translate-y-1/2 mr-1',
      'left-end': 'right-full bottom-0 mr-1',
      'right-start': 'left-full top-0 ml-1',
      'right-center': 'left-full top-1/2 transform -translate-y-1/2 ml-1',
      'right-end': 'left-full bottom-0 ml-1',
    };
    
    return positions[`${side}-${align}` as keyof typeof positions] || positions['bottom-center'];
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1 }}
          className={cn(
            'absolute z-50',
            'min-w-[8rem]',
            'bg-popover text-popover-foreground',
            'border rounded-md shadow-md',
            'py-1',
            getPositionClasses(),
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function DropdownMenuItem({ 
  children, 
  onClick, 
  disabled = false,
  className 
}: DropdownMenuItemProps) {
  const { setOpen } = React.useContext(DropdownMenuContext);

  const handleClick = () => {
    if (!disabled) {
      onClick?.();
      setOpen(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'relative flex w-full cursor-default select-none items-center',
        'px-2 py-1.5 text-sm outline-none',
        'hover:bg-accent hover:text-accent-foreground',
        'focus:bg-accent focus:text-accent-foreground',
        'disabled:pointer-events-none disabled:opacity-50',
        'text-left',
        className
      )}
    >
      {children}
    </button>
  );
}

export function DropdownMenuLabel({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn('px-2 py-1.5 text-sm font-semibold', className)}>
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return (
    <div className={cn('-mx-1 my-1 h-px bg-muted', className)} />
  );
}
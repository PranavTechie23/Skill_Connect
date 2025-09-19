
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface RadixDropdownMenuDemoProps {
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
  alignOffset?: number;
}

const wrapperVariants = {
  open: {
    opacity: 1,
    scale: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
  closed: {
    opacity: 0,
    scale: 0.9,
    transition: {
      when: "afterChildren",
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  open: {
    opacity: 1,
    y: 0,
  },
  closed: {
    opacity: 0,
    y: -10,
  },
};

export function RadixDropdownMenuDemo({
  side,
  sideOffset,
  align,
  alignOffset,
}: RadixDropdownMenuDemoProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <span>Open</span>
          <motion.span
            animate={open ? { rotate: 180 } : { rotate: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown />
          </motion.span>
        </Button>
      </DropdownMenuTrigger>
      <AnimatePresence>
        {open && (
          <DropdownMenuContent
            forceMount
            align={align}
            alignOffset={alignOffset}
            side={side}
            sideOffset={sideOffset}
            asChild
          >
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={wrapperVariants}
              className="w-56"
            >
              <DropdownMenuLabel asChild>
                <motion.div variants={itemVariants}>My Account</motion.div>
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <motion.div variants={itemVariants}>
                    Profile
                    <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                  </motion.div>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <motion.div variants={itemVariants}>
                    Billing
                    <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
                  </motion.div>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <motion.div variants={itemVariants}>
                    Settings
                    <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                  </motion.div>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <motion.div variants={itemVariants}>
                    Keyboard shortcuts
                    <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
                  </motion.div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <motion.div variants={itemVariants}>Team</motion.div>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger asChild>
                    <motion.div variants={itemVariants}>Invite users</motion.div>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>Email</DropdownMenuItem>
                    <DropdownMenuItem>Message</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>More...</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem asChild>
                  <motion.div variants={itemVariants}>
                    New Team
                    <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
                  </motion.div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <motion.div variants={itemVariants}>GitHub</motion.div>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <motion.div variants={itemVariants}>Support</motion.div>
              </DropdownMenuItem>
              <DropdownMenuItem asChild disabled>
                <motion.div variants={itemVariants}>API</motion.div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <motion.div variants={itemVariants}>
                  Log out
                  <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                </motion.div>
              </DropdownMenuItem>
            </motion.div>
          </DropdownMenuContent>
        )}
      </AnimatePresence>
    </DropdownMenu>
  );
}

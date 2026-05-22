"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "./utils";

/**
 * Tabs Root: Quản lý giá trị tab đang hoạt động.
 */
function Tabs({ className, ...props }) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

/**
 * TabsList: Thanh chứa các nút chuyển đổi (Triggers).
 */
function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-11 w-full items-center justify-center rounded-xl p-1",
        "bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50",
        className,
      )}
      {...props}
    />
  );
}

/**
 * TabsTrigger: Nút bấm để kích hoạt một tab.
 * Có hiệu ứng active tinh tế phù hợp với cả Light và Dark mode.
 */
function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-200 outline-none",
        "focus-visible:ring-2 focus-visible:ring-indigo-500/50 disabled:pointer-events-none disabled:opacity-50",
        // Inactive states
        "text-slate-600 hover:text-slate-900 hover:bg-slate-200/20 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700/30",
        // Active states - Light mode
        "data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-slate-200/50",
        // Active states - Dark mode
        "dark:data-[state=active]:bg-indigo-600 dark:data-[state=active]:text-white dark:data-[state=active]:shadow-md dark:data-[state=active]:border-indigo-500",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className,
      )}
      {...props}
    />
  );
}

/**
 * TabsContent: Phần hiển thị nội dung tương ứng với mỗi tab.
 */
function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
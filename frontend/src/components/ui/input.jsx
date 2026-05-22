import * as React from "react";

import { cn } from "./utils";

/**
 * Input: Thành phần nhập liệu cơ bản.
 * Hỗ trợ đầy đủ các thuộc tính của thẻ <input> tiêu chuẩn.
 */
function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Cấu trúc cơ bản & Màu sắc
        "flex h-9 w-full min-w-0 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3 py-1 text-base text-slate-900 dark:text-slate-100 transition-[color,box-shadow] outline-none md:text-sm",
        // File upload styling
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-900 dark:file:text-slate-100",
        // Placeholder & Selection
        "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        // Trạng thái Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Trạng thái Focus (Vòng ring bao quanh)
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        // Trạng thái Lỗi (Aria-invalid)
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
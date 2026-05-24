import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react";

import { cn } from "./utils";
import { buttonVariants } from "./button";

/**
 * Pagination: Container chính bọc toàn bộ các nút điều hướng.
 */
function Pagination({ className, ...props }) {
  return (
    <nav
      role="navigation"
      aria-label="phân trang"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }) {
  return <li data-slot="pagination-item" {...props} />;
}

/**
 * PaginationLink: Một liên kết số trang cụ thể.
 * Tận dụng `buttonVariants` để đồng bộ UI với hệ thống Button của bạn.
 */
function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size,
        }),
        className,
      )}
      {...props}
    />
  );
}

/**
 * PaginationPrevious: Nút quay lại trang trước.
 */
function PaginationPrevious({ className, ...props }) {
  return (
    <PaginationLink
      aria-label="Đi tới trang trước"
      size="default"
      className={cn("gap-1 px-2.5 sm:pl-2.5", className)}
      {...props}
    >
      <ChevronLeftIcon className="size-4" />
      <span className="hidden sm:block">Trước</span>
    </PaginationLink>
  );
}

/**
 * PaginationNext: Nút đi đến trang sau.
 */
function PaginationNext({ className, ...props }) {
  return (
    <PaginationLink
      aria-label="Đi tới trang sau"
      size="default"
      className={cn("gap-1 px-2.5 sm:pr-2.5", className)}
      {...props}
    >
      <span className="hidden sm:block">Sau</span>
      <ChevronRightIcon className="size-4" />
    </PaginationLink>
  );
}

/**
 * PaginationEllipsis: Hiển thị dấu ba chấm khi có quá nhiều trang.
 */
function PaginationEllipsis({ className, ...props }) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">Còn trang khác</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};

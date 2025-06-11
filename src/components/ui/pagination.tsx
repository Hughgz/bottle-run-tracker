import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // Tạo mảng các trang hiển thị
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    // Luôn hiển thị trang đầu tiên
    pages.push(1);
    
    if (totalPages <= maxPagesToShow) {
      // Nếu tổng số trang nhỏ, hiển thị tất cả
      for (let i = 2; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Hiển thị trang hiện tại và các trang lân cận
      const leftSiblingIndex = Math.max(2, currentPage - 1);
      const rightSiblingIndex = Math.min(totalPages - 1, currentPage + 1);
      
      // Hiển thị dấu ... nếu cần
      if (leftSiblingIndex > 2) {
        pages.push(-1); // -1 đại diện cho dấu ...
      }
      
      // Thêm các trang ở giữa
      for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
        pages.push(i);
      }
      
      // Hiển thị dấu ... nếu cần
      if (rightSiblingIndex < totalPages - 1) {
        pages.push(-2); // -2 đại diện cho dấu ... thứ hai
      }
      
      // Luôn hiển thị trang cuối cùng
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-8 w-8 p-0"
      >
        <span className="sr-only">Trang trước</span>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {getPageNumbers().map((pageNumber, i) => {
        if (pageNumber === -1 || pageNumber === -2) {
          return (
            <Button
              key={`ellipsis-${i}`}
              variant="outline"
              size="sm"
              disabled
              className="h-8 w-8 p-0"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          );
        }
        
        return (
          <Button
            key={pageNumber}
            variant={currentPage === pageNumber ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(pageNumber)}
            className={`h-8 w-8 p-0 ${currentPage === pageNumber ? "pointer-events-none" : ""}`}
          >
            {pageNumber}
          </Button>
        );
      })}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-8 w-8 p-0"
      >
        <span className="sr-only">Trang sau</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

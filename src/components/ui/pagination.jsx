import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "../../lib/utils";
import { buttonVariants } from "./button";

const Pagination = ({ className, ...props }) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  >
    <button className={cn(buttonVariants({ variant: "ghost" }), "rounded-lg")}>
      Previous
    </button>
    <button
      className={cn(buttonVariants({ variant: "ghost" }), "rounded-lg ml-2")}
    >
      Next
    </button>
  </nav>
);

export default Pagination;

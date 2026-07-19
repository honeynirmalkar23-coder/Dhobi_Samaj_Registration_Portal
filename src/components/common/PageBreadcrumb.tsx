import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

type BreadcrumbItem = {
  label: string;
  to?: string;
};

type PageBreadcrumbProps = {
  items?: BreadcrumbItem[];
};

export function PageBreadcrumb({ items = [] }: PageBreadcrumbProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm leading-6 text-brown-700">
        ब्रेडक्रंब आगामी चरण में संदर्भ के अनुसार दिखाया जाएगा।
      </p>
    );
  }

  return (
    <nav aria-label="ब्रेडक्रंब" className="text-sm text-brown-700">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li className="flex items-center gap-2" key={`${item.label}-${index}`}>
              {item.to && !isLast ? (
                <Link className="focus-ring rounded-md hover:text-maroon-800" to={item.to}>
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined}>{item.label}</span>
              )}
              {!isLast ? (
                <ChevronRight aria-hidden="true" className="h-4 w-4 text-brown-700/50" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

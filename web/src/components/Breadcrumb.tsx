import { Link } from "react-router-dom";
import { ChevronRight, HomeIcon } from "./Icons";

export default function Breadcrumb({ path }: { path: string }) {
  const parts = path.split("/").filter(Boolean);
  const crumbs = parts.map((name, i) => ({
    name,
    href: "/files/" + parts.slice(0, i + 1).join("/"),
  }));

  return (
    <nav className="flex items-center gap-1 text-sm text-muted overflow-x-auto whitespace-nowrap py-1">
      <Link to="/" className="flex items-center gap-1 hover:text-text px-2 py-1 rounded">
        <HomeIcon /> Home
      </Link>
      {crumbs.map((c, i) => (
        <span key={c.href} className="flex items-center gap-1">
          <ChevronRight className="w-4 h-4 opacity-50" />
          {i === crumbs.length - 1 ? (
            <span className="text-text px-2 py-1">{c.name}</span>
          ) : (
            <Link to={c.href} className="hover:text-text px-2 py-1 rounded">
              {c.name}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

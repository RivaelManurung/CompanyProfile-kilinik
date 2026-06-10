import Link from "next/link";
import { CalendarDays, Clock, ArrowUpRight } from "lucide-react";
import type { Article } from "@/lib/data";
import { formatDateID } from "@/lib/utils";

export function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/artikel/${article.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-soft transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lift"
    >
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-primary-100 via-primary-50 to-accent-100">
        <div className="bg-dots absolute inset-0 opacity-40 transition-transform duration-700 group-hover:scale-110" />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary-700 shadow-soft backdrop-blur">
          {article.category}
        </span>
        <span className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-primary-600 opacity-0 shadow-soft transition-all duration-500 group-hover:opacity-100">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-bold leading-snug text-ink-900 transition-colors group-hover:text-primary-700">
          {article.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">{article.excerpt}</p>
        <div className="mt-5 flex items-center gap-4 border-t border-ink-100 pt-4 text-xs text-ink-400">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDateID(article.date)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {article.readMins} menit baca
          </span>
        </div>
      </div>
    </Link>
  );
}

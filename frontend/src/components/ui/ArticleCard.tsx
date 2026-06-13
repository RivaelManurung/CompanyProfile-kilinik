import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Clock, ArrowUpRight } from "lucide-react";
import { formatDateID } from "@/lib/utils";

export interface ArticleCardData {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readMins: number;
  cover?: string;
}

export function ArticleCard({ article }: { article: ArticleCardData }) {
  return (
    <Link
      href={`/artikel/${article.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white transition-all duration-500 hover:-translate-y-1.5 hover:border-primary-200 hover:shadow-card"
    >
      <div className="relative h-44 overflow-hidden bg-primary-50">
        {article.cover ? (
          <Image
            src={article.cover}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
          />
        ) : (
          <div className="bg-dots absolute inset-0 opacity-50 transition-transform duration-700 group-hover:scale-110" />
        )}
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary-700 shadow-soft backdrop-blur">
          {article.category}
        </span>
        <span className="absolute right-4 top-4 inline-flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-white/90 text-primary-700 opacity-0 shadow-soft transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-bold leading-snug tracking-tight text-ink-900 transition-colors group-hover:text-primary-700">
          {article.title}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-500">
          {article.excerpt}
        </p>
        <div className="mt-5 flex items-center gap-4 border-t border-ink-100 pt-4 text-xs text-ink-400">
          {article.date && (
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDateID(article.date)}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {article.readMins} menit baca
          </span>
        </div>
      </div>
    </Link>
  );
}

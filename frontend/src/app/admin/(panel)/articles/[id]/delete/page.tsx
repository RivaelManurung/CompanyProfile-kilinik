"use client";

import { DeletePage } from "@/components/admin/DeletePage";
import { articlesApi } from "@/lib/admin/api";

export default function DeleteArticlePage() {
  return (
    <DeletePage
      singular="Artikel"
      api={articlesApi}
      backUrl="/admin/articles"
    />
  );
}

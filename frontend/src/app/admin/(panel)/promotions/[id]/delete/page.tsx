"use client";

import { DeletePage } from "@/components/admin/DeletePage";
import { promotionsApi } from "@/lib/admin/api";

export default function DeletePromotionPage() {
  return (
    <DeletePage
      singular="Promo"
      api={promotionsApi}
      backUrl="/admin/promotions"
    />
  );
}

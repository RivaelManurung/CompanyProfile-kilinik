"use client";

import { DeletePage } from "@/components/admin/DeletePage";
import { usersApi } from "@/lib/admin/api";

export default function DeleteUserPage() {
  return (
    <DeletePage
      singular="Pengguna"
      api={usersApi}
      backUrl="/admin/users"
    />
  );
}

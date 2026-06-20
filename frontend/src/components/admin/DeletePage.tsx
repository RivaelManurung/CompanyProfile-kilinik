"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { ApiError } from "@/lib/admin/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";

interface Props<T extends { name?: string; title?: string } = { name?: string; title?: string }> {
  singular: string;
  api: {
    get: (id: number) => Promise<T>;
    remove: (id: number) => Promise<unknown>;
  };
  backUrl: string;
  identifier?: (data: T) => string;
}

export function DeletePage<T extends { name?: string; title?: string }>({
  singular,
  api,
  backUrl,
  identifier,
}: Props<T>) {
  const router = useRouter();
  const params = useParams();
  const id = useMemo(() => (params?.id ? Number(params.id) : null), [params?.id]);
  const idValid = id !== null && !isNaN(id);

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(() => idValid);
  const [notFound, setNotFound] = useState(() => !idValid);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!idValid || !id) return;
    api.get(id)
      .then(setData)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
        else toast.error(err instanceof ApiError ? err.message : "Gagal memuat data");
      })
      .finally(() => setLoading(false));
  }, [id, idValid, api]);

  const confirmDelete = useCallback(async () => {
    if (!id || isNaN(id)) return;
    setDeleting(true);
    try {
      await api.remove(id);
      toast.success(`${singular} dihapus`);
      router.push(backUrl);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal menghapus");
    } finally {
      setDeleting(false);
    }
  }, [id, api, singular, backUrl, router]);

  const label = useMemo(() => {
    if (!data) return "";
    if (identifier) return identifier(data);
    return ((data as Record<string, unknown>).name || (data as Record<string, unknown>).title || `#${id}`) as string;
  }, [data, identifier, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Konfirmasi" title={`${singular} tidak ditemukan`} backButton={
          <Button variant="ghost" size="sm" onClick={() => router.push(backUrl)}>
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        } />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Konfirmasi"
        title={`Hapus ${singular}`}
        backButton={
          <Button variant="ghost" size="sm" onClick={() => router.push(backUrl)}>
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        }
      />

      <Card className="p-8">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
            <Trash2 className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            Hapus &ldquo;{label}&rdquo;?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Tindakan ini permanen dan akan tercatat di audit log. Pastikan data ini sudah tidak diperlukan.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button variant="outline" size="lg" onClick={() => router.push(backUrl)} disabled={deleting}>
              Batal
            </Button>
            <Button variant="destructive" size="lg" onClick={confirmDelete} disabled={deleting}>
              {deleting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Menghapus…</>
              ) : (
                <><Trash2 className="h-4 w-4" /> Hapus</>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

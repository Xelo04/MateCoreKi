// ==========================================
// KOMPONENT: Podgląd PDF (react-pdf, bez SSR)
// ==========================================
// * Renderowany wyłącznie przez LazyPdfPreview (dynamic import z ssr: false).
// * Cache wymiarów stron per URL eliminuje skakanie layoutu przy przełączaniu zakładek.

"use client";

import { memo, useCallback, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2 } from "lucide-react";

import { PdfSkeleton } from "./PdfSkeleton";

// * Style warstw adnotacji i tekstu react-pdf
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

// ==========================================
// STAŁE I TYPY
// ==========================================

// * Szerokość rysowanego canvasa (px CSS). Większa wartość = ostrzejszy podgląd.
// * Canvas skaluje się potem do kontenera przez PDF_SCALE_CLASSES.
const RENDER_WIDTH = 800;

const PDF_SCALE_CLASSES =
  "[&_canvas]:!h-auto [&_canvas]:!w-full [&_.react-pdf__Page]:!h-auto [&_.react-pdf__Page]:!w-full [&_.react-pdf__Page]:!min-h-0 [&_.react-pdf__Page]:!min-w-0";

type DocumentProps = ComponentProps<typeof Document>;
type LoadedPdf = Parameters<NonNullable<DocumentProps["onLoadSuccess"]>>[0];

interface PageSize {
  readonly width: number;
  readonly height: number;
}

interface PdfPreviewProps {
  readonly file: string | File;
}

// * Cache wymiarów stron per URL (poziom modułu — przeżywa remount komponentu)
const pageSizesCache = new Map<string, readonly PageSize[]>();

// ==========================================
// KOMPONENTY POMOCNICZE
// ==========================================

// * Nakładka ze spinnerem na stronie, która jeszcze się rysuje
const PageSpinner = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
    <Loader2
      className="h-6 w-6 animate-spin text-primary/70"
      aria-hidden="true"
    />
  </div>
);

// * Ramka o znanych proporcjach strony — rezerwuje wysokość przed wyrenderowaniem canvasa
const PageFrame = ({
  size,
  children,
}: {
  readonly size: PageSize;
  readonly children: ReactNode;
}) => (
  <div
    className="relative w-full overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-border/30"
    style={{ aspectRatio: `${size.width} / ${size.height}` }}
  >
    {children}
  </div>
);

// * Pojedyncza strona; spinner znika po zakończeniu rysowania
const PdfPage = ({
  pageNumber,
  size,
}: {
  readonly pageNumber: number;
  readonly size: PageSize;
}) => {
  const [isRendered, setIsRendered] = useState(false);

  return (
    <PageFrame size={size}>
      <Page
        pageNumber={pageNumber}
        width={RENDER_WIDTH}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        loading={<></>}
        onRenderSuccess={() => setIsRendered(true)}
      />
      {!isRendered && <PageSpinner />}
    </PageFrame>
  );
};

// * Stan błędu wczytywania pliku
const PdfError = () => (
  <div
    role="alert"
    className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center text-sm font-medium text-destructive"
  >
    Nie udało się wczytać pliku PDF.
  </div>
);

// ==========================================
// KOMPONENT WEWNĘTRZNY: Dokument
// ==========================================

const PdfDocument = ({ file }: PdfPreviewProps) => {
  const [pageSizes, setPageSizes] = useState<readonly PageSize[] | null>(
    () => typeof file === "string" ? pageSizesCache.get(file) ?? null : null,
  );
  const [hasError, setHasError] = useState(false);

  // * Po załadowaniu pliku pobiera wymiary WSZYSTKICH stron naraz.
  // * Dzięki temu ramki mają poprawną wysokość, zanim canvasy się narysują.
  const handleLoadSuccess = useCallback(
    async (pdf: LoadedPdf) => {
      const cachedSizes = typeof file === "string" ? pageSizesCache.get(file) : undefined;
      if (cachedSizes) {
        setPageSizes(cachedSizes);
        return;
      }
      try {
        const pages = await Promise.all(
          Array.from({ length: pdf.numPages }, (_, index) =>
            pdf.getPage(index + 1),
          ),
        );
        const sizes = pages.map((page) => {
          const viewport = page.getViewport({ scale: 1 });
          return { width: viewport.width, height: viewport.height };
        });

        if (typeof file === "string") pageSizesCache.set(file, sizes);
        setPageSizes(sizes);
      } catch (err) {
        console.error(
          "PdfPreview: nie udało się odczytać wymiarów stron:",
          err,
        );
        setHasError(true);
      }
    },
    [file],
  );

  if (hasError) return <PdfError />;

  return (
    <div className={`w-full ${PDF_SCALE_CLASSES}`}>
      <Document
        file={file}
        className="flex flex-col gap-4"
        loading={
          pageSizes ? (
            // * Znamy proporcje z cache — rysujemy dokładne puste ramki
            <>
              {pageSizes.map((size, index) => (
                <PageFrame key={index} size={size}>
                  <PageSpinner />
                </PageFrame>
              ))}
            </>
          ) : (
            <PdfSkeleton />
          )
        }
        error={<PdfError />}
        onLoadSuccess={(pdf) => {
          void handleLoadSuccess(pdf);
        }}
      >
        {/* * Dopóki nie znamy liczby i wymiarów stron, utrzymujemy szkielet */}
        {pageSizes ? (
          pageSizes.map((size, index) => (
            <PdfPage key={index} pageNumber={index + 1} size={size} />
          ))
        ) : (
          <PdfSkeleton />
        )}
      </Document>
    </div>
  );
};

// ==========================================
// EKSPORT
// ==========================================

const PdfPreview = memo(({ file }: PdfPreviewProps) => (
  <PdfDocument key={typeof file === "string" ? file : `${file.name}-${file.size}-${file.lastModified}`} file={file} />
));

PdfPreview.displayName = "PdfPreview";

export default PdfPreview;

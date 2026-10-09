// apps/web/src/app/loading.tsx

// Global route loading — brief, neutral, non-jarring.

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        Loading…
      </div>
    </div>
  );
}

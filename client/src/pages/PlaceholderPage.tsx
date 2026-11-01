export function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="py-12">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-muted-foreground">This page is coming in a later part.</p>
    </section>
  );
}

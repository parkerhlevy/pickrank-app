import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Phase 0 Foundation</p>
        <h1 className="text-3xl font-bold tracking-tight">PickRank</h1>
        <p className="text-muted-foreground">A skill-based NFL pick-order contest app.</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>App shell ready</CardTitle>
          <CardDescription>Placeholder routes and navigation are being prepared for future phases.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/contests">View Contests</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

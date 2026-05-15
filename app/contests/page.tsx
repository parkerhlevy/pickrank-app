import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ContestsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Contests</h1>
        <p className="text-muted-foreground">Placeholder contest lobby for Phase 0.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Week 1 QB Passing Yards</CardTitle>
          <CardDescription>Test contest placeholder. Real entry logic comes later.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/contests/test-contest">View Contest</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ContestNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center py-12">
      <Card className="section-card w-full text-center">
        <CardHeader>
          <p className="eyebrow">Contest unavailable</p>
          <CardTitle className="text-3xl">This contest is not available</CardTitle>
          <CardDescription>
            The contest may have been removed, or it may not be open to the public yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/contests">View open contests</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/how-it-works">How it works</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

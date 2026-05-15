import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ContestDetailPage({ params }: { params: { contestId: string } }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Contest Overview</h1>
        <p className="text-muted-foreground">Contest ID: {params.contestId}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Phase 0 placeholder</CardTitle>
          <CardDescription>Real contest entry and lineup editing will be implemented in later phases.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No payment, wallet, scoring, or entry logic exists here yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}

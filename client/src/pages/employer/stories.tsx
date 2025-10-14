import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import AdminBackButton from "@/components/AdminBackButton"

export default function Stories() {

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <AdminBackButton />
      </div>
      <h1 className="text-3xl font-bold mb-6">Stories</h1>
      <Card className="p-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Your Stories</h2>
          <p className="text-muted-foreground">
            Share your company's culture, values, and achievements through stories.
          </p>
          <Button variant="default">Create New Story</Button>
          <div className="mt-8">
            <p className="text-center text-muted-foreground">No stories yet. Start sharing your company's journey!</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
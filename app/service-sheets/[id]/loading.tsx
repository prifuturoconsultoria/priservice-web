import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function ServiceSheetDetailsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        {/* Breadcrumb */}
        <nav className="mb-4">
          <Skeleton className="h-8 w-40 rounded-md mb-2" />
        </nav>

        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-md" />
              </div>
              <div>
                <Skeleton className="h-7 w-72 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-32 rounded-md hidden sm:block" />
              <Skeleton className="h-10 w-24 rounded-md hidden sm:block" />
              <Skeleton className="h-10 w-36 rounded-md hidden sm:block" />
              <Skeleton className="h-10 w-24 rounded-md" />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="xl:col-span-2 space-y-4">
            {/* Project Information */}
            <div className="border rounded-xl px-4 py-4 bg-card/50 backdrop-blur shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <Skeleton className="h-5 w-48" />
              </div>
              <div className="px-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-64" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            </div>

            {/* Hours Breakdown */}
            <div className="border rounded-xl px-4 py-4 bg-card/50 backdrop-blur shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <Skeleton className="h-5 w-44" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-32 flex-1" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                ))}
                <div className="flex items-center gap-4 px-2 pt-2 border-t">
                  <Skeleton className="h-5 w-full max-w-[80%]" />
                  <Skeleton className="h-5 w-12 ml-auto" />
                </div>
              </div>
            </div>

            {/* Activities */}
            <div className="border rounded-xl px-4 py-4 bg-card/50 backdrop-blur shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-orange-500" />
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="px-4">
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-6 border border-slate-200">
                  <Skeleton className="h-4 w-full mb-3" />
                  <Skeleton className="h-4 w-5/6 mb-3" />
                  <Skeleton className="h-4 w-4/6 mb-3" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4">
            {/* Client Information */}
            <div className="border rounded-xl px-4 py-4 bg-card/50 backdrop-blur shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-5 w-44" />
              </div>
              <div className="px-4 space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-36" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-5 w-44" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-18" />
                  <Skeleton className="h-5 w-28" />
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="border rounded-xl px-4 py-4 bg-card/50 backdrop-blur shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="px-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mesh-gradient min-h-screen flex items-center justify-center p-6">
      <div className="glass-card flex max-w-md flex-col items-center p-12 text-center shadow-xl border-0">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50/50 shadow-inner">
          <SearchX className="h-10 w-10 text-indigo-600" />
        </div>
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-900">404</h1>
        <h2 className="mb-4 text-xl font-semibold text-slate-800">Page not found</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          We couldn&apos;t find the page you&apos;re looking for. It might have been moved or doesn&apos;t exist.
        </p>
        <Link href="/dashboard" passHref>
          <Button className="bg-indigo-600 text-white hover:bg-indigo-700 h-11 px-8 rounded-full shadow-md transition-transform hover:-translate-y-0.5">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

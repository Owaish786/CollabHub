"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Calendar, Clock, Video, ChevronLeft, Users, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MeetingDetailPageProps {
  params: Promise<{ workspaceId: string; meetingId: string }>;
}

export default function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const { workspaceId, meetingId } = use(params);
  const { data: session } = useSession();
  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        // Find by ID instead of the meeting link slug
        // Actually, the URL slug is `randomSlug`, which isn't the meeting ID.
        // Wait, the routing here is `meetings/[meetingId]`. 
        // If the URL is `meetings/slug`, this API call expects the MongoDB ID.
        // Wait! The `meetingLink` generated is `/workspace/[id]/meetings/[randomSlug]`.
        // We should fetch by `meetingLink` or we change `meetingLink` to use `_id`.
        // Let's assume `meetingId` here is actually the ID or we adjust the API.
        // Wait, the API `/api/meetings/[id]` expects the MongoDB ObjectId.
        // So the meetingLink should probably use the ObjectId. I'll need to fix that.
        // But for this component, let's just fetch it as if it's the ID.
        // I'll update the API to handle the randomSlug or use the ID.
        const res = await fetch(`/api/meetings`);
        const data = await res.json();
        
        if (data.success) {
           // find by slug from the list
           const found = data.data.find((m: any) => m.meetingLink.endsWith(meetingId) || m._id === meetingId);
           if (found) {
               setMeeting(found);
           } else {
               toast.error("Meeting not found");
           }
        }
      } catch (error) {
        toast.error("Failed to load meeting details");
      } finally {
        setLoading(false);
      }
    };

    fetchMeeting();
  }, [meetingId, workspaceId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-slate-50">
        <AlertCircle className="h-12 w-12 text-slate-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Meeting Not Found</h2>
        <p className="mt-2 text-slate-500">This meeting may have been deleted or the link is invalid.</p>
        <Link href={`/workspace/${workspaceId}/meetings`} className={cn(buttonVariants(), "mt-6")}>
          Back to Meetings
        </Link>
      </div>
    );
  }

  const startTime = new Date(meeting.startTime);
  const endTime = new Date(meeting.endTime);
  const isOrganizer = session?.user?.id === meeting.organizer._id;

  return (
    <div className="flex h-full flex-col bg-slate-50">
      {/* Top Nav */}
      <div className="flex items-center gap-4 border-b border-slate-200 bg-white px-6 py-4">
        <Link href={`/workspace/${workspaceId}/meetings`} className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "-ml-2 h-8 w-8 rounded-full")}>
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-slate-900">{meeting.title}</h1>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(startTime, "MMM d, yyyy")}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}</span>
          </div>
        </div>
        <div className="ml-auto">
          {meeting.status === "live" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 animate-pulse">
              <Video className="h-4 w-4" />
              Live Now
            </span>
          )}
        </div>
      </div>

      {/* Video Placeholder Area */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 p-6 overflow-hidden">
        
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col rounded-2xl bg-slate-900 shadow-xl overflow-hidden relative">
          <div className="absolute top-6 left-6 z-10">
            <span className="inline-flex items-center gap-1 rounded bg-black/50 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <Video className="h-3.5 w-3.5" />
              Meeting Room (Placeholder)
            </span>
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            {meeting.status !== "live" ? (
              <div className="text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-800">
                  <Video className="h-10 w-10 text-slate-500" />
                </div>
                <h3 className="mt-4 text-xl font-medium text-white">
                  {meeting.status === "upcoming" ? "Waiting for meeting to start..." : "Meeting has ended"}
                </h3>
                {meeting.status === "upcoming" && isOrganizer && (
                  <Button className="mt-6 bg-green-600 hover:bg-green-700">
                    Start Meeting Now
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 w-full h-full p-4">
                 {/* Placeholder for video feeds */}
                 <div className="bg-slate-800 rounded-xl flex items-center justify-center">
                    <Avatar className="h-20 w-20">
                       <AvatarImage src={session?.user?.image || ""} />
                       <AvatarFallback className="text-xl">{session?.user?.name?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                 </div>
                 <div className="bg-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500">
                    <Users className="h-10 w-10 mb-2 opacity-50" />
                    Waiting for others to join...
                 </div>
              </div>
            )}
          </div>
          
          {/* Controls */}
          {meeting.status === "live" && (
             <div className="h-20 bg-slate-950/80 backdrop-blur-md border-t border-white/10 flex items-center justify-center gap-4">
                <Button variant="secondary" className="rounded-full h-12 w-12 p-0 bg-slate-800 hover:bg-slate-700 border-none">
                   {/* Mic */}
                </Button>
                <Button variant="secondary" className="rounded-full h-12 w-12 p-0 bg-slate-800 hover:bg-slate-700 border-none">
                   {/* Camera */}
                </Button>
                <Button variant="destructive" className="rounded-full h-12 px-8">
                   Leave
                </Button>
             </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-80 flex flex-col gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-500" />
              Participants ({meeting.participants.length})
            </h3>
            <div className="space-y-4">
              {/* Organizer always first */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={meeting.organizer.image} />
                    <AvatarFallback>{meeting.organizer.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{meeting.organizer.name}</p>
                    <p className="text-[10px] text-slate-500">Organizer</p>
                  </div>
                </div>
              </div>
              
              {/* Other Participants */}
              {meeting.participants.filter((p: any) => p.user._id !== meeting.organizer._id).map((p: any) => (
                <div key={p.user._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={p.user.image} />
                      <AvatarFallback>{p.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium text-slate-700">{p.user.name}</p>
                  </div>
                  {p.status === "accepted" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {p.status === "declined" && <XCircle className="h-4 w-4 text-red-400" />}
                  {p.status === "pending" && <Clock className="h-4 w-4 text-amber-400" />}
                </div>
              ))}
            </div>
          </div>
          
          {meeting.description && (
             <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-2">Details</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                   {meeting.description}
                </p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

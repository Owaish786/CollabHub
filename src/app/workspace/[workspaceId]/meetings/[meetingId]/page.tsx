/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import {
  Loader2,
  Calendar,
  Clock,
  Video,
  ChevronLeft,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  PhoneOff,
} from "lucide-react";
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
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const res = await fetch(`/api/meetings`);
        const data = await res.json();

        if (data.success) {
          const found = data.data.find(
            (m: any) => m.meetingLink.endsWith(meetingId) || m._id === meetingId
          );
          if (found) {
            setMeeting(found);
          } else {
            toast.error("Meeting not found");
          }
        }
      } catch {
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
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
          <AlertCircle className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Meeting Not Found</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-sm text-center">
          This meeting may have been deleted or the link is invalid.
        </p>
        <Link
          href={`/workspace/${workspaceId}/meetings`}
          className={cn(buttonVariants(), "mt-6")}
        >
          Back to Meetings
        </Link>
      </div>
    );
  }

  const startTime = new Date(meeting.startTime);
  const endTime = new Date(meeting.endTime);
  const isOrganizer = session?.user?.id === meeting.organizer._id;

  return (
    <div className="flex h-full flex-col bg-slate-950">
      {/* Top Nav */}
      <div className="flex items-center gap-4 border-b border-slate-800 bg-slate-900 px-6 py-3">
        <Link
          href={`/workspace/${workspaceId}/meetings`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "-ml-2 h-8 w-8 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
          )}
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-white truncate">
            {meeting.title}
          </h1>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />{" "}
              {format(startTime, "MMM d, yyyy")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {format(startTime, "h:mm a")} –{" "}
              {format(endTime, "h:mm a")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {meeting.status === "live" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          )}
          {meeting.status === "upcoming" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-400">
              Upcoming
            </span>
          )}
          {meeting.status === "ended" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/20 px-3 py-1 text-xs font-medium text-slate-400">
              Ended
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row gap-0 overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 flex flex-col relative">
          {/* Video Grid */}
          <div className="flex-1 flex items-center justify-center p-6">
            {meeting.status !== "live" ? (
              <div className="text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-700 shadow-lg shadow-black/20 ring-1 ring-white/10">
                  <Video className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="mt-6 text-lg font-medium text-white">
                  {meeting.status === "upcoming"
                    ? "Meeting hasn't started yet"
                    : "This meeting has ended"}
                </h3>
                <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">
                  {meeting.status === "upcoming"
                    ? `Scheduled for ${format(startTime, "MMM d 'at' h:mm a")}`
                    : `Ended at ${format(endTime, "h:mm a")}`}
                </p>
                {meeting.status === "upcoming" && isOrganizer && (
                  <Button className="mt-6 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/30">
                    <Video className="mr-2 h-4 w-4" />
                    Start Meeting
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 w-full h-full max-h-[600px]">
                {/* Self video */}
                <div className="relative rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 ring-1 ring-white/10 flex items-center justify-center overflow-hidden">
                  <Avatar className="h-20 w-20 ring-2 ring-white/20">
                    <AvatarImage src={session?.user?.image || ""} />
                    <AvatarFallback className="text-2xl bg-indigo-600 text-white">
                      {session?.user?.name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-3 left-3">
                    <span className="rounded-md bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
                      You
                    </span>
                  </div>
                </div>
                {/* Waiting for others */}
                <div className="relative rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 ring-1 ring-white/5 flex flex-col items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 ring-1 ring-white/10">
                    <Users className="h-7 w-7 text-slate-500" />
                  </div>
                  <p className="mt-3 text-sm text-slate-500">
                    Waiting for others…
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          {meeting.status === "live" && (
            <div className="h-20 bg-slate-900/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                onClick={() => setMicOn(!micOn)}
                className={cn(
                  "rounded-full h-12 w-12 p-0 border-0 transition-colors",
                  micOn
                    ? "bg-slate-700 hover:bg-slate-600 text-white"
                    : "bg-red-500/20 hover:bg-red-500/30 text-red-400"
                )}
              >
                {micOn ? (
                  <Mic className="h-5 w-5" />
                ) : (
                  <MicOff className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setCamOn(!camOn)}
                className={cn(
                  "rounded-full h-12 w-12 p-0 border-0 transition-colors",
                  camOn
                    ? "bg-slate-700 hover:bg-slate-600 text-white"
                    : "bg-red-500/20 hover:bg-red-500/30 text-red-400"
                )}
              >
                {camOn ? (
                  <Camera className="h-5 w-5" />
                ) : (
                  <CameraOff className="h-5 w-5" />
                )}
              </Button>
              <Button className="rounded-full h-12 px-8 bg-red-600 hover:bg-red-700 text-white ml-4 border-0">
                <PhoneOff className="mr-2 h-4 w-4" />
                Leave
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-72 bg-slate-900 border-l border-slate-800 flex flex-col overflow-y-auto">
          {/* Participants */}
          <div className="p-5 border-b border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
              <Users className="h-3.5 w-3.5" />
              Participants · {meeting.participants.length}
            </h3>
            <div className="space-y-3">
              {/* Organizer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={meeting.organizer.image} />
                    <AvatarFallback className="text-xs bg-indigo-600 text-white">
                      {meeting.organizer.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {meeting.organizer.name}
                    </p>
                    <p className="text-[10px] text-indigo-400">Organizer</p>
                  </div>
                </div>
              </div>

              {/* Other Participants */}
              {meeting.participants
                .filter((p: any) => p.user._id !== meeting.organizer._id)
                .map((p: any) => (
                  <div key={p.user._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={p.user.image} />
                        <AvatarFallback className="text-xs bg-slate-700 text-slate-300">
                          {p.user.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm text-slate-300">{p.user.name}</p>
                    </div>
                    {p.status === "accepted" && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                    )}
                    {p.status === "declined" && (
                      <XCircle className="h-3.5 w-3.5 text-red-400" />
                    )}
                    {p.status === "pending" && (
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Meeting Details */}
          {meeting.description && (
            <div className="p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Details
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
                {meeting.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

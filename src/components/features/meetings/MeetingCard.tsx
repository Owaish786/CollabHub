"use client";

import { Calendar, Clock, Video, CheckCircle2, XCircle, MoreVertical, Link as LinkIcon } from "lucide-react";
import { format, isPast, isFuture, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useSession } from "next-auth/react";

/** Safely copy text to clipboard with fallback for insecure contexts */
async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch { /* fall through */ }
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const result = document.execCommand("copy");
    document.body.removeChild(textarea);
    return result;
  } catch {
    return false;
  }
}

interface Participant {
  user: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  };
  status: "pending" | "accepted" | "declined";
}

interface Meeting {
  _id: string;
  title: string;
  description?: string;
  workspace: string;
  organizer: { _id: string; name: string; email: string; image?: string };
  participants: Participant[];
  startTime: string;
  endTime: string;
  meetingLink: string;
  type: "quick" | "scheduled";
  status: "upcoming" | "live" | "ended" | "cancelled";
}

interface MeetingCardProps {
  meeting: Meeting;
  onUpdateStatus?: (meetingId: string, status: "accepted" | "declined") => void;
  onCancel?: (meetingId: string) => void;
}

export function MeetingCard({ meeting, onUpdateStatus, onCancel }: MeetingCardProps) {
  const { data: session } = useSession();
  const startTime = new Date(meeting.startTime);
  const endTime = new Date(meeting.endTime);
  
  const isOrganizer = session?.user?.id === meeting.organizer._id;
  const myParticipantRecord = meeting.participants.find(
    (p) => p.user._id === session?.user?.id
  );
  
  const myStatus = myParticipantRecord?.status;

  // Determine visual status
  let visualStatus = meeting.status;
  if (visualStatus === "upcoming" && isPast(startTime) && isFuture(endTime)) {
    visualStatus = "live";
  } else if (visualStatus === "upcoming" && isPast(endTime)) {
    visualStatus = "ended";
  }

  const statusConfig = {
    upcoming: { color: "bg-blue-100 text-blue-700", label: "Upcoming", icon: Calendar },
    live: { color: "bg-green-100 text-green-700 animate-pulse", label: "Live Now", icon: Video },
    ended: { color: "bg-slate-100 text-slate-600", label: "Ended", icon: Clock },
    cancelled: { color: "bg-red-100 text-red-700", label: "Cancelled", icon: XCircle },
  };

  const config = statusConfig[visualStatus];
  const StatusIcon = config.icon;

  const acceptedCount = meeting.participants.filter((p) => p.status === "accepted").length;

  return (
    <div className={cn(
      "group relative flex flex-col justify-between rounded-xl border p-5 transition-all",
      visualStatus === "live" 
        ? "border-green-200 bg-green-50/30 shadow-sm" 
        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm",
      visualStatus === "cancelled" && "opacity-75"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", config.color)}>
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </span>
            {meeting.type === "quick" && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                Instant
              </span>
            )}
          </div>
          <Link href={meeting.meetingLink} className="block">
            <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {meeting.title}
            </h3>
          </Link>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
              {isToday(startTime) ? "Today" : format(startTime, "MMM d, yyyy")}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 shrink-0 text-slate-400" />
              {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
            </span>
          </div>
        </div>

        {/* Dropdown menu for options */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={async () => {
                const url = typeof window !== "undefined" ? window.location.origin + meeting.meetingLink : meeting.meetingLink;
                const success = await copyToClipboard(url);
                if (success) {
                  toast.success("Meeting link copied to clipboard");
                } else {
                  toast.error("Failed to copy link");
                }
              }}
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              Copy meeting link
            </DropdownMenuItem>
            
            {isOrganizer && (visualStatus === "upcoming" || visualStatus === "live") && (
              <DropdownMenuItem 
                className="text-red-600 focus:bg-red-50 focus:text-red-700 mt-1 cursor-pointer"
                onClick={() => onCancel?.(meeting._id)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                {visualStatus === "live" ? "End meeting for all" : "Cancel meeting"}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Body / Description */}
      {meeting.description && (
        <p className="mt-3 line-clamp-2 text-sm text-slate-600">
          {meeting.description}
        </p>
      )}

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
        {/* Participants */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {meeting.participants.slice(0, 5).map((p) => (
              <Avatar 
                key={p.user._id} 
                className={cn(
                  "h-8 w-8 ring-2 ring-white",
                  p.status === "declined" && "opacity-50 grayscale",
                  p.status === "pending" && "opacity-75"
                )}
                title={`${p.user.name} (${p.status})`}
              >
                <AvatarImage src={p.user.image} />
                <AvatarFallback className="text-[10px]">{p.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            ))}
            {meeting.participants.length > 5 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 ring-2 ring-white text-[10px] font-medium text-slate-600">
                +{meeting.participants.length - 5}
              </div>
            )}
          </div>
          <span className="text-xs font-medium text-slate-500">
            {acceptedCount} / {meeting.participants.length} attending
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!isOrganizer && visualStatus === "upcoming" && myStatus === "pending" && onUpdateStatus && (
            <>
              <Button 
                type="button"
                variant="outline" 
                size="sm" 
                className="h-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => onUpdateStatus(meeting._id, "declined")}
              >
                Decline
              </Button>
              <Button 
                type="button"
                variant="outline" 
                size="sm" 
                className="h-8 border-green-200 text-green-700 hover:bg-green-50"
                onClick={() => onUpdateStatus(meeting._id, "accepted")}
              >
                Accept
              </Button>
            </>
          )}

          {(!isOrganizer && visualStatus === "upcoming" && myStatus !== "pending") && (
            <span className={cn(
              "flex items-center gap-1 text-xs font-medium",
              myStatus === "accepted" ? "text-green-600" : "text-red-500"
            )}>
              {myStatus === "accepted" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {myStatus === "accepted" ? "Attending" : "Declined"}
            </span>
          )}

          {visualStatus === "live" && (myStatus !== "declined" || isOrganizer) && (
            <Link href={meeting.meetingLink} className={cn(buttonVariants({ size: "sm" }), "h-8 bg-green-600 hover:bg-green-700 shadow-sm shadow-green-200")}>
              <Video className="mr-1.5 h-3.5 w-3.5" />
              Join
            </Link>
          )}
          
          {(visualStatus === "upcoming" || visualStatus === "ended") && (myStatus !== "declined" || isOrganizer) && (
            <Link href={meeting.meetingLink} className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "h-8")}>
              Details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

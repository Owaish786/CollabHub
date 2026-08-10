"use client";

import { useEffect, useState, useRef, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Users,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MoreVertical,
  Link as LinkIcon,
  XCircle,
} from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWebRTC } from "@/hooks/useWebRTC";

function VideoPlayer({ stream, isLocal, muted = false }: { stream: MediaStream | null; isLocal: boolean; muted?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isLocal || muted}
      className={`h-full w-full object-cover ${isLocal ? "scale-x-[-1]" : ""}`}
    />
  );
}

interface MeetingDetailPageProps {
  params: Promise<{ workspaceId: string; meetingId: string }>;
}

export default function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const { workspaceId, meetingId } = use(params);
  const { data: session } = useSession();
  const [meeting, setMeeting] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const router = useRouter();

  const {
    localStream,
    peers,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
    leaveMeeting,
  } = useWebRTC({
    meetingId,
    user: session?.user as Record<string, unknown> | undefined,
    enabled: joined,
  });

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const res = await fetch(`/api/meetings/${meetingId}`);
        const data = await res.json();

        if (data.success && data.data) {
          setMeeting(data.data);
        } else {
          toast.error("Meeting not found");
        }
      } catch {
        toast.error("Failed to load meeting details");
      } finally {
        setLoading(false);
      }
    };

    fetchMeeting();
  }, [meetingId, workspaceId]);

  const handleJoinCall = () => {
    if (!session) return;
    setJoined(true);
  };

  const handleLeaveCall = () => {
    leaveMeeting();
    router.push(`/workspace/${workspaceId}/meetings`);
  };

  const handleEndMeeting = async () => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }), // or "ended" depending on backend
      });
      if (res.ok) {
        toast.success("Meeting ended");
        handleLeaveCall();
      } else {
        toast.error("Failed to end meeting");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 ring-1 ring-white/10">
          <Video className="h-8 w-8 text-slate-500" />
        </div>
        <h2 className="text-xl font-semibold text-white">Meeting not found</h2>
        <p className="mt-2 text-slate-400">
          The meeting link might be invalid or the meeting has been deleted.
        </p>
        <Link href={`/workspace/${workspaceId}/meetings`}>
          <Button className="mt-6 bg-indigo-600 hover:bg-indigo-700">Back to Meetings</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col bg-slate-950 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/50 px-6 py-4 backdrop-blur-md">
        <div>
          <h1 className="text-xl font-semibold text-white">{meeting.title}</h1>
          <p className="text-sm text-slate-400">
            {meeting.description || "No description provided"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {meeting.status === "live" && (
            <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-400">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Live
            </span>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-white hover:bg-white/10">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-white/10 text-slate-200">
              <DropdownMenuItem 
                className="hover:bg-white/10 focus:bg-white/10 focus:text-white"
                onClick={() => {
                  const url = typeof window !== "undefined" ? window.location.origin + `/workspace/${workspaceId}/meetings/${meetingId}` : "";
                  navigator.clipboard.writeText(url);
                  toast.success("Meeting link copied to clipboard");
                }}
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                Copy meeting link
              </DropdownMenuItem>
              
              {session?.user?.id === meeting.organizer?._id && (
                <DropdownMenuItem 
                  className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-300 mt-1"
                  onClick={handleEndMeeting}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  End meeting for all
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-0 overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 flex flex-col relative p-4">
          
          {!joined ? (
            <div className="flex h-full flex-col items-center justify-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-900 to-indigo-800 shadow-lg shadow-black/20 ring-1 ring-white/10 mb-6">
                <Video className="h-10 w-10 text-indigo-300" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">Ready to join?</h3>
              <p className="text-slate-400 mb-8 max-w-sm text-center">
                Your microphone and camera will be requested when you join.
              </p>
              <Button 
                onClick={handleJoinCall}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/30 px-8 py-6 text-lg rounded-full font-medium"
              >
                Join Call
              </Button>
            </div>
          ) : (
            <div className="flex flex-col h-full gap-4">
              
              {/* Videos Grid */}
              <div className={`grid gap-4 flex-1 ${peers.length === 0 ? 'grid-cols-1' : peers.length === 1 ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-3'}`}>
                
                {/* Local Video */}
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl h-full min-h-[250px]">
                  <div className="flex h-full items-center justify-center bg-slate-900">
                    <VideoPlayer stream={localStream} isLocal={true} />
                  </div>
                  
                  {/* Local overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-lg bg-black/60 p-3 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-sm font-semibold text-white shadow-inner">
                        {session?.user?.name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="font-medium text-white">{session?.user?.name} (You)</p>
                        <p className="text-xs text-slate-300">
                          {isAudioEnabled ? "Microphone On" : "Muted"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Remote Peers */}
                {peers.map((peer) => (
                  <div key={peer.socketId} className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl h-full min-h-[250px]">
                    <div className="flex h-full items-center justify-center bg-slate-900">
                      <VideoPlayer stream={peer.stream} isLocal={false} />
                    </div>
                    
                    {/* Remote overlay */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-lg bg-black/60 px-3 py-2 backdrop-blur-md">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white shadow-inner">
                        {peer.user?.name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <p className="text-sm font-medium text-white">{peer.user?.name || "Participant"}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Toolbar */}
              <div className="flex items-center justify-center gap-4 rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-xl backdrop-blur-md shrink-0">
                <Button
                  variant={isAudioEnabled ? "secondary" : "destructive"}
                  size="icon"
                  className="h-14 w-14 rounded-full transition-all hover:scale-105 active:scale-95"
                  onClick={toggleAudio}
                >
                  {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                </Button>
                <Button
                  variant={isVideoEnabled ? "secondary" : "destructive"}
                  size="icon"
                  className="h-14 w-14 rounded-full transition-all hover:scale-105 active:scale-95"
                  onClick={toggleVideo}
                >
                  {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                </Button>
                <Button
                  variant="destructive"
                  className="h-14 rounded-full px-8 font-semibold text-base transition-all hover:bg-red-700 hover:scale-105 active:scale-95"
                  onClick={handleLeaveCall}
                >
                  <PhoneOff className="mr-2 h-5 w-5" />
                  Leave
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-80 border-l border-white/10 bg-slate-900/30 flex flex-col">
          <div className="p-4 border-b border-white/5">
            <h3 className="font-medium text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              Participants
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Organizer</p>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 ring-1 ring-white/10">
                    <AvatarImage src={meeting.organizer?.image || ""} />
                    <AvatarFallback className="bg-indigo-600 text-white text-xs">
                      {meeting.organizer?.name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-slate-200">
                    {meeting.organizer?.name}
                    {session?.user?.id === meeting.organizer?._id && " (You)"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

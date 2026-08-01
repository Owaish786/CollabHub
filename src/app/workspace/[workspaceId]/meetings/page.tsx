"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Calendar as CalendarIcon, Filter } from "lucide-react";
import { MeetingCard } from "@/components/features/meetings/MeetingCard";
import { ScheduleMeetingModal } from "@/components/features/meetings/ScheduleMeetingModal";
import { toast } from "sonner";
import { useSocket } from "@/components/providers/SocketProvider";

interface MeetingsPageProps {
  params: Promise<{ workspaceId: string }>;
}

export default function MeetingsPage({ params }: MeetingsPageProps) {
  const { workspaceId } = use(params);
  const { data: session } = useSession();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past" | "today">("all");
  const { socket, isConnected } = useSocket();

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/meetings?workspace=${workspaceId}&filter=${filter}`);
      const data = await res.json();
      if (data.success) {
        setMeetings(data.data);
      } else {
        toast.error("Failed to load meetings");
      }
    } catch (error) {
      toast.error("An error occurred while loading meetings");
    } finally {
      setLoading(false);
    }
  }, [workspaceId, filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMeetings();
  }, [fetchMeetings]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMeetingCreated = (newMeeting: any) => {
      // If it fits current filter, add it
      if (filter === "all" || filter === "upcoming" || filter === "today") {
         setMeetings((prev) => [...prev, newMeeting].sort((a, b) => 
           new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
         ));
      }
    };

    const handleMeetingUpdated = (updatedMeeting: any) => {
      setMeetings((prev) => 
        prev.map((m) => m._id === updatedMeeting._id ? updatedMeeting : m)
      );
    };
    
    const handleMeetingDeleted = (deletedId: string) => {
      setMeetings((prev) => prev.filter((m) => m._id !== deletedId));
    };

    socket.on("meeting-created", handleMeetingCreated);
    socket.on("meeting-updated", handleMeetingUpdated);
    socket.on("meeting-deleted", handleMeetingDeleted);

    return () => {
      socket.off("meeting-created", handleMeetingCreated);
      socket.off("meeting-updated", handleMeetingUpdated);
      socket.off("meeting-deleted", handleMeetingDeleted);
    };
  }, [socket, isConnected, filter]);

  const handleUpdateStatus = async (meetingId: string, status: "accepted" | "declined") => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setMeetings((prev) => prev.map((m) => (m._id === meetingId ? data.data : m)));
        toast.success(`RSVP updated to ${status}`);
        if (socket && isConnected) {
            socket.emit("meeting-update", data.data);
        }
      }
    } catch (error) {
      toast.error("Failed to update RSVP");
    }
  };

  const handleCancelMeeting = async (meetingId: string) => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const data = await res.json();
      if (data.success) {
        setMeetings((prev) => prev.map((m) => (m._id === meetingId ? data.data : m)));
        toast.success("Meeting cancelled");
        if (socket && isConnected) {
            socket.emit("meeting-update", data.data);
        }
      }
    } catch (error) {
      toast.error("Failed to cancel meeting");
    }
  };

  const liveMeetings = meetings.filter(m => m.status === "live");
  const upcomingMeetings = meetings.filter(m => m.status === "upcoming");
  const pastMeetings = meetings.filter(m => m.status === "ended" || m.status === "cancelled");

  return (
    <div className="flex h-full flex-col bg-slate-50/50">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-indigo-600" />
            Meetings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Schedule and manage team syncs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="mr-2 flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            {(["all", "upcoming", "past"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-[13px] font-medium capitalize transition-colors rounded-md ${
                  filter === f
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <ScheduleMeetingModal workspaceId={workspaceId} />
          <ScheduleMeetingModal workspaceId={workspaceId} isQuick />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : meetings.length === 0 ? (
          <div className="flex h-60 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-4">
              <CalendarIcon className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No meetings found</h3>
            <p className="mt-1 text-sm text-slate-500">
              Get started by scheduling a new meeting or starting a quick sync.
            </p>
            <div className="mt-6 flex gap-3">
              <ScheduleMeetingModal workspaceId={workspaceId} />
              <ScheduleMeetingModal workspaceId={workspaceId} isQuick />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {liveMeetings.length > 0 && (
              <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                  Live Now
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {liveMeetings.map((meeting) => (
                    <MeetingCard 
                      key={meeting._id} 
                      meeting={meeting} 
                      onUpdateStatus={handleUpdateStatus}
                      onCancel={handleCancelMeeting}
                    />
                  ))}
                </div>
              </section>
            )}

            {upcomingMeetings.length > 0 && (
              <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Upcoming
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {upcomingMeetings.map((meeting) => (
                    <MeetingCard 
                      key={meeting._id} 
                      meeting={meeting} 
                      onUpdateStatus={handleUpdateStatus}
                      onCancel={handleCancelMeeting}
                    />
                  ))}
                </div>
              </section>
            )}

            {pastMeetings.length > 0 && (filter === "all" || filter === "past") && (
              <section className={filter === "all" ? "opacity-75" : ""}>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Past & Cancelled
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {pastMeetings.map((meeting) => (
                    <MeetingCard 
                      key={meeting._id} 
                      meeting={meeting} 
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

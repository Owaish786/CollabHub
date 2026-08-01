"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, CalendarPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format, addMinutes, addHours } from "date-fns";
import { useSocket } from "@/components/providers/SocketProvider";

interface ScheduleMeetingModalProps {
  workspaceId: string;
  trigger?: React.ReactNode;
  isQuick?: boolean;
}

export function ScheduleMeetingModal({ workspaceId, trigger, isQuick = false }: ScheduleMeetingModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  
  // Default values
  const now = new Date();
  const defaultStartTime = addMinutes(now, 5 - (now.getMinutes() % 5)); // round to next 5 min
  const defaultEndTime = addHours(defaultStartTime, 1);

  const [title, setTitle] = useState(isQuick ? "Quick Sync" : "");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState(format(defaultStartTime, "yyyy-MM-dd'T'HH:mm"));
  const [endTime, setEndTime] = useState(format(defaultEndTime, "yyyy-MM-dd'T'HH:mm"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Please provide a meeting title");
      return;
    }

    setLoading(true);

    try {
      const start = isQuick ? new Date() : new Date(startTime);
      const end = isQuick ? addMinutes(start, 30) : new Date(endTime);
      
      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          workspaceId,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          type: isQuick ? "quick" : "scheduled",
          // Send no participants so the server sets just the organizer as accepted,
          // OR we could fetch members and allow multi-select.
          // For simplicity in this v1, everyone in the workspace can see it,
          // but we can add participant selection later.
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(isQuick ? "Meeting started!" : "Meeting scheduled!");
        
        // Broadcast the new meeting
        if (socket && isConnected) {
          socket.emit("meeting-created", { workspaceId, meeting: data.data });
        }

        setOpen(false);
        router.refresh();
        if (isQuick) {
          router.push(data.data.meetingLink);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to schedule meeting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        trigger ? (
          trigger as React.ReactElement
        ) : (
          <Button className={isQuick ? "bg-amber-600 hover:bg-amber-700" : ""}>
            {isQuick ? <Video className="mr-2 h-4 w-4" /> : <CalendarPlus className="mr-2 h-4 w-4" />}
            {isQuick ? "Instant Meeting" : "Schedule Meeting"}
          </Button>
        )
      } />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isQuick ? "Start Instant Meeting" : "Schedule Meeting"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title</Label>
            <Input
              id="title"
              placeholder="E.g., Weekly Sync"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {!isQuick && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="What is this meeting about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isQuick ? "Start Now" : "Schedule Meeting"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

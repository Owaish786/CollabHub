"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/components/providers/SocketProvider";

interface Peer {
  socketId: string;
  stream: MediaStream;
  user: any; // The user object passed from the server
}

interface WebRTCConfig {
  meetingId: string;
  user: any;
  enabled: boolean;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useWebRTC({ meetingId, user, enabled }: WebRTCConfig) {
  const { socket, isConnected } = useSocket();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  
  // Keep track of PeerConnections
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  // Store user info for peers
  const peerUsers = useRef<Map<string, any>>(new Map());

  // Initialize Media Devices
  useEffect(() => {
    if (!enabled) return;

    let mounted = true;
    let stream: MediaStream | null = null;

    const initMedia = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (mounted) {
          setLocalStream(stream);
        } else {
          // Cleanup if component unmounted while requesting permissions
          stream.getTracks().forEach((track) => track.stop());
        }
      } catch (err) {
        console.error("Error accessing media devices.", err);
      }
    };

    initMedia();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [enabled]);

  // Handle Socket Signaling
  useEffect(() => {
    if (!socket || !isConnected || !enabled || !localStream) return;

    // Join the meeting room
    socket.emit("webrtc-join", { meetingId, user });

    const createPeerConnection = (socketId: string, remoteUser: any) => {
      if (peerConnections.current.has(socketId)) return peerConnections.current.get(socketId)!;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnections.current.set(socketId, pc);
      peerUsers.current.set(socketId, remoteUser);

      // Add local tracks to the connection
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc-ice-candidate", {
            to: socketId,
            candidate: event.candidate,
          });
        }
      };

      // Handle receiving remote tracks
      pc.ontrack = (event) => {
        setPeers((prev) => {
          // If we already have a stream for this peer, don't duplicate
          const existingPeer = prev.find((p) => p.socketId === socketId);
          if (existingPeer) return prev;

          return [
            ...prev,
            { socketId, stream: event.streams[0], user: remoteUser },
          ];
        });
      };

      // Handle connection state changes
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
          removePeer(socketId);
        }
      };

      return pc;
    };

    const removePeer = (socketId: string) => {
      const pc = peerConnections.current.get(socketId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(socketId);
        peerUsers.current.delete(socketId);
      }
      setPeers((prev) => prev.filter((p) => p.socketId !== socketId));
    };

    // ==========================================
    // Signaling Listeners
    // ==========================================

    const handleUserJoined = async ({ socketId, user: remoteUser }: { socketId: string, user: any }) => {
      try {
        const pc = createPeerConnection(socketId, remoteUser);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc-offer", { to: socketId, offer, user });
      } catch (err) {
        console.error("Error creating offer:", err);
      }
    };

    const handleOffer = async ({ from, offer, user: remoteUser }: { from: string, offer: RTCSessionDescriptionInit, user: any }) => {
      try {
        const pc = createPeerConnection(from, remoteUser);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", { to: from, answer });
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    };

    const handleAnswer = async ({ from, answer }: { from: string, answer: RTCSessionDescriptionInit }) => {
      try {
        const pc = peerConnections.current.get(from);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (err) {
        console.error("Error handling answer:", err);
      }
    };

    const handleIceCandidate = async ({ from, candidate }: { from: string, candidate: RTCIceCandidateInit }) => {
      try {
        const pc = peerConnections.current.get(from);
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    };

    const handleUserLeft = (socketId: string) => {
      removePeer(socketId);
    };

    socket.on("webrtc-user-joined", handleUserJoined);
    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("webrtc-ice-candidate", handleIceCandidate);
    socket.on("webrtc-user-left", handleUserLeft);

    return () => {
      socket.off("webrtc-user-joined", handleUserJoined);
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-answer", handleAnswer);
      socket.off("webrtc-ice-candidate", handleIceCandidate);
      socket.off("webrtc-user-left", handleUserLeft);
      
      // Cleanup all connections on unmount
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
      peerUsers.current.clear();
      setPeers([]);
      
      socket.emit("webrtc-leave", meetingId);
    };
  }, [socket, isConnected, enabled, meetingId, user, localStream]);

  // Controls
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, [localStream]);

  const leaveMeeting = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();
    setPeers([]);
    
    if (socket && isConnected) {
      socket.emit("webrtc-leave", meetingId);
    }
  }, [localStream, socket, isConnected, meetingId]);

  return {
    localStream,
    peers,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
    leaveMeeting,
  };
}

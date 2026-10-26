"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  ShieldCheck,
  User,
  AlertTriangle,
  RefreshCw,
  Info,
  CheckCircle2,
  Lock,
  Users,
} from "lucide-react";
import { AppShell } from "../../../components/layout/AppShell";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { DemoBadge, StatusBadge } from "../../../components/ui/StatusBadge";
import { useAuth } from "../../../lib/auth-context";
import { api } from "../../../lib/api-client";

export default function ConsultationRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user, role } = useAuth();
  const appointmentId = (params.id as string) || "apt-01";

  const [appointment, setAppointment] = useState<any>(null);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [loadingToken, setLoadingToken] = useState(true);

  // Local & Remote Media State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micActive, setMicActive] = useState(true);
  const [cameraActive, setCameraActive] = useState(true);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // WebRTC Signaling & Connection State
  const [peerCount, setPeerCount] = useState<number>(1);
  const [connectionState, setConnectionState] = useState<string>("Initializing...");
  const [isPeerConnected, setIsPeerConnected] = useState<boolean>(false);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch Appointment Details & Video Token
  useEffect(() => {
    let active = true;
    const loadConsultationData = async () => {
      setLoadingToken(true);
      try {
        const userId = user?.id || "usr-demo-patient-001";
        const currentRole = role || "patient";

        // Fetch Appointment Info
        try {
          const aptData = await api.getAppointment(appointmentId);
          if (active && aptData) setAppointment(aptData);
        } catch (e) {
          console.warn("Could not fetch appointment details:", e);
        }

        // Fetch Video Access Token
        const res = await fetch(
          `http://127.0.0.1:8000/api/v1/appointments/${appointmentId}/video-token?user_id=${userId}&role=${currentRole}`
        );
        if (res.ok) {
          const data = await res.json();
          if (active) setTokenInfo(data);
        }
      } catch (e) {
        console.warn("Could not fetch video token:", e);
      } finally {
        if (active) setLoadingToken(false);
      }
    };

    loadConsultationData();
    return () => {
      active = false;
    };
  }, [appointmentId, user, role]);

  // Reliable attachment of localStream to local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Reliable attachment of remoteStream to remote video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Initialize WebRTC & Media Stream
  const startMediaAndSignaling = useCallback(async () => {
    setMediaError(null);
    setConnectionState("Requesting media permissions...");

    let stream: MediaStream | null = null;
    try {
      if (typeof window !== "undefined" && navigator.mediaDevices) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
      } else {
        setMediaError("Camera/Microphone access is not supported in this browser environment.");
        setConnectionState("Unsupported Browser");
        return;
      }
    } catch (err: any) {
      console.warn("Camera/Mic access error:", err);
      let errorMsg = "Unable to access camera or microphone.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMsg = "Camera/Microphone permission denied. Please click the camera icon in your browser address bar to grant access.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMsg = "No camera or microphone hardware found on your device.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errorMsg = "Camera or microphone is currently in use by another application (e.g., Zoom, Teams). Please close other apps and retry.";
      } else {
        errorMsg = `Media Access Error (${err.name || "Unknown"}): ${err.message || "Hardware constraint"}`;
      }
      setMediaError(errorMsg);
      setConnectionState("Media Error");
      return;
    }

    // Setup WebRTC PeerConnection with Google STUN servers
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });
      pcRef.current = pc;

      // Add local media tracks to peer connection
      stream.getTracks().forEach((track) => pc.addTrack(track, stream!));

      // Handle remote media track addition
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          setIsPeerConnected(true);
        }
      };

      // Peer Connection status tracking
      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
        if (pc.connectionState === "connected") {
          setIsPeerConnected(true);
        } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          setIsPeerConnected(false);
        }
      };

      // Connect to FastAPI WebSocket Signaling Channel
      const roomName = tokenInfo?.room_name || `vitalnex-room-${appointmentId}`;
      const wsUrl = `ws://127.0.0.1:8000/api/v1/ws/signaling/${roomName}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      pc.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "candidate", candidate: event.candidate }));
        }
      };

      ws.onopen = () => {
        setConnectionState("Connected to Signaling Server");
      };

      ws.onmessage = async (msg) => {
        try {
          const payload = JSON.parse(msg.data);
          if (payload.type === "peer_count") {
            setPeerCount(payload.count);
            // If second participant joined and we're patient/caller, initiate offer
            if (payload.count >= 2 && pc.signalingState === "stable") {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              ws.send(JSON.stringify({ type: "offer", offer }));
            }
          } else if (payload.type === "offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(JSON.stringify({ type: "answer", answer }));
          } else if (payload.type === "answer") {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
          } else if (payload.type === "candidate") {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          }
        } catch (e) {
          console.warn("Signaling message handle error:", e);
        }
      };
    } catch (e) {
      console.warn("WebRTC initialization warning:", e);
      setConnectionState("Local Media Preview Mode");
    }
  }, [appointmentId, tokenInfo]);

  useEffect(() => {
    // Start from a callback, not synchronously in the effect body (react-hooks/set-state-in-effect).
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) startMediaAndSignaling();
    });
    return () => {
      cancelled = true;
      if (wsRef.current) wsRef.current.close();
      if (pcRef.current) pcRef.current.close();
      if (localStream) localStream.getTracks().forEach((t) => t.stop());
    };
  }, [startMediaAndSignaling]);

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micActive;
        setMicActive(!micActive);
      }
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !cameraActive;
        setCameraActive(!cameraActive);
      }
    }
  };

  const handleLeaveCall = () => {
    if (wsRef.current) wsRef.current.close();
    if (pcRef.current) pcRef.current.close();
    if (localStream) localStream.getTracks().forEach((t) => t.stop());

    if (role === "doctor") {
      router.push("/doctor/appointments");
    } else {
      router.push("/appointments");
    }
  };

  const patientName = appointment?.patient_name || (role === "patient" ? (user?.fullName || "Authenticated Patient") : "Rajesh Sharma");
  const doctorName = appointment?.doctor_name || "Dr. Anand Joshi, MD (Cardiology)";
  const assessmentId = appointment?.assessment_id || "asm-demo-001";

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Room Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8E2EA] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-[#0B1F33]">
                Telehealth Video Consultation Room
              </h1>
              {peerCount >= 2 || isPeerConnected ? (
                <StatusBadge label="CONNECTED (2 Participants)" variant="success" size="sm" />
              ) : (
                <StatusBadge label="WAITING FOR PARTICIPANT" variant="warning" size="sm" />
              )}
              <DemoBadge label={`Ref: ${appointmentId}`} />
            </div>
            <p className="text-xs text-[#475569]">
              Peer-to-peer WebRTC consultation room. User: <strong>{user?.fullName || "Authenticated User"}</strong> ({role})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="danger" size="sm" onClick={handleLeaveCall}>
              <PhoneOff className="w-3.5 h-3.5 mr-1.5" />
              Leave Consultation
            </Button>
          </div>
        </div>

        {/* Security / Token Notice */}
        {tokenInfo && (
          <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#D8E2EA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#0B1F33]">
              <Lock className="w-4 h-4 text-[#0E7490]" />
              <span>
                Room: <strong>{tokenInfo.room_name}</strong> • Authorized User: <strong>{user?.fullName}</strong> ({tokenInfo.role})
              </span>
            </div>
            <div className="flex items-center gap-2 text-[#64748B] text-[11px]">
              <Users className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Participants in Room: <strong>{peerCount}</strong> • State: {connectionState}</span>
            </div>
          </div>
        )}

        {/* Media Error Warning */}
        {mediaError && (
          <div className="p-4 bg-[#B42318]/10 border border-[#B42318]/30 rounded-2xl flex items-center gap-3 text-xs font-semibold text-[#B42318]">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div className="flex-1">{mediaError}</div>
            <Button size="sm" variant="outline" onClick={startMediaAndSignaling}>
              Retry Media &amp; Connection
            </Button>
          </div>
        )}

        {/* Main Video Call Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Stream Container (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-video bg-[#0B1F33] rounded-3xl overflow-hidden shadow-2xl border border-[#132E4A] flex items-center justify-center">
              {/* Primary Video: Remote Stream (if 2 participants) else Local Stream */}
              {remoteStream && isPeerConnected ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-opacity ${cameraActive && localStream ? "opacity-100" : "opacity-0"}`}
                />
              )}

              {/* Video Disabled / Waiting Placeholder */}
              {(!localStream || !cameraActive || (peerCount < 2 && !remoteStream)) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 text-white p-6 text-center bg-[#0B1F33]/85 backdrop-blur-sm">
                  <div className="w-16 h-16 rounded-full bg-[#132E4A] flex items-center justify-center text-[#22C1DC]">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">
                      {role === "doctor" ? patientName : doctorName}
                    </h3>
                    <p className="text-xs text-[#94A3B8] mt-1">
                      {mediaError
                        ? mediaError
                        : !localStream
                        ? "Connecting local media stream..."
                        : peerCount < 2
                        ? `Waiting for ${role === "doctor" ? "patient" : "attending physician"} to join room (${tokenInfo?.room_name || appointmentId})...`
                        : "Video stream paused"}
                    </p>
                  </div>
                </div>
              )}

              {/* PIP Thumbnail for Local Video when Remote Stream is active */}
              {remoteStream && isPeerConnected && localStream && (
                <div className="absolute top-4 right-4 w-40 aspect-video bg-black rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Live Overlay Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#0B1F33]/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-xs font-semibold border border-white/10">
                <span className={`w-2.5 h-2.5 rounded-full ${peerCount >= 2 ? "bg-[#0F766E] animate-ping" : "bg-[#B45309]"}`} />
                <span>
                  {remoteStream && isPeerConnected
                    ? role === "doctor" ? `Patient Stream: ${patientName}` : `Clinician Stream: ${doctorName}`
                    : `Local Preview (${(role ?? "").toUpperCase()})`}
                </span>
              </div>

              {/* Controls Overlay Bar */}
              <div className="absolute bottom-6 inset-x-0 flex justify-center items-center gap-4 px-4">
                <div className="flex items-center gap-3 bg-[#0B1F33]/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 shadow-2xl">
                  <button
                    type="button"
                    onClick={toggleMic}
                    className={`p-3 rounded-xl transition-all ${
                      micActive ? "bg-[#132E4A] text-white hover:bg-[#1E436B]" : "bg-[#B42318] text-white"
                    }`}
                    aria-label={micActive ? "Mute Microphone" : "Unmute Microphone"}
                  >
                    {micActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </button>

                  <button
                    type="button"
                    onClick={toggleCamera}
                    className={`p-3 rounded-xl transition-all ${
                      cameraActive ? "bg-[#132E4A] text-white hover:bg-[#1E436B]" : "bg-[#B42318] text-white"
                    }`}
                    aria-label={cameraActive ? "Disable Camera" : "Enable Camera"}
                  >
                    {cameraActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleLeaveCall}
                    className="p-3 bg-[#B42318] text-white rounded-xl hover:bg-[#991B1B] transition-colors"
                    aria-label="End Consultation"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Consultation Notes & Patient Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="font-bold text-sm text-[#0B1F33]">Consultation Information</h3>

              <div className="space-y-3 text-xs text-[#475569]">
                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
                  <span className="text-[#64748B] block">Patient Name:</span>
                  <span className="font-bold text-[#0B1F33]">{patientName}</span>
                </div>

                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
                  <span className="text-[#64748B] block">Attending Clinician:</span>
                  <span className="font-bold text-[#0B1F33]">{doctorName}</span>
                </div>

                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
                  <span className="text-[#64748B] block">Appointment Session ID:</span>
                  <span className="font-mono text-[#0E7490] font-bold">{appointmentId}</span>
                </div>

                <div className="pt-2 border-t border-[#F1F5F9] space-y-2">
                  <a
                    href={api.getReportPdfUrl(assessmentId)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B1F33] text-white text-xs font-semibold hover:bg-[#132E4A] transition-colors"
                  >
                    Open Patient PDF Clinical Report
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

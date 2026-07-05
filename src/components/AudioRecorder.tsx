import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Upload, Trash2, AlertCircle } from 'lucide-react';

interface AudioRecorderProps {
  onAudioSaved: (base64Audio: string, audioName: string, duration: number) => void;
  savedAudioUrl?: string;
  savedAudioName?: string;
  onClearAudio?: () => void;
}

export default function AudioRecorder({
  onAudioSaved,
  savedAudioUrl,
  savedAudioName,
  onClearAudio,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(savedAudioUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setPlaybackUrl(savedAudioUrl || null);
  }, [savedAudioUrl]);

  // Clean up timers and players on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    audioChunksRef.current = [];
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          onAudioSaved(base64data, `Cold_Call_Record_${new Date().toISOString().slice(0, 10)}.webm`, recordingTime);
          setPlaybackUrl(base64data);
        };
        
        // Stop all stream tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Could not access microphone. Please grant permissions or upload an audio file.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setErrorMsg('Please select a valid audio file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64data = event.target.result as string;
        // Estimate file duration as 10s if we can't extract, or load into audio element to get actual
        const tempAudio = new Audio(base64data);
        tempAudio.onloadedmetadata = () => {
          onAudioSaved(base64data, file.name, Math.round(tempAudio.duration || 5));
          setPlaybackUrl(base64data);
          setErrorMsg(null);
        };
      }
    };
    reader.readAsDataURL(file);
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current && playbackUrl) {
      const player = new Audio(playbackUrl);
      player.onended = () => setIsPlaying(false);
      audioPlayerRef.current = player;
    }

    if (audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
        setIsPlaying(false);
      } else {
        audioPlayerRef.current.play().catch(err => {
          console.error(err);
          setErrorMsg('Error playing audio.');
        });
        setIsPlaying(true);
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const clearAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setIsPlaying(false);
    setPlaybackUrl(null);
    if (onClearAudio) onClearAudio();
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">Cold Call Audio Recording</span>
        {playbackUrl && (
          <button
            type="button"
            onClick={clearAudio}
            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium transition-colors"
          >
            <Trash2 size={13} />
            Delete
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2.5 text-xs">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!playbackUrl ? (
        <div className="flex flex-col sm:flex-row items-center gap-4 py-2">
          {/* Recorder Button */}
          {isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="w-full sm:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 text-sm transition-colors animate-pulse"
            >
              <Square size={16} />
              Stop Recording ({formatTime(recordingTime)})
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="w-full sm:w-auto px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 text-sm transition-colors"
            >
              <Mic size={16} />
              Start Mic Recording
            </button>
          )}

          <div className="text-xs text-slate-400 font-medium sm:block hidden">OR</div>

          {/* File Upload Option */}
          <label className="w-full sm:w-auto cursor-pointer px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium flex items-center justify-center gap-2 text-sm transition-colors shadow-xs">
            <Upload size={16} className="text-slate-500" />
            Upload Call Audio File
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-lg shadow-2xs">
          <button
            type="button"
            onClick={togglePlayback}
            className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 flex items-center justify-center transition-colors shrink-0"
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} className="ml-0.5" fill="currentColor" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate" title={savedAudioName}>
              {savedAudioName || 'Cold Call Audio'}
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              Saved Successfully
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

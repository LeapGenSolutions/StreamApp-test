import { useState, useEffect } from "react";
import { X, Mic, Video, PhoneOff, Monitor, MessageSquare } from "lucide-react";
import { Button } from "../../ui/button";
import { useToast } from "../hooks/use-toast";

function VideoCallModal({
  isOpen,
  onClose,
  patientName,
  patientImage,
  providerName,
  providerImage,
}) {
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  const handleToggleMic = () => {
    setIsMicMuted(!isMicMuted);
    toast({
      title: isMicMuted ? "Microphone unmuted" : "Microphone muted",
      duration: 2000,
    });
  };

  const handleToggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    toast({
      title: isVideoOff ? "Camera turned on" : "Camera turned off",
      duration: 2000,
    });
  };

  const handleEndCall = () => {
    toast({
      title: "Call ended",
      description: "The video call has been disconnected",
      duration: 3000,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden">
        <div className="bg-primary-500 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Video className="w-6 h-6 mr-2" />
            <h3 className="text-lg font-semibold">
              Video Call with {patientName}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:text-neutral-200 focus:outline-none"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 bg-neutral-100 rounded-lg overflow-hidden h-80 relative">
              {isVideoOff ? (
                <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                  <div className="text-white text-center">
                    <Video className="w-16 h-16 mx-auto text-neutral-500 mb-2" />
                    <p>Camera is turned off</p>
                  </div>
                </div>
              ) : patientImage ? (
                <img
                  src={patientImage}
                  alt={`${patientName} video feed`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                  <div className="w-24 h-24 rounded-full bg-primary-500 flex items-center justify-center text-white text-4xl font-medium">
                    {patientName.charAt(0)}
                  </div>
                </div>
              )}
              <div className="absolute bottom-4 left-4 bg-white text-neutral-800 px-2 py-1 rounded text-xs font-medium">
                {patientName}
              </div>
            </div>

            <div className="bg-neutral-800 rounded-lg overflow-hidden h-80 relative">
              {providerImage ? (
                <img
                  src={providerImage}
                  alt={`${providerName} video feed`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center text-white text-2xl font-medium">
                    {providerName.charAt(0)}
                  </div>
                </div>
              )}
              <div className="absolute bottom-4 left-4 bg-white text-neutral-800 px-2 py-1 rounded text-xs font-medium">
                {providerName}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center space-x-4">
            <Button
              variant={isMicMuted ? "outline" : "secondary"}
              size="icon"
              className="rounded-full p-3 h-auto w-auto"
              onClick={handleToggleMic}
            >
              <Mic className="w-6 h-6" />
            </Button>

            <Button
              variant={isVideoOff ? "outline" : "secondary"}
              size="icon"
              className="rounded-full p-3 h-auto w-auto"
              onClick={handleToggleVideo}
            >
              <Video className="w-6 h-6" />
            </Button>

            <Button
              variant="destructive"
              size="icon"
              className="rounded-full p-3 h-auto w-auto"
              onClick={handleEndCall}
            >
              <PhoneOff className="w-6 h-6" />
            </Button>

            <Button
              variant="secondary"
              size="icon"
              className="rounded-full p-3 h-auto w-auto"
            >
              <Monitor className="w-6 h-6" />
            </Button>

            <Button
              variant="secondary"
              size="icon"
              className="rounded-full p-3 h-auto w-auto"
            >
              <MessageSquare className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoCallModal;

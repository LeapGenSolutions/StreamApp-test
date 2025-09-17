import { useEffect } from 'react';
import {
  StreamVideoClient,
  StreamCall,
  useStreamVideoClient,
  StreamVideoProvider,
} from '@stream-io/video-react-sdk';
import StreamVideoUI from './StreamVideoUI';

const apiKey = 'mmhfdzb5evj2';
const userToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Byb250by5nZXRzdHJlYW0uaW8iLCJzdWIiOiJ1c2VyL1lvZGEiLCJ1c2VyX2lkIjoiWW9kYSIsInZhbGlkaXR5X2luX3NlY29uZHMiOjYwNDgwMCwiaWF0IjoxNzQ3NzkxNTA4LCJleHAiOjE3NDgzOTYzMDh9.Qr8axoKCbQT06x01cllnKE3mYNYqeYvUZReUhNkUeok';
const userId = 'Yoda';
const callId = 'R3JIvvak1W0W';

const client = new StreamVideoClient({
  apiKey,
  user: {
    id: userId,
    name: 'Guest User',
  },
  token: userToken,
});

const StreamVideoCore = () => {
  return (
    <StreamVideoProvider client={client}>
      <CallComponent />
    </StreamVideoProvider>
  );
};

const CallComponent = () => {
  const videoClient = useStreamVideoClient();
  const call = videoClient.call('default', callId);

  useEffect(() => {
    call.join({create:true});
    return () => call.leave();
  }, [call]);

  return (
    <StreamCall call={call}>
      <StreamVideoUI />
    </StreamCall>
  );
};

export default StreamVideoCore;

import { Room, RoomEvent, createLocalAudioTrack } from '@livekit/client'

export async function connectAndPublishAudio(url: string, token: string, stream: MediaStream) {
  const room = new Room()
  await room.connect(url, token)
  const track = await createLocalAudioTrack({ microphone: { stream } as any })
  await room.localParticipant.publishTrack(track)
  return room
}

export async function connectAndSubscribe(url: string, token: string, onAudio: (el: HTMLAudioElement) => void) {
  const room = new Room()
  room.on(RoomEvent.TrackSubscribed, (_track, publication, participant) => {
    const el = publication.track?.attach()
    if (el) onAudio(el)
  })
  await room.connect(url, token)
  return room
}

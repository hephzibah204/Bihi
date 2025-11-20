export async function connectAndPublishAudio(url: string, token: string, stream: MediaStream) {
  const mod: any = await import('@livekit/client').catch(() => ({}))
  const Room = mod.Room
  const createLocalAudioTrack = mod.createLocalAudioTrack
  const LocalAudioTrack = mod.LocalAudioTrack
  if (!Room) throw new Error('livekit_client_unavailable')
  const room = new Room()
  await room.connect(url, token)
  let track: any
  if (typeof createLocalAudioTrack === 'function') {
    track = await createLocalAudioTrack({ microphone: { stream } as any })
  } else if (LocalAudioTrack) {
    const t = stream.getAudioTracks()[0]
    track = new LocalAudioTrack(t)
  } else {
    throw new Error('livekit_track_unavailable')
  }
  await room.localParticipant.publishTrack(track)
  return room
}

export async function connectAndSubscribe(url: string, token: string, onAudio: (el: HTMLAudioElement) => void) {
  const mod: any = await import('@livekit/client').catch(() => ({}))
  const Room = mod.Room
  const RoomEvent = mod.RoomEvent
  if (!Room) throw new Error('livekit_client_unavailable')
  const room = new Room()
  if (RoomEvent) {
    room.on(RoomEvent.TrackSubscribed, (_track: any, publication: any) => {
      const el = publication.track?.attach()
      if (el) onAudio(el)
    })
  } else {
    // Fallback: attach on publication available
    room.on('trackSubscribed' as any, (_track: any, publication: any) => {
      const el = publication.track?.attach()
      if (el) onAudio(el)
    })
  }
  await room.connect(url, token)
  return room
}
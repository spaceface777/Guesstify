import { toggleNowPlaying } from '../logic'

(async () => {
  while (
    !(
      Spicetify?.Platform &&
      Spicetify?.ContextMenu &&
      Spicetify?.URI &&
      Spicetify?.showNotification
    )
  ) {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  console.log('running guesstify extension')

  // Show/hide the now playing info on navigation
  Spicetify.Platform.History.listen((data: { pathname: string }) => {
    console.log('History changed', data)

    const onApp = data.pathname.indexOf('guesstify') != -1
    toggleNowPlaying(!onApp)
  })

  function sendToApp(URIs: string[]) {
    Spicetify.showNotification(`Sending ${URIs.length} URIs to Guesstify`)
    console.log('Sending URIs:', URIs)
    // example artist: spotify:artist:5k979N1TnPncUyqlXlaRSv
    // example playlist: spotify:playlist:37i9dQZF1DZ06evO38b2WA

    URIs.forEach((uri) => {
      const uriObj = Spicetify.URI.fromString(uri)
      console.log('uriObj:', uriObj)
    })

    // TODO: If artist, add tracks from artist
    // TODO: If album, add tracks from album
    // TODO: If playlist, add tracks from playlist
    // TODO: Other sources?

    // Ooh, I can just use Spicetify.Player.playUri(uri) and it will work with whatever you send it!

    Spicetify.Platform.History.push({
      pathname: '/guesstify',
      state: {
        URIs,
      },
    })
  }

  function shouldDisplayContextMenu(URIs: string[]) {
    if (URIs.length === 1) {
      const uriObj = Spicetify.URI.fromString(URIs[0])
      switch (uriObj.type) {
      case Spicetify.URI.Type.SHOW:
      case Spicetify.URI.Type.PLAYLIST:
      case Spicetify.URI.Type.PLAYLIST_V2:
      case Spicetify.URI.Type.FOLDER:
      case Spicetify.URI.Type.ALBUM:
      case Spicetify.URI.Type.COLLECTION:
      case Spicetify.URI.Type.ARTIST:
        return true
      }
      return false
    }
    // User selects multiple tracks in a list.
    return true
  }

  const contextMenuItem = new Spicetify.ContextMenu.Item(
    'Play Guesstify',
    sendToApp,
    shouldDisplayContextMenu,
    'gamepad' as Spicetify.ContextMenu.Icon,
    // 'chevron-right',
    // 'play',
  )

  contextMenuItem.register()
})()

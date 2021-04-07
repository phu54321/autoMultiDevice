const audioDevices = require('macos-audio-devices')
const notifier = require('node-notifier')

async function amdNotify (message) {
  notifier.notify({
    title: 'AutoMultiDevice',
    message: message
  })
}

;(async function () {
  const outputDevices = await audioDevices.getOutputDevices()
  const defaultDevice = await audioDevices.getDefaultOutputDevice()

  for (const v of outputDevices) {
    if (v.transportType === 'aggregate' && v.id === defaultDevice.id) {
      await audioDevices.destroyAggregateDevice(v.id)
      await amdNotify('Record mode off.')
      return 0
    }
  }

  const uidList = [
    'BlackHole2ch_UID',
    'BlackHole_UID',
    'SoundflowerEngine:0"'
  ]

  let outputDevice = null

  for (const v of outputDevices) {
    if (uidList.indexOf(v.uid) !== -1) {
      outputDevice = v
      break
    }
  }

  if (outputDevice !== -1) {
    if (outputDevice.id === defaultDevice.id) {
      await amdNotify('Current output device is already for recordings. (BlackHole, Soundflower, etc...)')
      return -1
    }
    const device = await audioDevices.createAggregateDevice('Multi-output device', outputDevice.id, [defaultDevice.id], { multiOutput: true })
    await audioDevices.setDefaultOutputDevice(device.id)
    amdNotify('Created multi-output device.')
  } else {
    amdNotify('Cannot find suitable output device for recordings. (BlackHole, Soundflower, etc...)')
    return -2
  }
})().then(errCode => process.exit(errCode))

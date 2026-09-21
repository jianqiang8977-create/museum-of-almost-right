import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'e1rm1vsv',
    dataset: 'production'
  },
  deployment: {
    appId: 'k2pjbtwyrcm9chb4d17ja9pn',
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: false,
  },
})

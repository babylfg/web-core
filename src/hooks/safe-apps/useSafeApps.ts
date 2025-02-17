import { useMemo, useCallback } from 'react'
import type { SafeAppData } from '@gnosis.pm/safe-react-gateway-sdk'
import { useRemoteSafeApps } from '@/hooks/safe-apps/useRemoteSafeApps'
import { useCustomSafeApps } from '@/hooks/safe-apps/useCustomSafeApps'
import { usePinnedSafeApps } from '@/hooks/safe-apps/usePinnedSafeApps'
import { useBrowserPermissions, useSafePermissions } from './permissions'
import { useRankedSafeApps } from '@/hooks/safe-apps/useRankedSafeApps'
import { SAFE_APPS_EVENTS, trackEvent } from '@/services/analytics'

type ReturnType = {
  allSafeApps: SafeAppData[]
  pinnedSafeApps: SafeAppData[]
  pinnedSafeAppIds: Set<number>
  remoteSafeApps: SafeAppData[]
  customSafeApps: SafeAppData[]
  rankedSafeApps: SafeAppData[]
  remoteSafeAppsLoading: boolean
  customSafeAppsLoading: boolean
  remoteSafeAppsError?: Error
  addCustomApp: (app: SafeAppData) => void
  togglePin: (appId: number) => void
  removeCustomApp: (appId: number) => void
}

const useSafeApps = (): ReturnType => {
  const [remoteSafeApps = [], remoteSafeAppsError, remoteSafeAppsLoading] = useRemoteSafeApps()
  const { customSafeApps, loading: customSafeAppsLoading, updateCustomSafeApps } = useCustomSafeApps()
  const { pinnedSafeAppIds, updatePinnedSafeApps } = usePinnedSafeApps()
  const { removePermissions: removeSafePermissions } = useSafePermissions()
  const { removePermissions: removeBrowserPermissions } = useBrowserPermissions()

  const allSafeApps = useMemo(
    () => remoteSafeApps.concat(customSafeApps).sort((a, b) => a.name.localeCompare(b.name)),
    [remoteSafeApps, customSafeApps],
  )

  const pinnedSafeApps = useMemo(
    () => remoteSafeApps.filter((app) => pinnedSafeAppIds.has(app.id)),
    [remoteSafeApps, pinnedSafeAppIds],
  )

  const rankedSafeApps = useRankedSafeApps(allSafeApps, pinnedSafeApps)

  const addCustomApp = useCallback(
    (app: SafeAppData) => {
      updateCustomSafeApps([...customSafeApps, app])
    },
    [updateCustomSafeApps, customSafeApps],
  )

  const removeCustomApp = useCallback(
    (appId: number) => {
      updateCustomSafeApps(customSafeApps.filter((app) => app.id !== appId))
      const app = customSafeApps.find((app) => app.id === appId)

      if (app) {
        removeSafePermissions(app.url)
        removeBrowserPermissions(app.url)
      }
    },
    [updateCustomSafeApps, customSafeApps, removeSafePermissions, removeBrowserPermissions],
  )

  const togglePin = (appId: number) => {
    const alreadyPinned = pinnedSafeAppIds.has(appId)
    const newSet = new Set(pinnedSafeAppIds)
    const appName = allSafeApps.find((app) => app.id === appId)?.name

    if (alreadyPinned) {
      newSet.delete(appId)
      trackEvent({ ...SAFE_APPS_EVENTS.UNPIN, label: appName })
    } else {
      newSet.add(appId)
      trackEvent({ ...SAFE_APPS_EVENTS.PIN, label: appName })
    }
    updatePinnedSafeApps(newSet)
  }

  return {
    allSafeApps,
    remoteSafeApps,
    pinnedSafeApps,
    pinnedSafeAppIds,
    customSafeApps,
    rankedSafeApps,
    remoteSafeAppsLoading,
    customSafeAppsLoading,
    remoteSafeAppsError,
    addCustomApp,
    removeCustomApp,
    togglePin,
  }
}

export { useSafeApps }

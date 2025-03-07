import { useCallback } from 'react'
import type { SubmitHandler } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import {
  DialogActions,
  DialogContent,
  Typography,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Link,
  Box,
  FormHelperText,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import type { SafeAppData } from '@gnosis.pm/safe-react-gateway-sdk'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import ModalDialog from '@/components/common/ModalDialog'
import { isValidURL } from '@/utils/validation'
import { useCurrentChain } from '@/hooks/useChains'
import useAsync from '@/hooks/useAsync'
import useDebounce from '@/hooks/useDebounce'
import { fetchSafeAppFromManifest } from '@/services/safe-apps/manifest'
import { SAFE_APPS_EVENTS, trackEvent } from '@/services/analytics'
import { trimTrailingSlash, isSameUrl } from '@/utils/url'
import { AppRoutes } from '@/config/routes'
import CustomAppPlaceholder from './CustomAppPlaceholder'
import CustomApp from './CustomApp'

import css from './styles.module.css'

type Props = {
  open: boolean
  onClose: () => void
  onSave: (data: SafeAppData) => void
  // A list of safe apps to check if the app is already there
  safeAppsList: SafeAppData[]
}

type CustomAppFormData = {
  appUrl: string
  riskAcknowledgement: boolean
  safeApp: SafeAppData
}

const HELP_LINK = 'https://docs.gnosis-safe.io/build/sdks/safe-apps'

export const AddCustomAppModal = ({ open, onClose, onSave, safeAppsList }: Props) => {
  const currentChain = useCurrentChain()
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setError,
    reset,
  } = useForm<CustomAppFormData>({ defaultValues: { riskAcknowledgement: false }, mode: 'onChange' })

  const onSubmit: SubmitHandler<CustomAppFormData> = (_, __) => {
    if (safeApp) {
      onSave(safeApp)
      trackEvent(SAFE_APPS_EVENTS.ADD_CUSTOM_APP)
      reset()
      onClose()
    }
  }

  const appUrl = watch('appUrl')
  const debouncedUrl = useDebounce(trimTrailingSlash(appUrl || ''), 300)

  const [safeApp] = useAsync<SafeAppData | undefined>(() => {
    if (!isValidURL(debouncedUrl)) return

    return fetchSafeAppFromManifest(debouncedUrl, currentChain?.chainId || '').catch(() => {
      setError('appUrl', { type: 'custom', message: "The app doesn't support Safe App functionality" })
      return undefined
    })
  }, [currentChain, debouncedUrl])

  const handleClose = () => {
    reset()
    onClose()
  }

  const isAppAlreadyInTheList = useCallback(
    (appUrl: string) => safeAppsList.some((app) => isSameUrl(app.url, appUrl)),
    [safeAppsList],
  )

  const shareUrl = `${window.location.origin}${AppRoutes.share.safeApp}?appUrl=${encodeURIComponent(
    safeApp?.url || '',
  )}&chain=${currentChain?.shortName}`
  const isSafeAppValid = isValid && safeApp
  const isCustomAppInTheDefaultList = errors?.appUrl?.type === 'alreadyExists'

  return (
    <ModalDialog open={open} onClose={handleClose} dialogTitle="Add custom app">
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent className={css.addCustomAppContainer}>
          <div className={css.addCustomAppFields}>
            <TextField
              required
              label="App URL"
              error={errors?.appUrl?.type === 'validUrl'}
              helperText={errors?.appUrl?.type === 'validUrl' && errors?.appUrl?.message}
              autoComplete="off"
              {...register('appUrl', {
                required: true,
                validate: {
                  validUrl: (val: string) => (isValidURL(val) ? undefined : 'Invalid URL'),
                  alreadyExists: (val: string) =>
                    isAppAlreadyInTheList(val) ? 'This app is already in the list' : undefined,
                },
              })}
            />
            <Box mt={2}>
              {safeApp ? (
                <>
                  <CustomApp safeApp={safeApp} shareUrl={isCustomAppInTheDefaultList ? shareUrl : ''} />
                  {isCustomAppInTheDefaultList ? (
                    <Box display="flex" mt={2} alignItems="center">
                      <CheckIcon color="success" />
                      <Typography ml={1}>This app is already registered</Typography>
                    </Box>
                  ) : (
                    <>
                      <FormControlLabel
                        aria-required
                        control={
                          <Checkbox
                            {...register('riskAcknowledgement', {
                              required: true,
                            })}
                          />
                        }
                        label="This app is not part of Safe and I agree to use it at my own risk."
                        sx={{ mt: 2 }}
                      />

                      {errors.riskAcknowledgement && (
                        <FormHelperText error>Accepting the disclaimer is mandatory</FormHelperText>
                      )}
                    </>
                  )}
                </>
              ) : (
                <CustomAppPlaceholder error={errors?.appUrl?.type === 'custom' ? errors.appUrl.message : ''} />
              )}
            </Box>
          </div>

          <div className={css.addCustomAppHelp}>
            <InfoOutlinedIcon className={css.addCustomAppHelpIcon} />
            <Typography ml={0.5}>Learn more about building</Typography>
            <Link
              className={css.addCustomAppHelpLink}
              href={HELP_LINK}
              target="_blank"
              rel="noreferrer"
              fontWeight={700}
            >
              Safe Apps.
            </Link>
          </div>
        </DialogContent>

        <DialogActions disableSpacing>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={!isSafeAppValid}>
            Add
          </Button>
        </DialogActions>
      </form>
    </ModalDialog>
  )
}

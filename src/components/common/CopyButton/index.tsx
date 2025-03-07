import type { ReactNode } from 'react'
import React, { type ReactElement, type SyntheticEvent, useCallback, useState } from 'react'
import CopyIcon from '@/public/images/sidebar/copy.svg'
import { IconButton, SvgIcon, Tooltip } from '@mui/material'

const CopyButton = ({
  text,
  className,
  children,
  initialToolTipText = 'Copy to clipboard',
}: {
  text: string
  className?: string
  children?: ReactNode
  initialToolTipText?: string
  ariaLabel?: string
}): ReactElement => {
  const [tooltipText, setTooltipText] = useState(initialToolTipText)

  const handleCopy = useCallback(
    (e: SyntheticEvent) => {
      e.preventDefault()
      e.stopPropagation()
      navigator.clipboard.writeText(text).then(() => setTooltipText('Copied'))
    },
    [text],
  )

  const handleMouseLeave = useCallback(() => {
    setTimeout(() => setTooltipText(initialToolTipText), 500)
  }, [initialToolTipText])

  return (
    <Tooltip title={tooltipText} placement="top" onMouseLeave={handleMouseLeave}>
      <IconButton aria-label={initialToolTipText} onClick={handleCopy} size="small" className={className}>
        {children ?? (
          <SvgIcon
            component={CopyIcon}
            inheritViewBox
            color="primary"
            fontSize="small"
            sx={{
              '& path': {
                fill: ({ palette }) => palette.border.main,
              },
            }}
          />
        )}
      </IconButton>
    </Tooltip>
  )
}

export default CopyButton

import React, { type ReactElement } from 'react'
import type { TransactionDetails, TransactionSummary } from '@gnosis.pm/safe-react-gateway-sdk'
import { getTransactionDetails, Operation } from '@gnosis.pm/safe-react-gateway-sdk'
import { Box, CircularProgress } from '@mui/material'

import TxSigners from '@/components/transactions/TxSigners'
import Summary from '@/components/transactions/TxDetails/Summary'
import TxData from '@/components/transactions/TxDetails/TxData'
import useChainId from '@/hooks/useChainId'
import useAsync from '@/hooks/useAsync'
import {
  isAwaitingExecution,
  isModuleExecutionInfo,
  isMultiSendTxInfo,
  isMultisigExecutionInfo,
  isSupportedMultiSendAddress,
  isTxQueued,
} from '@/utils/transaction-guards'
import { InfoDetails } from '@/components/transactions/InfoDetails'
import EthHashInfo from '@/components/common/EthHashInfo'
import css from './styles.module.css'
import ErrorMessage from '@/components/tx/ErrorMessage'
import TxShareLink from '../TxShareLink'
import { ErrorBoundary } from '@sentry/react'
import ExecuteTxButton from '@/components/transactions/ExecuteTxButton'
import SignTxButton from '@/components/transactions/SignTxButton'
import RejectTxButton from '@/components/transactions/RejectTxButton'
import useWallet from '@/hooks/wallets/useWallet'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import { DelegateCallWarning } from '@/components/transactions/Warning'
import Multisend from '@/components/transactions/TxDetails/TxData/DecodedData/Multisend'

export const NOT_AVAILABLE = 'n/a'

type TxDetailsProps = {
  txSummary: TransactionSummary
  txDetails: TransactionDetails
}

const TxDetailsBlock = ({ txSummary, txDetails }: TxDetailsProps): ReactElement => {
  const chainId = useChainId()
  const wallet = useWallet()
  const isWrongChain = useIsWrongChain()
  const isQueue = isTxQueued(txSummary.txStatus)
  const awaitingExecution = isAwaitingExecution(txSummary.txStatus)
  // confirmations are in detailedExecutionInfo
  const hasSigners = isMultisigExecutionInfo(txSummary.executionInfo) && txSummary.executionInfo.confirmationsRequired

  return (
    <>
      {/* /Details */}
      <div className={`${css.details} ${!hasSigners ? css.noSigners : ''}`}>
        <div className={css.shareLink}>
          <TxShareLink id={txSummary.id} />
        </div>

        <div className={css.txData}>
          <ErrorBoundary fallback={<div>Error parsing data</div>}>
            <TxData txDetails={txDetails} />
          </ErrorBoundary>
        </div>

        {/* Module information*/}
        {isModuleExecutionInfo(txSummary.executionInfo) && (
          <div className={css.txModule}>
            <InfoDetails title="Module:">
              <EthHashInfo
                address={txSummary.executionInfo.address.value}
                shortAddress={false}
                showCopyButton
                hasExplorer
              />
            </InfoDetails>
          </div>
        )}

        <div className={css.txSummary}>
          {txDetails.txData?.operation === Operation.DELEGATE && (
            <div className={css.delegateCall}>
              <DelegateCallWarning showWarning={!txDetails.txData.trustedDelegateCallTarget} />
            </div>
          )}
          <Summary txDetails={txDetails} />
        </div>

        {isSupportedMultiSendAddress(txDetails.txInfo, chainId) && isMultiSendTxInfo(txDetails.txInfo) && (
          <div className={`${css.multiSend}`}>
            <ErrorBoundary fallback={<div>Error parsing data</div>}>
              <Multisend txData={txDetails.txData} />
            </ErrorBoundary>
          </div>
        )}
      </div>

      {/* Signers */}
      {hasSigners && (
        <div className={css.txSigners}>
          <TxSigners txDetails={txDetails} txSummary={txSummary} />
          {wallet && !isWrongChain && isQueue && (
            <Box display="flex" alignItems="center" justifyContent="center" gap={1} mt={2}>
              {awaitingExecution ? <ExecuteTxButton txSummary={txSummary} /> : <SignTxButton txSummary={txSummary} />}
              <RejectTxButton txSummary={txSummary} />
            </Box>
          )}
        </div>
      )}
    </>
  )
}

const TxDetails = ({
  txSummary,
  txDetails,
}: {
  txSummary: TransactionSummary
  txDetails?: TransactionDetails // optional
}): ReactElement => {
  const chainId = useChainId()

  const [txDetailsData, error, loading] = useAsync<TransactionDetails>(async () => {
    return txDetails || getTransactionDetails(chainId, txSummary.id)
  }, [txDetails, chainId, txSummary.id])

  return (
    <div className={css.container}>
      {txDetailsData && <TxDetailsBlock txSummary={txSummary} txDetails={txDetailsData} />}
      {loading && (
        <div className={css.loading}>
          <CircularProgress />
        </div>
      )}
      {error && (
        <div className={css.error}>
          <ErrorMessage error={error}>Couldn&apos;t load the transaction details</ErrorMessage>
        </div>
      )}
    </div>
  )
}

export default TxDetails

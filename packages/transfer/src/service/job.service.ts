import {
  config,
  ETH_TOKEN_INDEX,
  formatAndLogAddresses,
  INTMAXClient,
  logger,
} from "@intmax2-e2e/shared";

export const performJob = async (): Promise<void> => {
  const intmaxClient = INTMAXClient.getInstance();
  await intmaxClient.login();

  formatAndLogAddresses(intmaxClient.getAddresses());

  const transferResult = await intmaxClient.transfer([
    {
      tokenIndex: ETH_TOKEN_INDEX,
      amount: config.TRANSFER_AMOUNT,
      recipient: config.RECIPIENT_INTMAX2_ADDRESS ?? intmaxClient.getAddresses()?.intmaxAddress,
    },
  ]);
  logger.info(`TxRoot ${transferResult.txTreeRoot}`);

  const confirmationResult = await intmaxClient.waitForTransactionConfirmation(transferResult);
  if (confirmationResult.status !== "success") {
    throw new Error(`Transfer transaction confirmation failed: ${confirmationResult.status}`);
  }

  logger.info("Transfer transaction confirmed");
};

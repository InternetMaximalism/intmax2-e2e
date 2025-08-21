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

  const withdrawResult = await intmaxClient.withdraw({
    tokenIndex: ETH_TOKEN_INDEX,
    amount: config.WITHDRAW_AMOUNT,
    recipient: intmaxClient.getAddresses()?.ethAddress,
  });
  logger.info(`TxRoot ${withdrawResult.txTreeRoot}`);
};

import { logger, INTMAXClient, ETH_TOKEN_INDEX, formatAndLogAddresses } from "@intmax2-e2e/shared";

export const performJob = async (): Promise<void> => {
  const intmaxClient = INTMAXClient.getInstance();
  await intmaxClient.login();

  formatAndLogAddresses(intmaxClient.getAddresses());

  const depositResult = await intmaxClient.deposit({
    tokenIndex: ETH_TOKEN_INDEX,
    amount: 0.01,
  });
  logger.info(`Deposit TxHash: ${depositResult.txHash}`);
};

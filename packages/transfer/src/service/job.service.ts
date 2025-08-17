import { ETH_TOKEN_INDEX, formatAndLogAddresses, INTMAXClient, logger } from "@intmax2-e2e/shared";

export const performJob = async (): Promise<void> => {
  const intmaxClient = INTMAXClient.getInstance();
  await intmaxClient.login();

  formatAndLogAddresses(intmaxClient.getAddresses());

  const transferResult = await intmaxClient.transfer([
    {
      amount: 0.00001,
      tokenIndex: ETH_TOKEN_INDEX,
      recipient: intmaxClient.getAddresses()?.intmaxAddress,
    },
  ]);
  logger.info(`TxRoot ${transferResult.txTreeRoot}`);
};

import {
  fetchAvailableTokens,
  fetchEthereumBalance,
  fetchINTMAXBalances,
  initializeClient,
  loginAndLogAddresses,
} from "./intmax.service";

export const performJob = async (): Promise<void> => {
  const client = initializeClient();

  const { account } = await loginAndLogAddresses(client);

  await fetchEthereumBalance(account);

  await fetchINTMAXBalances(client);

  await fetchAvailableTokens(client);
};

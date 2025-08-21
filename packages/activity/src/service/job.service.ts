import {
  formatAndActivities,
  formatAndLogAddresses,
  formatAndLogINTMAXBalances,
  INTMAXClient,
  logEthereumBalance,
  logger,
} from "@intmax2-e2e/shared";

export const performJob = async (): Promise<void> => {
  const intmaxClient = INTMAXClient.getInstance();
  await intmaxClient.login();

  formatAndLogAddresses(intmaxClient.getAddresses());

  const ethBalance = await intmaxClient.fetchEthereumBalance();
  logEthereumBalance(ethBalance);

  const intmaxBalances = await intmaxClient.fetchINTMAXBalances();
  formatAndLogINTMAXBalances(intmaxBalances);

  console.log("1");
  const { accountSummary } = await fetchAllAccountActivity(intmaxClient);
  console.log("2");
  formatAndActivities(accountSummary);
  console.log("3");

  logger.info("Syncing account balances");
  console.log("4");
  await intmaxClient.sync();
  logger.info("Account balances synced successfully");
  console.log("5");
};

const fetchAllAccountActivity = async (intmaxClient: INTMAXClient) => {
  const [deposits, withdrawals, transfers, transactions] = await Promise.all([
    intmaxClient.fetchDeposits(),
    intmaxClient.fetchWithdrawals(),
    intmaxClient.fetchTransfers(),
    intmaxClient.fetchTransactions(),
  ]);

  const withdrawalsSummary = {
    failed: withdrawals.withdrawals.failed?.length || 0,
    need_claim: withdrawals.withdrawals.need_claim?.length || 0,
    relayed: withdrawals.withdrawals.relayed?.length || 0,
    requested: withdrawals.withdrawals.requested?.length || 0,
    success: withdrawals.withdrawals.success?.length || 0,
  };

  const accountSummary = {
    deposits: deposits.pagination.total_count,
    withdrawals: withdrawalsSummary,
    transfers: transfers.pagination.total_count, // receive
    transactions: transactions.pagination.total_count, // send
  };

  return {
    deposits,
    withdrawals,
    transfers,
    transactions,
    accountSummary,
  };
};

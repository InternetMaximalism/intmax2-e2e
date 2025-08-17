import {
  formatAndActivities,
  formatAndLogAddresses,
  formatAndLogINTMAXBalances,
  INTMAXClient,
  logEthereumBalance,
} from "@intmax2-e2e/shared";

export const performJob = async (): Promise<void> => {
  const intmaxClient = INTMAXClient.getInstance();
  await intmaxClient.login();

  formatAndLogAddresses(intmaxClient.getAddresses());

  const ethBalance = await intmaxClient.fetchEthereumBalance();
  logEthereumBalance(ethBalance);

  const intmaxBalances = await intmaxClient.fetchINTMAXBalances();
  formatAndLogINTMAXBalances(intmaxBalances);

  await fetchAllAccountActivity(intmaxClient);
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

  formatAndActivities(accountSummary);

  return {
    deposits,
    withdrawals,
    transfers,
    transactions,
  };
};

import type { ClientAddresses } from "./../types";
import { logger } from "@intmax2-e2e/shared";
import type { TokenBalance } from "intmax2-server-sdk";

const formatTokenAmount = (amount: bigint, decimals: number) => {
  const divisor = BigInt(10) ** BigInt(decimals);
  const wholePart = amount / divisor;
  const fractionalPart = amount % divisor;

  if (fractionalPart === 0n) {
    return wholePart.toString();
  }

  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  const trimmedFractional = fractionalStr.replace(/0+$/, "");

  if (trimmedFractional === "") {
    return wholePart.toString();
  }

  return `${wholePart}.${trimmedFractional}`;
};

export const formatAndLogBalances = (balances: TokenBalance[]) => {
  if (!balances || balances.length === 0) {
    logger.debug("Token Balances: No balances found");
    return;
  }

  console.log("📊 Token Balances:");
  console.log("─".repeat(80));

  balances.forEach((balance, index) => {
    const { token, amount } = balance;

    const readableAmount = formatTokenAmount(amount, token.decimals!);

    const usdValue = token.price ? (parseFloat(readableAmount) * token.price).toFixed(2) : "N/A";

    console.log(`${index + 1}. ${token.symbol}`);
    console.log(`   Amount: ${readableAmount} ${token.symbol}`);
    console.log(`   USD Value: $${usdValue}`);
    console.log(`   Contract: ${token.contractAddress}`);
    console.log(`   Token Index: ${token.tokenIndex}`);
    console.log(`   Price: $${token.price || "N/A"}`);

    if (index < balances.length - 1) {
      console.log("─".repeat(40));
    }
  });

  console.log("─".repeat(80));

  const totalUsdValue = balances.reduce((total, balance) => {
    const readableAmount = formatTokenAmount(balance.amount, balance.token.decimals!);
    const usdValue = balance.token.price ? parseFloat(readableAmount) * balance.token.price : 0;
    return total + usdValue;
  }, 0);

  logger.debug(`Total Portfolio Value: $${totalUsdValue.toFixed(2)}`);
};

export const formatAndLogAddresses = (addresses: ClientAddresses | null) => {
  if (!addresses) {
    logger.debug("Client Addresses: Not logged in");
    return;
  }

  logger.info(`ETH Address: ${addresses.ethAddress}`);
  logger.info(`INTMAX Address: ${addresses.intmaxAddress}`);
};

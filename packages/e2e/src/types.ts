import { TokenType, type Token } from "intmax2-server-sdk";
import type { Account } from "viem/accounts";

export interface DepositParams {
  amount: number;
  token: Token;
  address: string;
  isMining: boolean;
}

export interface ClientAddresses {
  ethAddress: string;
  intmaxAddress: string;
  account: Account;
}

export interface TokenInfo {
  tokenType: TokenType;
  tokenAddress: string;
  tokenId: BigInt;
}

export type TokenInfoMap = Map<number, { tokenType: TokenType }>;

interface WithdrawalsSummary {
  failed: number;
  need_claim: number;
  relayed: number;
  requested: number;
  success: number;
}

export interface AccountSummary {
  deposits: number;
  withdrawals: WithdrawalsSummary;
  transfers: number;
  transactions: number;
}

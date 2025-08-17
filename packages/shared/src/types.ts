import { TokenType } from "intmax2-server-sdk";
import type { Account } from "viem/accounts";

export interface ClientAddresses {
  ethAddress: `0x${string}`;
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

export interface DepositParams {
  tokenIndex: number;
  amount: number;
}

export interface WithdrawParams {
  tokenIndex: number;
  amount: number;
  recipient: `0x${string}`;
}

export interface TransferParams {
  tokenIndex: number;
  amount: number;
  recipient: string;
}

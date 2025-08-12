import { config, createNetworkClient, logger } from "@intmax2-e2e/shared";
import { IntMaxNodeClient, TokenType } from "intmax2-server-sdk";
import { privateKeyToAccount } from "viem/accounts";
import type { Account } from "viem/accounts";
import { formatEther } from "viem";

interface Balance {
  [key: string]: any;
}

interface Token {
  tokenType: TokenType;
  tokenIndex: number;
  decimals: number;
  contractAddress: string;
  price: number;
}

interface DepositParams {
  amount: number;
  token: Token;
  address: string;
  isMining: boolean;
}

interface ClientAddresses {
  ethAddress: string;
  intmaxAddress: string;
  account: Account;
}

export class INTMAXClient {
  private client: IntMaxNodeClient;
  private account: Account;
  private isLoggedIn: boolean = false;
  private static instance: INTMAXClient;

  constructor() {
    const clientConfig = {
      environment: config.ENVIRONMENT,
      eth_private_key: config.ETH_PRIVATE_KEY as `0x${string}`,
      l1_rpc_url: config.L1_RPC_URL,
      urls: process.env.BALANCE_PROVER_URL
        ? {
            balance_prover_url: process.env.BALANCE_PROVER_URL,
            use_private_zkp_server: false,
          }
        : undefined,
    };

    this.client = new IntMaxNodeClient(clientConfig);
    this.account = privateKeyToAccount(config.ETH_PRIVATE_KEY as `0x${string}`);
  }

  static getInstance() {
    if (!INTMAXClient.instance) {
      INTMAXClient.instance = new INTMAXClient();
    }
    return INTMAXClient.instance;
  }

  async login() {
    try {
      await this.client.login();
      logger.debug("Logged in successfully");

      const addresses: ClientAddresses = {
        ethAddress: this.account.address,
        intmaxAddress: this.client.address,
        account: this.account,
      };

      logger.info(`ETH Address: ${addresses.ethAddress}`);
      logger.info(`INTMAX Address: ${addresses.intmaxAddress}`);

      this.isLoggedIn = true;

      return addresses;
    } catch (error) {
      logger.error("Failed to login:", error);
      throw error;
    }
  }

  async fetchEthereumBalance() {
    try {
      const ethereumClient = createNetworkClient("ethereum");
      const balance = await ethereumClient.getBalance({ address: this.account.address });
      const formattedBalance = formatEther(balance);

      return formattedBalance;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Failed to fetch Ethereum balance: ${message}`);
      throw error;
    }
  }

  async fetchINTMAXBalances() {
    try {
      logger.debug("Fetching INTMAX token balances...");
      const { balances } = await this.client.fetchTokenBalances();
      console.log("balances", balances);

      if (balances.length === 0) {
        logger.info("No token balances found");
        return [];
      }

      logger.info("Token Balances:");
      balances.forEach((balance: Balance, index: number) => {
        const formattedBalance = JSON.stringify(
          balance,
          (_, v) => (typeof v === "bigint" ? v.toString() : v),
          2,
        );
        logger.info(`Balance ${index + 1}: ${formattedBalance}`);
      });

      return balances;
    } catch (error) {
      logger.error("Failed to fetch IntMax balances:", error);
      throw error;
    }
  }

  async fetchAvailableTokens() {
    try {
      logger.debug("Fetching available tokens...");
      const tokens = await this.client.getTokensList();

      if (!tokens || (Array.isArray(tokens) && tokens.length === 0)) {
        logger.info("No tokens available");
        return [];
      }

      return tokens;
    } catch (error) {
      logger.error("Failed to fetch available tokens:", error);
      throw error;
    }
  }

  async depositNativeToken(amount: number = 0.000001): Promise<any> {
    const token: Token = {
      tokenType: TokenType.NATIVE,
      tokenIndex: 0,
      decimals: 18,
      contractAddress: "0x0000000000000000000000000000000000000000",
      price: 2417.08,
    };

    const depositParams: DepositParams = {
      amount,
      token,
      address: this.client.address,
      isMining: false,
    };

    try {
      console.log("\nPreparing deposit...");

      const gas = await this.client.estimateDepositGas({
        ...depositParams,
        isGasEstimation: true,
        isMining: false,
      });
      console.log("Estimated gas for deposit:", gas);

      const deposit = await this.client.deposit(depositParams);
      console.log("Deposit result:", JSON.stringify(deposit, null, 2));

      return deposit;
    } catch (error) {
      logger.error("Failed to deposit native token:", error);
      throw error;
    }
  }

  getAddresses(): ClientAddresses | null {
    if (!this.isLoggedIn) {
      return null;
    }

    return {
      ethAddress: this.account.address,
      intmaxAddress: this.client.address,
      account: this.account,
    };
  }

  getInternalClient() {
    if (!this.isLoggedIn) {
      throw new Error("Client is not logged in. Please call login() first.");
    }

    return this.client;
  }
}

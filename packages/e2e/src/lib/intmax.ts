import { config, createNetworkClient, LiquidityAbi, logger } from "@intmax2-e2e/shared";
import { IntMaxNodeClient, TokenType, type Token, TransactionStatus } from "intmax2-server-sdk";
import { formatEther, type PublicClient, type Abi } from "viem";
import type { Account } from "viem/accounts";
import { privateKeyToAccount } from "viem/accounts";
import type { ClientAddresses, DepositParams, TokenInfo } from "../types";
import { ETH_TOKEN_INDEX } from "../constants";

export class INTMAXClient {
  private static instance: INTMAXClient;
  private client: IntMaxNodeClient;
  private account: Account;
  private isLoggedIn: boolean = false;
  private availableTokens: Token[] = [];
  private ethereumClient: PublicClient;

  constructor() {
    const clientConfig = {
      environment: config.ENVIRONMENT,
      eth_private_key: config.ETH_PRIVATE_KEY,
      l1_rpc_url: config.L1_RPC_URL,
      ...(config.BALANCE_PROVER_URL && {
        urls: {
          balance_prover_url: config.BALANCE_PROVER_URL,
          use_private_zkp_server: false,
        },
      }),
    };

    this.client = new IntMaxNodeClient(clientConfig);
    this.account = privateKeyToAccount(config.ETH_PRIVATE_KEY);
    this.ethereumClient = createNetworkClient("ethereum");
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
      this.isLoggedIn = true;
      logger.debug("Logged in successfully");

      const addresses: ClientAddresses = {
        ethAddress: this.account.address,
        intmaxAddress: this.client.address,
        account: this.account,
      };

      await this.loadAvailableTokens();

      return addresses;
    } catch (error) {
      logger.error(`Failed to login: ${error instanceof Error ? error.message : "Unknown error"}`);
      throw error;
    }
  }

  private async loadAvailableTokens(): Promise<void> {
    try {
      logger.debug("Loading available tokens...");
      const tokens = await this.client.getTokensList();

      if (!tokens || (Array.isArray(tokens) && tokens.length === 0)) {
        logger.info("No tokens available");
        this.availableTokens = [];
        return;
      }

      this.availableTokens = tokens;
      logger.debug(`Available tokens loaded: ${tokens.length}`);
    } catch (error) {
      logger.error(
        `Failed to load available tokens: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  async fetchEthereumBalance() {
    try {
      const balance = await this.ethereumClient.getBalance({ address: this.account.address });
      const formattedBalance = formatEther(balance);

      return formattedBalance;
    } catch (error) {
      logger.error(
        `Failed to fetch Ethereum balance: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  async fetchINTMAXBalances() {
    try {
      logger.debug("Fetching INTMAX token balances...");
      const { balances } = await this.client.fetchTokenBalances();

      if (balances.length === 0) {
        logger.info("No token balances found");
        return [];
      }

      return balances;
    } catch (error) {
      logger.error(
        `Failed to fetch INTMAX balances: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  async depositNativeToken(amount: number) {
    const token = await this.getNativeToken();

    const depositParams: DepositParams = {
      amount,
      token,
      address: this.client.address,
      isMining: false,
    };

    try {
      logger.debug("Preparing deposit...");
      const gas = await this.client.estimateDepositGas({
        ...depositParams,
        isGasEstimation: true,
        isMining: false,
      });
      logger.debug(`Estimated gas for deposit: ${gas.toString()}`);

      const depositResult = await this.client.deposit(depositParams);
      if (depositResult.status !== TransactionStatus.Completed) {
        throw new Error("Deposit failed");
      }

      return depositResult;
    } catch (error) {
      logger.error(
        `Failed to deposit native token: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  // TODO: multicall and cache
  private async getTokenInfo(tokenIndex: number) {
    const result = await this.ethereumClient.readContract({
      address: config.LIQUIDITY_CONTRACT_ADDRESS as `0x${string}`,
      abi: LiquidityAbi as Abi,
      functionName: "getTokenInfo",
      args: [BigInt(tokenIndex)],
    });
    return result as TokenInfo;
  }

  async getNativeToken() {
    if (!this.isLoggedIn) {
      throw new Error("Client is not logged in. Please call login() first.");
    }

    if (this.availableTokens.length === 0) {
      throw new Error("No available tokens found.");
    }

    const nativeToken = this.availableTokens.find((token) => token.tokenIndex === ETH_TOKEN_INDEX);
    if (!nativeToken) {
      throw new Error("Native token not found in available tokens.");
    }

    return this.formatToken(nativeToken);
  }

  private async getTokenType(tokenIndex: number) {
    if (tokenIndex === ETH_TOKEN_INDEX) {
      return TokenType.NATIVE;
    }

    const { tokenType } = await this.getTokenInfo(tokenIndex);
    return tokenType;
  }

  private async formatToken({ tokenIndex, decimals, contractAddress, price }: Token) {
    const tokenType = await this.getTokenType(tokenIndex);
    return {
      tokenType,
      tokenIndex,
      decimals,
      contractAddress,
      price,
    };
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
}

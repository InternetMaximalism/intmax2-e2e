# intmax2-e2e

End-to-end testing suite for the INTMAX2 protocol. This repository contains comprehensive integration tests that verify the complete functionality of the INTMAX2 system, including wallet operations, token transfers, balance queries, and cross-chain interactions.

## Setup

Before running any service, make sure to:

```sh
# Install dependencies
yarn

# Copy environment variables
cp .env.example .env

# Build shared packages
yarn build:shared
```

## Development

Start the processor or job service in development mode:

```sh
# e2e
yarn workspace e2e dev
```

## TODO
- Examples
- remove debug log
- withdraw

```sh
TransactionReceiptNotFoundError: Transaction receipt with hash "0xdb922d461a5919225922f2fa4821bb8a160b759d80b2f28ea8123a7622b1ee22" could not be found. The Transaction may not be processed on a block yet.

Version: viem@2.33.3
    at getTransactionReceipt (/Users/yir7qrwd7r6e/workspaces/intmax2-e2e/node_modules/viem/actions/public/getTransactionReceipt.ts:66:23)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async exports.IntMaxNodeClient.deposit (/Users/yir7qrwd7r6e/workspaces/intmax2-e2e/node_modules/intmax2-server-sdk/src/node/index.ts:789:15)
    at async INTMAXClient.depositNativeToken (/Users/yir7qrwd7r6e/workspaces/intmax2-e2e/packages/e2e/src/lib/intmax.ts:164:23)
    at async performJob (/Users/yir7qrwd7r6e/workspaces/intmax2-e2e/packages/e2e/src/service/job.service.ts:14:25)
    at async timeOperation (/Users/yir7qrwd7r6e/workspaces/intmax2-e2e/packages/shared/src/lib/operation.ts:13:20)
    at async main (/Users/yir7qrwd7r6e/workspaces/intmax2-e2e/packages/e2e/src/index.ts:8:35) {
  details: undefined,
  docsPath: undefined,
  metaMessages: undefined,
  shortMessage: 'Transaction receipt with hash "0xdb922d461a5919225922f2fa4821bb8a160b759d80b2f28ea8123a7622b1ee22" could not be found. The Transaction may not be processed on a block yet.',
  version: '2.33.3'
}
```

```sh
Tokens updated
Tokens updated
Tokens updated
```
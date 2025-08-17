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
# activity
yarn workspace activity dev

# deposit
yarn workspace deposit dev

# withdraw
yarn workspace withdraw dev

# transfer
yarn workspace transfer dev
```
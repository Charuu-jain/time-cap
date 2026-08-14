#!/bin/bash
set -e

# Setup identities
echo "Generating test identities..."
stellar keys generate sponsor_1 --network testnet || true
stellar keys generate builder_1 --network testnet || true
stellar keys generate sponsor_2 --network testnet || true
stellar keys generate builder_2 --network testnet || true
stellar keys generate sponsor_3 --network testnet || true
stellar keys generate builder_3 --network testnet || true

SPONSOR_1=$(stellar keys address sponsor_1)
BUILDER_1=$(stellar keys address builder_1)
SPONSOR_2=$(stellar keys address sponsor_2)
BUILDER_2=$(stellar keys address builder_2)
SPONSOR_3=$(stellar keys address sponsor_3)
BUILDER_3=$(stellar keys address builder_3)

CONTRACT_ID="CBMPYTIDNBJSFO77QBHZMBFJPBT3TRL4XBS5KLMIMZGBS33BX6YUVMDY"
TOKEN_ID="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC" # standard native token on testnet

echo "Funding identities via Friendbot..."
curl -s "https://friendbot.stellar.org/?addr=$SPONSOR_1" >/dev/null
curl -s "https://friendbot.stellar.org/?addr=$SPONSOR_2" >/dev/null
curl -s "https://friendbot.stellar.org/?addr=$SPONSOR_3" >/dev/null

echo "Executing Escrow 1..."
stellar contract invoke --id $CONTRACT_ID --source sponsor_1 --network testnet -- \
  deposit --sponsor $SPONSOR_1 --builder $BUILDER_1 --amount 1000000 --token $TOKEN_ID

stellar contract invoke --id $CONTRACT_ID --source sponsor_1 --network testnet -- \
  release_funds

echo "Executing Escrow 2..."
stellar contract invoke --id $CONTRACT_ID --source sponsor_2 --network testnet -- \
  deposit --sponsor $SPONSOR_2 --builder $BUILDER_2 --amount 5000000 --token $TOKEN_ID

stellar contract invoke --id $CONTRACT_ID --source sponsor_2 --network testnet -- \
  release_funds

echo "Executing Escrow 3..."
stellar contract invoke --id $CONTRACT_ID --source sponsor_3 --network testnet -- \
  deposit --sponsor $SPONSOR_3 --builder $BUILDER_3 --amount 2500000 --token $TOKEN_ID

stellar contract invoke --id $CONTRACT_ID --source sponsor_3 --network testnet -- \
  release_funds

echo "✅ Successfully seeded 3 test escrows on Testnet!"

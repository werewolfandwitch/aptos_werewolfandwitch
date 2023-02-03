import {
  AptosAccount,
  WalletClient,
  HexString,
} from "@martiandao/aptos-web3-bip44.js";
import * as env from "dotenv";
env.config({ path: `.env.${process.env.NODE_ENV}.local` });

const {
  NEXT_PUBLIC_CONTRACT_ADDRESS: CONTRACT_ADDR,
  NEXT_PUBLIC_APTOS_NODE_URL: APTOS_NODE_URL,
  NEXT_PUBLIC_APTOS_FAUCET_URL: APTOS_FAUCET_URL,
  NEXT_PUBLIC_COIN_TYPE: COIN_TYPE,
  NEXT_PUBLIC_COLLECTION_NAME: COLLECTION_NAME,
} = process.env;

async function main() {
  const receiver = '0xf62858fc66d9647938ecb8b6d6ef3dfb6a5b85c37a014633d75f2574477f8641';
  const client = new WalletClient(APTOS_NODE_URL, APTOS_FAUCET_URL);
  const receiverAccount = new AptosAccount(
    HexString.ensure(receiver).toUint8Array()
  );

  // receiver: &signer, game_address:address, collection: String, _price:u64
  const payload = {
    function: `${CONTRACT_ADDR}::wolf_witch::mint_token`,
    type_arguments: [COIN_TYPE],
    arguments: [
      CONTRACT_ADDR,
      COLLECTION_NAME,
    ],
  };
  console.log('payload:', payload)
  const transaction = await client.aptosClient.generateTransaction(
    receiverAccount.address(),
    payload,
    { gas_unit_price: 100 }
  );
  const tx = await client.signAndSubmitTransaction(receiverAccount, transaction);
  const result = await client.aptosClient.waitForTransactionWithResult(tx, {
    checkSuccess: true,
  });
  console.log(result);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

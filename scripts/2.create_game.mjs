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
  NEXT_PUBLIC_WALLET_PRIVATE_KEY: WALLET_PRIVATE_KEY,
  NEXT_PUBLIC_COIN_TYPE: COIN_TYPE,
  NEXT_PUBLIC_COLLECTION_NAME: COLLECTION_NAME,
} = process.env;

async function main() {
  const deployer = WALLET_PRIVATE_KEY;
  const client = new WalletClient(APTOS_NODE_URL, APTOS_FAUCET_URL);
  const account = new AptosAccount(
    HexString.ensure(deployer).toUint8Array()
  );

  // _sender: &signer,
  // game_address:address,
  // collection: String, description: String,
  // collection_uri: String, maximum_supply: u64, mutate_setting: vector<bool>,
  // token_url: String, royalty_points_numerator:u64
  const payload = {
    function: `${CONTRACT_ADDR}::wolf_witch::create_game`,
    type_arguments: [COIN_TYPE],
    arguments: [
      CONTRACT_ADDR,
      COLLECTION_NAME,
      'test collection description2',
      'https://aptos.dev/img/nyan.jpeg',
      1000,
      [false, false, false],
      '',
      5000,
    ],
  };
  console.log('payload:', payload)
  const transaction = await client.aptosClient.generateTransaction(
    account.address(),
    payload,
    { gas_unit_price: 100 }
  );
  const tx = await client.signAndSubmitTransaction(account, transaction);
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

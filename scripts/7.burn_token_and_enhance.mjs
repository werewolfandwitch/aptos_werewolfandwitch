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
  NEXT_PUBLIC_MINTER_NAME: MINTER_NAME,
  NEXT_PUBLIC_COLLECTION_NAME: COLLECTION_NAME,
  NEXT_PUBLIC_COLLECTION_CREATOR: COLLECTION_CREATOR,
} = process.env;

async function main() {
  const owner = '0xbbaa31a4133afed3d3ebac3e0f1689a9de66147b48aa0083c1fb8fe22f53483c';
  const client = new WalletClient(APTOS_NODE_URL, APTOS_FAUCET_URL);
  const ownerAccount = new AptosAccount(
    HexString.ensure(owner).toUint8Array()
  );
  const myTokenName = 'wolfandwitch2 #0';
  const enemyTokenName = 'wolfandwitch2 #1';
  const myTokenPropertyVersion = '0';
  const enemyTokenPropertyVersion = '0';
    
  // const enemyAddy = '0x085bdfc8f3ce34fd8c6baa8d6ee3715236d052bb34996f5d99bd3c72b121c6d9';

  // holder: &signer, 
  // game_address:address, 
  // creator:address,
  // collection:String, 
  // name_1: String, property_version_1: u64, // mine
  // name_2: String, property_version_2: u64, // target
  const payload = {
    function: `${CONTRACT_ADDR}::wolf_witch::burn_token_and_enhance`,
    type_arguments: [COIN_TYPE],
    arguments: [
      CONTRACT_ADDR,
      COLLECTION_CREATOR,
      COLLECTION_NAME,
      myTokenName,
      myTokenPropertyVersion,
      enemyTokenName,
      enemyTokenPropertyVersion,
    ],
  };
  console.log('payload:', payload)
  const transaction = await client.aptosClient.generateTransaction(
    ownerAccount.address(),
    payload,
    { gas_unit_price: 100 }
  );
  const tx = await client.signAndSubmitTransaction(ownerAccount, transaction);
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

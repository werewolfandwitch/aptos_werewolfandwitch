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
  // const owner = '0xbbaa31a4133afed3d3ebac3e0f1689a9de66147b48aa0083c1fb8fe22f53483c'; // me
  const owner = '0xa88bdbcdcb4b3bec819e88d4ddefe5a714258c25544d358ba234582e8c3b1ce6'; // enemy
  const client = new WalletClient(APTOS_NODE_URL, APTOS_FAUCET_URL);
  const ownerAccount = new AptosAccount(
    HexString.ensure(owner).toUint8Array()
  );
  const tokenName = 'wolfandwitch2 #1';
  const propertyVersion = '0';
  // const listingId = '11';

  // sender: &signer,
  // game_address:address,
  // creator:address, collection:String, name: String, property_version: u64,
  // listing_id:u64
  const payload = {
    function: `${CONTRACT_ADDR}::wolf_witch::delisting_battle`,
    type_arguments: [COIN_TYPE],
    arguments: [
      CONTRACT_ADDR,
      COLLECTION_CREATOR,
      COLLECTION_NAME,
      tokenName,
      propertyVersion,
      '0', // only for event
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

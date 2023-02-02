import {
  AptosAccount,
  WalletClient,
  HexString,
} from "@martiandao/aptos-web3-bip44.js";
import * as env from "dotenv";
env.config({ path: `.env.${process.env.NODE_ENV}.local` });

const {
  NEXT_PUBLIC_LAUNCHPAD_ADDRESS: LAUNCHPAD_ADDR,
  NEXT_PUBLIC_APTOS_NODE_URL: APTOS_NODE_URL,
  NEXT_PUBLIC_APTOS_FAUCET_URL: APTOS_FAUCET_URL,
  NEXT_PUBLIC_WALLET_PRIVATE_KEY: WALLET_PRIVATE_KEY,
  NEXT_PUBLIC_LAUNCHPAD_COIN_TYPE: COIN_TYPE,
  NEXT_PUBLIC_MINTER_NAME: MINTER_NAME,
  NEXT_PUBLIC_COLLECTION_NAME: COLLECTION_NAME,
} = process.env;

async function main() {
  const creator = '0xa7fdd1c4b122742c0a0e53f6d8b65bcb993b7e2d5ca209d0dbf4bb988ef02e0a';
  const client = new WalletClient(APTOS_NODE_URL, APTOS_FAUCET_URL);
  const creatorAccount = new AptosAccount(
    HexString.ensure(creator).toUint8Array()
  );

  // sender: &signer, minter_address:address, minter_name: String, collection: String, description: String, collection_uri: String, maximum_supply:u64, mutate_setting: vector<bool>, presale_start_timestamp:u64, public_start_timestamp:u64, presale_price:u64, public_price:u64, public_sale_limit:u64, token_url: String, royalty_points_numerator:u64, token_description: String, reveal:bool, reveal_timestamp:u64, is_dynamic: bool
  const payload = {
    function: `${LAUNCHPAD_ADDR}::minting::create_launchpad`,
    type_arguments: [COIN_TYPE],
    arguments: [
      LAUNCHPAD_ADDR,
      MINTER_NAME,
      COLLECTION_NAME,
      "Space test camel collection",
      "https://bafybeigrdlg2dabttxbdrlvtfmba5qqk624x7xgoquwkgd2j2bufmwm3gu.ipfs.nftstorage.link/0.png",
      1111,
      [false, false, false],
      Math.floor(Date.now() / 1000) + 0, // 0 secs from now
      Math.floor(Date.now() / 1000) + 10, // 30 secs from now
      10000000, // 0.1 APT
      20000000, // 0.2 APT
      10,
      "https://bafybeibbospffpkewxye7spzyegp7bn7zli5rhhzxksyodvfjzx3mxtu24.ipfs.nftstorage.link/",
      5000,
      "The best camels",
      true,
      Math.floor(Date.now() / 1000) + 0,
      true
    ],
  };
  console.log('payload:', payload)
  // return;
  const transaction = await client.aptosClient.generateTransaction(
    creatorAccount.address(),
    payload,
    { gas_unit_price: 100 }
  );
  const tx = await client.signAndSubmitTransaction(creatorAccount, transaction);
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

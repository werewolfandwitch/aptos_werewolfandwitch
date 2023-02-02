
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
  const creatorPriv = '0xa7fdd1c4b122742c0a0e53f6d8b65bcb993b7e2d5ca209d0dbf4bb988ef02e0a';
  const client = new WalletClient(APTOS_NODE_URL, APTOS_FAUCET_URL);
  const creatorAccount = new AptosAccount(
    HexString.ensure(creatorPriv).toUint8Array()
  );

  // creator_address: &signer, minter_address:address, collection:String, presale_price:u64, public_price:u64, public_sale_limit:u64, token_url:String, royalty_points_numerator:u64
  const payload = {
    function: `${LAUNCHPAD_ADDR}::minting::set_launchpad_config`,
    type_arguments: [],
    arguments: [
      LAUNCHPAD_ADDR,
      COLLECTION_NAME,
      10000000, // 0.1 APT
      20000000, // 0.2 APT
      33,
      "https://bafybeibbospffpkewxye7spzyegp7bn7zli5rhhzxksyodvfjzx3mxtu24.ipfs.nftstorage.link/",
      5000,
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

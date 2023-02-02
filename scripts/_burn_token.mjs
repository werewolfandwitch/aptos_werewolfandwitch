import {
  AptosAccount,
  AptosClient,
  WalletClient,
  HexString,
} from "@martiandao/aptos-web3-bip44.js";
import {TokenClient} from "aptos"
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
  const deployer = WALLET_PRIVATE_KEY;
  const client = new WalletClient(APTOS_NODE_URL, APTOS_FAUCET_URL);
  const deployerAccount = new AptosAccount(
    HexString.ensure(deployer).toUint8Array()
  );
  
  const nftOwner = '0x6c8d0c886207ecd37b8e79e8720fd98d5cfd75a8236fc14cf56b2b255126daaa';
  const creator = '0x4f2fc8092ddaaf97d6cca25b0822a115699258a0c8f256763b68f2397f120979';
  
  // const tokenName = 'wolfandwitch2 #13';
  const tokenPropertyVersion = 0;

  const aptosClient = new AptosClient(APTOS_NODE_URL);
  const tokenClient = new TokenClient(aptosClient);
  const tx = await tokenClient.burnByCreator(
    // creator,
    deployerAccount,
    nftOwner,
    COLLECTION_NAME,
    `${COLLECTION_NAME} #0`,
    tokenPropertyVersion,
    1
  )
  console.log(tx)
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

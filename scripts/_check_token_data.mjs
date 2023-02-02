
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
  const receiver = '0xdf974df70f46ec85107eb55139220f1e85f82ddf711efd62df0832718cf6e24d'
  const client = new WalletClient(APTOS_NODE_URL, APTOS_FAUCET_URL);
  const receiverAccount = new AptosAccount(
    HexString.ensure(receiver).toUint8Array()
  );
  const creatorAddr = '0x9481961fe83d6752a9d3f5ccf5229f839ad20276cd4415ebf2db9925c6830dae';
  const creatorResourceAddr = '0x85a1822e3f1c8496228f63b0f4059e3efa55c05fe6744078a48826b496d67370';

  const aptosClient = new AptosClient(APTOS_NODE_URL);
  const tokenClient = new TokenClient(aptosClient)
  const tokenData = await tokenClient.getTokenData(creatorResourceAddr, COLLECTION_NAME, "Space Camels A1 #0");
  console.log(tokenData)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

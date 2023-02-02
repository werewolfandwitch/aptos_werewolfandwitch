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
  const client = new WalletClient(APTOS_NODE_URL, APTOS_FAUCET_URL);
  const receiver = '0xdf974df70f46ec85107eb55139220f1e85f82ddf711efd62df0832718cf6e24d'
  const receiverAccount = new AptosAccount(
    HexString.ensure(receiver).toUint8Array()
  );
  // const creatorAddr = '0x9481961fe83d6752a9d3f5ccf5229f839ad20276cd4415ebf2db9925c6830dae';
  const creatorResourceAddr = '0xb981c1b0893dc5e29cb9d80735a82b48559ce4ee247cddbb3f92be28409d0159';

  const aptosClient = new AptosClient(APTOS_NODE_URL);
  const tokenClient = new TokenClient(aptosClient);
  const tx = await tokenClient.burnByOwner(receiverAccount, creatorResourceAddr, COLLECTION_NAME, `${COLLECTION_NAME} #0`, 0, 1)
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

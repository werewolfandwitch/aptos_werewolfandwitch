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
} = process.env;

async function main() {
  const creator = '0xa7fdd1c4b122742c0a0e53f6d8b65bcb993b7e2d5ca209d0dbf4bb988ef02e0a';
  const client = new WalletClient(APTOS_NODE_URL, APTOS_FAUCET_URL);
  const creatorAccount = new AptosAccount(
    HexString.ensure(creator).toUint8Array()
  );
  
  const whitelistToRemove = [
    '0xc893181b0adee57932a759f6fe720f5d9a31413fd9fd9be8096a709fe2dba157'
  ]
  // creator_address: &signer, minter_address:address, collection: String, whitelists:vector<address>
  const payload = {
    function: `${LAUNCHPAD_ADDR}::minting::remove_whitelist`,
    type_arguments: [COIN_TYPE],
    arguments: [
      LAUNCHPAD_ADDR,
      "Werewolves",
      whitelistToRemove,
    ],
  };
  console.log('payload:', payload)
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

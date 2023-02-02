import {
  AptosAccount,
  AptosClient,
  WalletClient,
  FaucetClient,
  TokenClient,
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
} = process.env;

async function main() {
  const deployer = WALLET_PRIVATE_KEY;
  // const client = new WalletClient(APTOS_NODE_URL, APTOS_FAUCET_URL);
  const account = new AptosAccount(
    HexString.ensure(deployer).toUint8Array()
  );
  const client = new AptosClient(APTOS_NODE_URL);
  const tokenClient = new TokenClient(client);

  const collectionName = COLLECTION_NAME;
  const collectionDescription = "test werewolf vs witch collection description";
  // const tokenName = "Werewolf#1";
  // const tokenDescription = "test werewolf vs witch token description";
  // const tokenPropertyVersion = 0;

  // const tokenId = {
  //   token_data_id: {
  //     creator: account.address(),
  //     collection: collectionName,
  //     name: tokenName,
  //   },
  //   property_version: `${tokenPropertyVersion}`,
  // };

  // Create the collection.
  const txnHash1 = await tokenClient.createCollection(
    account,
    collectionName,
    collectionDescription,
    "https://alice.com",
  );
  await client.waitForTransaction(txnHash1, { checkSuccess: true });

  // Create a token in that collection.
  // const txnHash2 = await tokenClient.createToken(
  //   account,
  //   collectionName,
  //   tokenName,
  //   tokenDescription,
  //   1,
  //   "https://aptos.dev/img/nyan.jpeg",
  // );
  // await client.waitForTransaction(txnHash2, { checkSuccess: true });

  // Print the collection data.
  const collectionData = await tokenClient.getCollectionData(account.address(), collectionName);
  console.log(`Test collection: ${JSON.stringify(collectionData, null, 4)}`);

  // // Get the token balance.
  // const myBalance = await tokenClient.getToken(
  //   account.address(),
  //   collectionName,
  //   tokenName,
  //   `${tokenPropertyVersion}`,
  // );
  // console.log(`My token balance`);
  // console.log(myBalance)

  // receiver: &signer, game_address:address, collection: String, _price:u64
  // const payload = {
  //   function: `${CONTRACT_ADDR}::wolf_witch::mint_token`,
  //   type_arguments: [COIN_TYPE],
  //   arguments: [
  //     CONTRACT_ADDR,
  //     COLLECTION_NAME,
  //     1000000, // 0.01
  //   ],
  // };
  // console.log('payload:', payload)
  // const transaction = await client.aptosClient.generateTransaction(
  //   account.address(),
  //   payload,
  //   { gas_unit_price: 100 }
  // );
  // const tx = await client.signAndSubmitTransaction(account, transaction);
  // const result = await client.aptosClient.waitForTransactionWithResult(tx, {
  //   checkSuccess: true,
  // });
  // console.log(result);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });





// import { AptosClient, AptosAccount, FaucetClient, TokenClient, CoinClient } from "aptos";
// import { NODE_URL, FAUCET_URL } from "./common";

// (async () => {
//   // Create API and faucet clients.
//   // :!:>section_1a
//   const client = new AptosClient(NODE_URL);
//   const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL); // <:!:section_1a

//   // Create client for working with the token module.
//   // :!:>section_1b
//   const tokenClient = new TokenClient(client); // <:!:section_1b

//   // Create a coin client for checking account balances.
//   const coinClient = new CoinClient(client);

//   // Create accounts.
//   // :!:>section_2
//   const alice = new AptosAccount();
//   const bob = new AptosAccount(); // <:!:section_2

//   // Print out account addresses.
//   console.log("=== Addresses ===");
//   console.log(`Alice: ${alice.address()}`);
//   console.log(`Bob: ${bob.address()}`);
//   console.log("");

//   // Fund accounts.
//   // :!:>section_3
//   await faucetClient.fundAccount(alice.address(), 100_000_000);
//   await faucetClient.fundAccount(bob.address(), 100_000_000); // <:!:section_3

//   console.log("=== Initial Coin Balances ===");
//   console.log(`Alice: ${await coinClient.checkBalance(alice)}`);
//   console.log(`Bob: ${await coinClient.checkBalance(bob)}`);
//   console.log("");

//   console.log("=== Creating Collection and Token ===");

//   const collectionName = "Alice's";
//   const tokenName = "Alice's first token";
//   const tokenPropertyVersion = 0;

//   const tokenId = {
//     token_data_id: {
//       creator: alice.address().hex(),
//       collection: collectionName,
//       name: tokenName,
//     },
//     property_version: `${tokenPropertyVersion}`,
//   };

//   // Create the collection.
//   // :!:>section_4
//   const txnHash1 = await tokenClient.createCollection(
//     alice,
//     collectionName,
//     "Alice's simple collection",
//     "https://alice.com",
//   ); // <:!:section_4
//   await client.waitForTransaction(txnHash1, { checkSuccess: true });

//   // Create a token in that collection.
//   // :!:>section_5
//   const txnHash2 = await tokenClient.createToken(
//     alice,
//     collectionName,
//     tokenName,
//     "Alice's simple token",
//     1,
//     "https://aptos.dev/img/nyan.jpeg",
//   ); // <:!:section_5
//   await client.waitForTransaction(txnHash2, { checkSuccess: true });

//   // Print the collection data.
//   // :!:>section_6
//   const collectionData = await tokenClient.getCollectionData(alice.address(), collectionName);
//   console.log(`Alice's collection: ${JSON.stringify(collectionData, null, 4)}`); // <:!:section_6

//   // Get the token balance.
//   // :!:>section_7
//   const aliceBalance1 = await tokenClient.getToken(
//     alice.address(),
//     collectionName,
//     tokenName,
//     `${tokenPropertyVersion}`,
//   );
//   console.log(`Alice's token balance: ${aliceBalance1["amount"]}`); // <:!:section_7

//   // Get the token data.
//   // :!:>section_8
//   const tokenData = await tokenClient.getTokenData(alice.address(), collectionName, tokenName);
//   console.log(`Alice's token data: ${JSON.stringify(tokenData, null, 4)}`); // <:!:section_8

//   // Print their balances.
//   const aliceBalance2 = await tokenClient.getToken(
//     alice.address(),
//     collectionName,
//     tokenName,
//     `${tokenPropertyVersion}`,
//   );
//   const bobBalance2 = await tokenClient.getTokenForAccount(bob.address(), tokenId);
//   console.log(`Alice's token balance: ${aliceBalance2["amount"]}`);
//   console.log(`Bob's token balance: ${bobBalance2["amount"]}`);

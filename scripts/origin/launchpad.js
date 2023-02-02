import { LAUNCHPAD_ADDR, APTOS_IN_OCTA, MARKET_COIN_TYPE } from "../config/constants";

/**
 * @param {Function} signAndSubmitTransaction 
 * @param {string} collectionName 
 * @param {number} presalePrice 
 * @param {number} publicPrice 
 * @param {number} publicSaleLimit 
 * @param {string} tokenUrl - should end with /
 * @param {number} royaltyPointsNumerator - denominator is 100,000
 * @returns 
 */
export const setLaunchpadConfig = (
  signAndSubmitTransaction,
  collectionName,
  presalePrice,
  publicPrice,
  publicSaleLimit,
  tokenUrl,
  royaltyPointsNumerator,
) => {
  const payload = {
    function: `${LAUNCHPAD_ADDR}::minting::set_launchpad_config`,
    type_arguments: [],
    arguments: [
      LAUNCHPAD_ADDR,
      collectionName,
      presalePrice * APTOS_IN_OCTA,
      publicPrice * APTOS_IN_OCTA,
      publicSaleLimit,
      tokenUrl,
      royaltyPointsNumerator,
    ],
  };

  console.log('payload:', payload)
  return signAndSubmitTransaction(payload, { gas_unit_price: 100 });
}

/**
 * @param {Function} signAndSubmitTransaction 
 * @param {string} collectionName 
 * @param {number} presaleStartTimestamp - in second
 * @param {number} publicStartTimestamp - in second, must be larger than presale start
 * @param {number} revealTimestamp - in second
 * @returns 
 */
export const setLaunchpadTimestamp = (
  signAndSubmitTransaction,
  collectionName,
  presaleStartTimestamp,
  publicStartTimestamp,
  revealTimestamp,
) => {
  const payload = {
    function: `${LAUNCHPAD_ADDR}::minting::set_timestamp`,
    type_arguments: [],
    arguments: [
      LAUNCHPAD_ADDR,
      collectionName,
      presaleStartTimestamp,
      publicStartTimestamp,
      revealTimestamp
    ],
  };

  console.log('payload:', payload)
  return signAndSubmitTransaction(payload, { gas_unit_price: 100 });
}

/**
 * @param {Function} signAndSubmitTransaction 
 * @param {string} minterAddr 
 * @param {string} creatorAddr 
 * @param {string} collectionName 
 * @param {string} tokenName 
 * @param {string} newUri - new json uri
 * @param {number} propertyVersion
 * @returns 
 */
export const reveal = (
  signAndSubmitTransaction,
  creatorAddr,
  collectionName,
  tokenName,
  newUri,
  propertyVersion
) => {
  const payload = {
    function: `${LAUNCHPAD_ADDR}::minting::reveal`,
    type_arguments: [MARKET_COIN_TYPE],
    arguments: [
      LAUNCHPAD_ADDR,
      creatorAddr,
      collectionName,
      tokenName,
      newUri,
      propertyVersion,
    ],
  };

  console.log('payload:', payload)
  return signAndSubmitTransaction(payload, { gas_unit_price: 100 });
}

/**
 * @param {Function} signAndSubmitTransaction 
 * @param {string} collectionName 
 * @param {string[]} whitelistAddressList 
 * @param {number[]} whitelistLimitList 
 * @returns 
 */
export const addWhitelist = (
  signAndSubmitTransaction,
  collectionName,
  whitelistAddressList,
  whitelistLimitList,
) => {
  const payload = {
    function: `${LAUNCHPAD_ADDR}::minting::add_whitelist`,
    type_arguments: [MARKET_COIN_TYPE],
    arguments: [
      LAUNCHPAD_ADDR,
      collectionName,
      whitelistAddressList,
      whitelistLimitList
    ],
  };

  console.log('payload:', payload)
  return signAndSubmitTransaction(payload, { gas_unit_price: 100 });
}

/**
 * @param {Function} signAndSubmitTransaction 
 * @param {string} collectionName 
 * @param {string[]} whitelistToRemove 
 * @returns 
 */
export const removeWhitelist = (
  signAndSubmitTransaction,
  collectionName,
  whitelistToRemove,
) => {
  const payload = {
    function: `${LAUNCHPAD_ADDR}::minting::remove_whitelist`,
    type_arguments: [MARKET_COIN_TYPE],
    arguments: [
      LAUNCHPAD_ADDR,
      collectionName,
      whitelistToRemove,
    ],
  };

  console.log('payload:', payload)
  return signAndSubmitTransaction(payload, { gas_unit_price: 100 });
}

/**
 * @param {Function} signAndSubmitTransaction 
 * @param {string} creatorAddr 
 * @param {string} collectionName 
 * @returns 
 */
export const mintToken = (
  signAndSubmitTransaction,
  creatorAddr,
  collectionName,
) => {
  const payload = {
    function: `${LAUNCHPAD_ADDR}::minting::mint_token`,
    type_arguments: [MARKET_COIN_TYPE],
    arguments: [
      LAUNCHPAD_ADDR,
      creatorAddr,
      collectionName,
    ],
  };

  console.log('payload:', payload)
  return signAndSubmitTransaction(payload, { gas_unit_price: 100 });
}
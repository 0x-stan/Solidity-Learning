import { ethers } from "ethers";
import { extendDecimals } from "./decemals";

const { BigNumber } = ethers;

export const GAS_PRICE = BigNumber.from("1000000000");
export const ONE_ETH = extendDecimals(1);
export const TEST_ACCOUNTS_PRIVATES = 'TEST_ACCOUNTS_PRIVATES'
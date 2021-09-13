import { ethers } from "ethers";

const { BigNumber } = ethers;

export function extendDecimals(num: number | string, decimals: number = 18) {
  let bi = BigNumber.from(num);
  return bi.mul(BigNumber.from(10).pow(decimals));
}

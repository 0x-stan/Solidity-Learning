// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.7;

contract SimpleStorage {
    uint256 storedData;

    function set(uint256 x) public {
        storedData = x;
    }

    function get() public view returns (uint256) {
        return storedData;
    }
}

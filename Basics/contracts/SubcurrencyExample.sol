// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.7;

contract SubcurrencyExample {
    // The keyword "public" makes variables
    // accessible from other contracts
    address public minter;
    mapping(address => uint256) public balances;

    event Send(address from, address to, uint256 amount);

    constructor() {
        minter = msg.sender;
    }

    function mint(address receiver, uint256 amount) public {
        require(msg.sender == minter);
        balances[receiver] += amount;
    }

    error InsufficientBalance(uint256 requested, uint256 available);

    function send(address receiver, uint256 amount) public {
        if (amount > balances[msg.sender]) {
            revert InsufficientBalance({
                requested: amount,
                available: balances[msg.sender]
            });
        }

        balances[msg.sender] -= amount;
        balances[receiver] += amount;
        emit Send(msg.sender, receiver, amount);
    }
}

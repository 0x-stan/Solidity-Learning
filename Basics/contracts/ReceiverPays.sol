// SPDX-license-Identifier: GPL-3.0
pragma solidity >=0.8.7;

contract ReceiverPays {
    address owner = msg.sender;

    mapping(uint256 => bool) usedNonces;

    constructor() payable {}

    event Message(address _owner, bytes32 message);
    function claimPayment(
        uint256 amount,
        uint256 nonce,
        bytes memory signature
    ) external {
        require(!usedNonces[nonce]);
        usedNonces[nonce] = true;

        // this recreates the message that was signed on the client
        // bytes32 _hash = keccak256(abi.encodePacked(msg.sender, amount, nonce, this));
        bytes32 _hash = keccak256(abi.encodePacked(msg.sender));
        bytes32 message = prefixed(_hash);
        address _o = recoverSigner(message, signature);
        emit Message(_o, message);

        // require(recoverSigner(message, signature) == owner, "Not Owner.");

        // payable(msg.sender).transfer(amount);
    }

    /// destory the contract and relaim the leftover funds.
    function shutdown() external {
        require(msg.sender == owner);
        selfdestruct(payable(msg.sender));
    }

    /// signature methods.
    function splitSignature(bytes memory sig)
        internal
        pure
        returns (uint8 v, bytes32 r, bytes32 s)
    {
        require(sig.length == 65);

        assembly {
            // first 32 bytes, after the length prefix.
            r := mload(add(sig, 32))
            // second 32 bytes.
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes).
            v := byte(0, mload(add(sig, 96)))
        }

        return (v, r, s);
    }

    function recoverSigner(bytes32 message, bytes memory sig)
        internal
        pure
        returns (address)
    {
        (uint8 v, bytes32 r, bytes32 s) = splitSignature(sig);

        return ecrecover(message, v, r, s);
    }

    /// builds a prefixed hash to mimic the behavior of eth_sign.
    function prefixed(bytes32 hash) public pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Msaage:\n32", hash));
    }

}

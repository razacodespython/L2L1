const {Web3} = require("web3");
const HttpProviderOptions = require("web3-core-helpers").HttpProviderOptions;
const BlockTransactionString = require("web3-eth").BlockTransactionString;
const ethers = require("ethers");

const concat = ethers.concat;

 // Initialize web3 instance with HttpProvider
const url ='https://sepolia-rpc.scroll.io';
const httpProvider = new Web3.providers.HttpProvider(url);
const w3 = new Web3(httpProvider);

const block_number = 2782513;
const simple_contract = '0xC73BfBD94fb1FD860997D4E76D116BDE0333BeEf'
const storage_key = "0x0000000000000000000000000000000000000000000000000000000000000000";

// Value stored at that key is 12

async function verify_proof(contractAddress, storageKey, proof) {
  const verifierAddress = '0xd2feb9a618bccab6521053dce63d2bfe855afdd9';
  const verifier = new w3.eth.Contract([
    {"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"bytes32","name":"storageKey","type":"bytes32"},{"internalType":"bytes","name":"proof","type":"bytes"}],"name":"verifyZkTrieProof","outputs":[{"internalType":"bytes32","name":"stateRoot","type":"bytes32"},{"internalType":"bytes32","name":"storageValue","type":"bytes32"}],"stateMutability":"view","type":"function"}
  ], verifierAddress);
  const { storageValue } = await verifier.methods.verifyZkTrieProof(contractAddress, storageKey, proof).call();
  return storageValue;
}

async function main() {
  const storage_value = parseInt(await w3.eth.getStorageAt(simple_contract, storage_key, block_number), 16);
  console.log(`Value at storage key: ${storage_value}`);

  const proof = await w3.eth.getProof(simple_contract, [storage_key], block_number);
  let cleaned_proof = {
    block: block_number,
    account: simple_contract,
    storage: storage_key,
    expectedRoot: proof.storageHash,
    accountProof: proof.accountProof.map(ap => ap),
    storageProof: proof.storageProof[0].proof.map(sp => sp),
  };

  const compiled_proof = concat([
    `0x${cleaned_proof.accountProof.length.toString(16).padStart(2, "0")}`,
    ...cleaned_proof.accountProof,
    `0x${cleaned_proof.storageProof.length.toString(16).padStart(2, "0")}`,
    ...cleaned_proof.storageProof,
  ]);

  const verified_storage_value = await verify_proof(simple_contract, proof.storageProof[0].key, compiled_proof);
  console.log(`Verified Storage Value: ${verified_storage_value}`);
}

 main();
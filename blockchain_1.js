const crypto = require('crypto');

//initial target Hash.
let initialTargetHash = "000000000000000000000000000000000ffffffffffffffffffffffffff";
//difficulty steps used to adjust the difficulty at rum time.
let targetHashDelta = "ffffffffffffffffffffffff";
//Time taken idellly to mine a block. 1 block every 5 Secs
let desiredHashRate = 1/5; 
//total length of hash output trim to 30 char's.
let block_hash_length = 30; 
//creating genesis block object to bootstrap the blockchain.
let genesisBlock = {
  index: 0,
  transactions: [],
  difficulty: initialTargetHash,
  timestamp: new Date().getTime(),
  nonce: 238199,
  prevHash: 'fffffffffffffffffffffffff',
  hash: '36a1517830a8a71a50cc619a4991ca5a1fef0289d82e8276e62a93263cb718f5',
};

//blockchain implemetation as Array of blocks.
let blockchain = [genesisBlock];

class Block {
  /**
   * 
   * @param {*} index - block index for identification
   * @param {*} transactions - transaction array.
   * @param {*} prevHash - Hash of the previous block in blockchain
   * @param {*} difficulty - current taget hash value.
   * @param {*} timestamp - Time in milliseconds. 
   * @param {*} nonce - Random value used in mining block.
   */
  constructor(index, transactions, prevHash, difficulty, timestamp, nonce) {
    this.index = index;
    this.transactions = transactions;
    this.prevHash = prevHash;
    this.difficulty = difficulty;
    if (typeof timestamp === "undefined") {
      this.timestamp = new Date().getTime();
    }
    //setup nonce value.
    if (typeof nonce === "undefined") {
      this.nonce = 0;
    } else {
      this.nonce = nonce
    }
    //creating hash value using createhash function of crypto module.
    //update function takes current context as parameter
    //store hash as 30 char substring.
    this.hash = crypto.createHash('sha256').update(this.toString()).digest('hex').substring(0, block_hash_length);
  }

  //update nonce function increase the nonce value by 1 then update the block and recalculate the new hash.
  updateNonce() {
    this.nonce += 1;
    let updatedBlock = new Block(this.index, this.transactions, this.prevHash, this.difficulty, this.timestamp, this.nonce);
    this.hash = updatedBlock.hash; 
  }

  //function to convert block object into string format.
  toString() {
    return JSON.stringify(this);
  }
}

//function to multiply and return 2 hex numbers.
let hexMultiplication = (firstNumber, secondNumber) => {
  console.log(`first ${firstNumber} second ${secondNumber}`);
  let new_diff = (parseInt(firstNumber, 16) * parseFloat(secondNumber)).toString(16);
  console.log(`Diffi ${new_diff}`);
  return new_diff;
}



//function to calculate difficutly at run time.
let calculateDifficulty = (index) => {
  //No calculation till first 3 blocks.
  if (blockchain.length < 3) {
    return genesisBlock.difficulty;
  }
  //fetch the difficulty from previous block.
  let lastBlockDifficulty = blockchain[index - 1].difficulty;
  let lastBlockTime = blockchain[index - 1].timestamp;
  let blockBeforeLastBlockTime = blockchain[index - 2].timestamp;
  //calculating the time taken to mine previous block.
  let actualHashRate = 1/((lastBlockTime - blockBeforeLastBlockTime)/1000);
  console.log("difficulty " + lastBlockDifficulty);
  console.log(`Desired Hash Rate ${desiredHashRate} /sec, Acutal Hash Rate ${actualHashRate} /sec`);

  //if actual hash rate is higner than desired rate than decreasing the traget hash by factor of desired/actual.
  if (actualHashRate > desiredHashRate) {
    console.log('!!HIGHER HASH RATE!!  Decreaseing Target Hash to '+Math.round((desiredHashRate/actualHashRate)*100)/100+"% of" + lastBlockDifficulty);
    return hexMultiplication(lastBlockDifficulty, (desiredHashRate/actualHashRate));
  }
  //if actual hash rate is lower than desired rate than inreasing the traget hash by factor of desired/actual.
  else if (actualHashRate < desiredHashRate) {
    console.log('!!LOWER HASH RATE!!  Increasing Target Hash to '+Math.round((desiredHashRate/actualHashRate)*100)/100+"% of" + lastBlockDifficulty);
    return hexMultiplication(lastBlockDifficulty, desiredHashRate/actualHashRate);
  }
  else
    return lastBlockDifficulty;
};

/**
 * creating new block and mining.
 * calculate the network difficulty based on previous block difficulties.
 * create new block with calculated difficulty.
 * find the block hash < difficulty by adjucting the nonce value.
 * return promise with resolved new block.
 */
let createBlock = () => {
  return new Promise((resolve) => {
    console.log('Mining block', blockchain.length);
    const new_difficulty = calculateDifficulty(blockchain.length);
    console.log(`new Difficulty ${new_difficulty}`);
    let newBlock = new Block(blockchain.length, [], blockchain[blockchain.length - 1].hash, new_difficulty);

    while (parseInt(newBlock.hash, 16) > parseInt(new_difficulty, 16)) {
      newBlock.updateNonce();
    }
    resolve(newBlock);
  });
};

/**
 * miner function calls every sec. try to mine block by calling createBlock function.
 * createBlock function returns callback function with new block.
 */
let runner = () => {
  let miner = () => {
    return createBlock()
      .then(newBlock => {
        blockchain.push(newBlock);
        console.log(`block mined in ${(newBlock.timestamp - blockchain[newBlock.index-1].timestamp)/1000} /sec ${newBlock}`)
        setTimeout(miner, 1000);
      });
  }
  return miner();
}

runner();

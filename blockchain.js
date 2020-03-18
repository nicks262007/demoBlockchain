const crypto = require('crypto');
//creating genesis block object to bootstrap the blockchain.
let genesisBlock = {
  index: 0,
  transactions: [],
  difficulty: "000000000000000000000000000000000ffffffffffffffffffffffffff",
  timestamp: 1536907693191,
  nonce: 238199,
  prevHash: 'fffffffffffffffffffffffff',
  hash: '36a1517830a8a71a50cc619a4991ca5a1fef0289d82e8276e62a93263cb718f5',
};
//difficulty steps used to adjust the difficulty at rum time.
let difficultyStep = "ffffffffffffffffffffffff";
//Time taken idellly to mine a block.
let idealBlockTime = 2 * 1000; 
//blockchain implemetation as Array of blocks.
let blockchain = [genesisBlock];
//total length of hash output trim to 30 char's.
let block_hash_length = 30; 

class Block {
  //constructor to initialize a block.
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

//function to add difficulty steps into existing difficulty in order to lower the difficulty.
let hexAddition = (firstNumber, secondNumber) => {
  return (parseInt(firstNumber, 16) + parseInt(secondNumber, 16)).toString(16);
};

//function to subtract difficulty steps into existing difficulty in order to increase the difficulty.
let hexSubtraction = (firstNumber, secondNumber) => {
  return (parseInt(firstNumber, 16) - parseInt(secondNumber, 16)).toString(16);
};

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
  let timeDifference = lastBlockTime - blockBeforeLastBlockTime;
  console.log("difficulty " + lastBlockDifficulty);
  console.log('Ideal Block Time', (idealBlockTime/1000), 'sec, Current Block Time', (timeDifference/1000), 'sec');

  //if time taken to mine previous block is more than the ideal time then reduce the difficulty, by adding more difficulty steps into blockdifficulty pool.
  if (timeDifference > idealBlockTime) {
    console.log('Higher Block Time, Decreaseing Difficulty');
    return hexAddition(lastBlockDifficulty, difficultyStep);
  }
  //if time taken to mine previous block is less than the ideal time, increase difficulty, by sliceing out difficulty steps into blockdifficulty pool.
  else if (timeDifference < idealBlockTime) {
    console.log('Higher Block Time, Increasing Difficulty');
    return hexSubtraction(lastBlockDifficulty, difficultyStep);
  }
  else
    return lastBlockDifficulty;
};

//creating new block and mining.
let createBlock = () => {
  return new Promise((resolve) => {
    console.log('Mining block', blockchain.length);
    const new_difficulty = calculateDifficulty(blockchain.length);
    let newBlock = new Block(blockchain.length, [], blockchain[blockchain.length - 1].hash, new_difficulty);

    while (parseInt(newBlock.hash, 16) > parseInt(new_difficulty, 16)) {
      newBlock.updateNonce();
    }
    resolve(newBlock);
  });
};

//miner function calls in every sec. and look for new block.
let runner = () => {
  let miner = () => {
    return createBlock()
    .then(newBlock => {
        blockchain.push(newBlock);
        setTimeout(miner, 1000);
      });
  }
  return miner();
}

runner();

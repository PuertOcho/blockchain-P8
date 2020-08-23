const MINE_RATE = 6000;

export default (previousBlock, timestamp) => {
  const { difficulty } = previousBlock;

  

  return previousBlock.timestamp + MINE_RATE > timestamp
    ? difficulty + 1
    : difficulty - 1;
};
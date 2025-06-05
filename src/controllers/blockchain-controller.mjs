export const getBlockchain = (req, res) => {
  const { blockchain } = req.app.locals;

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: blockchain.chain,
  });
};

export const getBlockchainLength = (req, res) => {
  const { blockchain } = req.app.locals;

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      length: blockchain.chain.length,
      lastBlock: blockchain.chain.at(-1),
    },
  });
};

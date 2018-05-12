module.exports = (res, err) => {
  console.log(err);
  return res.status(500).json({
    error: err
  });
};

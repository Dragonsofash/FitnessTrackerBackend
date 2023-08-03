const requireAuthentication = (req, res, next) => {
  const isAuthenticated = req.headers.authorization;

  if (isAuthenticated) {
    next();
  } else {
    res.status(401).send({
      error: "ERROR",
      message: "You must be logged in to perform this action",
      name: "UNAUTHORIZED",
    });
  }
};

module.exports = {
  requireAuthentication,
};

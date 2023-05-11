// this file has error handling middlewares for api route not found and any error handlers

const NotFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  // set the statuscode of not found
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  // if the statuscode is 200 make it 500 ,else keep it as it is
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  // set the status as the statuscode
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = { NotFound, errorHandler };

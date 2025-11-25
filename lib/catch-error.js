// black box vibes. handler is an async middleware 
const catchError = handler => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

module.exports = catchError
/*
  * # Problem: When middlewares return promise, eg: async (req, res, next) => {} and either
  * throw an error, have a promise rejection or exception,
  * the exception / rejection becomes unhandled and is not passed to express error handler.
  *
  * # Solution: Wrapping all middlewares inside rejSafe
  * would catch their rejections and pass error to express' error handler
  * for logging / sending appropriate response to user.
*/
const wrapExpressMiddleWare = () => {
  const layer = require('express/lib/router/layer');

  const handleRequest = layer.prototype.handle_request;

  layer.prototype.handle_request = function (
    _req,
    _res,
    next
  ) {
    if (!this.isWrapped) {
      this.isWrapped = true;
      const handle = this.handle;

      // If handle has more than three params then it is error handler
      // We are only wrapping request handlers now. Skip.
      if (handle.length > 3) {
        return next();
      }

      this.handle = function (_req2, _res2, next2) {
        // Use try catch block to catch errors if they are not promise based
        // This is standard implementation of handle_request function
        try {
          const p = handle.apply(this, arguments); // eslint-disable-line prefer-rest-params

          // If handle returns a promise, add code to make it safely reject
          if (p && p.catch) {
            p.catch((err) => {
              next2(err);
            });
          }

          return p;
        } catch (e) {
          next2(e);
        }
      };
    }

    return handleRequest.apply(this, arguments); // eslint-disable-line prefer-rest-params
  };
};

module.exports = wrapExpressMiddleWare;

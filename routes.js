const jwt = require("jsonwebtoken");
const config = require("./config.json");
const SendQuery = require("./database");

module.exports = (app) => {

  // Authentication Request
  app.post(config.api.route + "/auth", (req, res) => {
    if (CheckSecret(req.body.secret)) {
      jwt.sign({ community: req.body.community }, req.body.secret, { expiresIn: '2 days' }, (error, token) => {
        if (!error) {
          res.json({ status: true, message: "[ExternalSQL]: Token Created!", token })
        } else {
          res.json({ status: false, error: `[ExternalSQL]: ${error.message}`, token: null });
        }
      })
    } else {
      res.json({ status: false, error: "[ExternalSQL]: Secret Invalid!", token: null });
    }
  }),

  app.post(config.api.route + "/query", VerifyToken, async (req, res) => {
    jwt.verify(req.token, req.body.secret, async (error, authData) => {
      if (!error) {
        // Null Checking
        Object.keys(req.body.data).forEach((k) => {
          if (req.body.data[k].toLowerCase() == "null") {
            req.body.data[k] = null
          }
        })
        const query = await SendQuery(req.body.query, req.body.data);
        res.json(query);
      } else {
        res.json({ status: false, message: `[ExternalSQL]: ${error}`, results: null });
      }
    })
  })

}

function VerifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof(bearerHeader) !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    req.token = bearerToken;
    next()
  } else {
    res.json("[ExternalSQL]: Token Not Found!");
  }
}

function CheckSecret(key) {
  if (key == config.api.secret) {
    return true
  }
  return false
}

console.log("[ExternalSQL]: Loaded `routes.js`");
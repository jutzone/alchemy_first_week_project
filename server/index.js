const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
const secp = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { toHex, utf8ToBytes } = require("ethereum-cryptography/utils");

app.use(cors());
app.use(express.json());

const balances = {
  "039aa694dbf77000f10b27c500bb358cca9f43d0501595960518c0a8b63b0e104f": 100,
  "032267a25dabf478755c5ae9193d5210bb09cceea042bcc81e52425ec67213b465": 50,
  "022d4c3c51ede29bd21d35ac362f308fe8562109eba8314305d6d00483f7b5b13d": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { signature, msg, recipient, amount } = req.body;
  let { r, s, recovery } = signature;
  r = BigInt(r);
  s = BigInt(s);
  const sig = new secp.secp256k1.Signature(r, s, recovery);
  const hash = keccak256(utf8ToBytes(msg));
  const sender = sig.recoverPublicKey(hash).toHex();
  const isSigned = secp.secp256k1.verify(sig, hash, sender);
  if (!isSigned) {
    res.status(409).send({ message: "Not signed" });
  }
  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}

// 87a0778d7bcdc60eb5a30fe2bf83682d1709b9775a5ccc9c90e28067ec0decf2 039aa694dbf77000f10b27c500bb358cca9f43d0501595960518c0a8b63b0e104f
// 36bca01238021efa827102dceeffcd4a654b56c46ba7f3baa27543f2309e2177 032267a25dabf478755c5ae9193d5210bb09cceea042bcc81e52425ec67213b465
// f2b043e2efb95336bc8c2dbe0e750eb3e1cc5636859012701d2e8b7445f7147d 022d4c3c51ede29bd21d35ac362f308fe8562109eba8314305d6d00483f7b5b13d

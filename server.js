const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Connect Mongo
mongoose
    .connect("mongodb://127.0.0.1:27017/khatabook")
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.log(err));

// ✅ Models
const Customer = mongoose.model("Customer", {
    name: String,
    phone: String,
});

const Transaction = mongoose.model("Transaction", {
    customerId: String,
    amount: Number,
    type: String, // credit or debit
    note: String,
    date: { type: Date, default: Date.now },
});

// ✅ Get all customers
app.get("/api/customers", async(req, res) => {
    const customers = await Customer.find();
    const transactions = await Transaction.find();

    const customersWithBalances = customers.map((c) => {
        const custTx = transactions.filter((t) => t.customerId === c._id.toString());
        const balance = custTx.reduce(
            (sum, t) => sum + (t.type === "credit" ? t.amount : -t.amount),
            0
        );
        return { id: c._id, name: c.name, phone: c.phone, balance };
    });

    res.json({ customers: customersWithBalances });
});

// ✅ Add customer
app.post("/api/customers", async(req, res) => {
    await Customer.create(req.body);
    res.json({ success: true });
});

// ✅ Delete customer + transactions
app.delete("/api/customers/:id", async(req, res) => {
    await Customer.findByIdAndDelete(req.params.id);
    await Transaction.deleteMany({ customerId: req.params.id });
    res.json({ success: true });
});

// ✅ Add transaction
app.post("/api/transaction", async(req, res) => {
    await Transaction.create(req.body);
    res.json({ success: true });
});

// ✅ Load ledger
app.get("/api/ledger/:id", async(req, res) => {
    const customer = await Customer.findById(req.params.id);
    const transactions = await Transaction.find({ customerId: req.params.id });

    const balance = transactions.reduce(
        (sum, t) => sum + (t.type === "credit" ? t.amount : -t.amount),
        0
    );

    res.json({ customer, transactions, balance });
});

// ✅ Delete transaction
app.delete("/api/transaction/:id", async(req, res) => {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// ✅ Start server
app.listen(5000, () => console.log("✅ Backend running http://localhost:5000"));
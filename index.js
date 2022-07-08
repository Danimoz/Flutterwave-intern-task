const express = require('express')
const app = express()

const PORT = process.env.PORT || 5000
app.use(express.json())

app.post('/split-payments/compute', (req, res) => {
    let { ID, Amount, Currency, CustomerEmail } = req.body;
    let ratioTotal = 0, sumRatio = 0
    const temarr = [], SplitBreakdown = [], ratioArr = []

    if (ID == "" || ID == null || isNaN(ID)) res.status(400).send({ message: "No ID given" })
    if (Amount == "" || Amount == null) res.status(400).send({ message: "No Amount given" })
    if (Currency == "" || Currency == null) res.status(400).send({ message: "No Currency given" })
    if (CustomerEmail == "" || CustomerEmail == null) res.status(400).send({ message: "No CustomerEmail given" })
    if (req.body.SplitInfo.length == 0 || req.body.SplitInfo.length > 20) res.status(400).send({ message: "Exceeded SplitInfo"})

    for (i = 0; i < req.body.SplitInfo.length; i++){
        if (req.body.SplitInfo[i].SplitType === "FLAT") {
            temarr.push(req.body.SplitInfo[i])
        }
    }
    for (i = 0; i < req.body.SplitInfo.length; i++){
        if (req.body.SplitInfo[i].SplitType === "PERCENTAGE") {
            temarr.push(req.body.SplitInfo[i])
        }
    }
    for (i = 0; i < req.body.SplitInfo.length; i++){
        if (req.body.SplitInfo[i].SplitType === "RATIO") {
            temarr.push(req.body.SplitInfo[i])
        }
    }

    for (i = 0; i < temarr.length; i++){
        if(temarr[i].SplitType === "RATIO") ratioTotal += temarr[i].SplitValue
    }

    for(i = 0; i < temarr.length; i++){
        if(temarr[i].SplitType === "FLAT") {
            if (Amount < 0 || temarr[i].SplitValue > Amount || temarr[i].SplitValue < 0) {
                Amount = 0
                res.status(400).send({ message: "Split Amount can't be greater than transaction Amount" })
                break
            } else {
                Amount = Amount - temarr[i].SplitValue
                SplitBreakdown.push({ SplitEntityId: temarr[i].SplitEntityId, Amount: temarr[i].SplitValue })
            }
        }
        if(temarr[i].SplitType === "PERCENTAGE") {
            const percentAmt = (temarr[i].SplitValue / 100) * Amount
            if (Amount < 0 || percentAmt > Amount || percentAmt < 0) {
                Amount = 0
                res.status(400).send({ message: "Split Amount can't be greater than transaction Amount" })
                break
            } else {
                Amount = Amount - percentAmt
                SplitBreakdown.push({ SplitEntityId: temarr[i].SplitEntityId, Amount: percentAmt })
            }
        }
        if(temarr[i].SplitType === "RATIO") {
            const openingRatioBalance = Amount
            let ratioAmt = (temarr[i].SplitValue / ratioTotal) * openingRatioBalance
            ratioArr.push(ratioAmt)
            if (Amount - ratioAmt <= 0) {
                Amount = 0
                break
            } else {
                SplitBreakdown.push({ SplitEntityId: temarr[i].SplitEntityId, Amount: ratioAmt })
            }
        }
    }
    for (j = 0; j<ratioArr.length; j++){
        sumRatio += ratioArr[j]
    }
    if (sumRatio > Amount || sumRatio < 0 || Amount < 0){
        res.status(400).send({ message: "Split Amount can't be greater than transaction Amount" })
    } else Amount = Amount - sumRatio

    res.send({ ID: ID, Balance: Amount, tot: SplitBreakdown})  

})
app.listen(PORT, () => console.info(`Server has started on ${PORT}`))

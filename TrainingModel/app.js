import { createChart, updateChart } from "./scatterplot.js"

//
// Data
//
let nn
const csvFile = "./data/car.csv"
const ignoredColumns = ["FuelConsumptionCity", "FuelConsumptionHwy", "FuelConsumptionCombMpg"]
const url = "https://api.overheid.io/voertuiggegevens/"
const key = "790e67a7df3d78ba197a8ef6d1a8f5300f536acaa290728e653df15a6bafe96f"
const save = document.getElementById("saveModel")
let finishedTraining = false
let personalCar = []


//feature-extractor
// Load the CSV data
//
function loadData() {
    Papa.parse(csvFile, {
        download: true,
        header: true,
        dynamicTyping: true,
        complete: (results) => deleteColumn(results.data)
    })
}

//
// Delete Columns  
//
function deleteColumn(data) {
    for (let i = 0; i < data.length; i++) {
        for (let r = 0; r < ignoredColumns.length; r++) {
            delete data[i][ignoredColumns[r]]
        }
    }
    deleteNull(data);
}

//
// DELETE NULL gives less accurate results
//
function deleteNull(data) {
    // loop to remove item from data if age = null
    for (let result = 0; result < data.length; result++) {
        if (data[result].FuelConsumptionComb == null) {
            data.splice(result.id, 1)
            result--
        }
        if (data[result].CO2Emissions == null) {
            data.splice(result.id, 1)
            result--
        }
    }

    //Create Chart
    createChart()

    // pass the data to the showdata function
    showData(data)
    // pass the data to a neural network
    createNeuralNetwork(data)
}

function showData(data) {
    let diesel = []
    let ethanol = []
    let gas = []
    let regularGasoline = []
    let premiumGasoline = []

    for (let car of data) {
        //Check of fueltype is Diesel
        if (car.FuelType === "D") {
            diesel.push({ x: car.FuelConsumptionComb, y: car.CO2Emissions })
        }
        //Check of fueltype is Ethanol
        if (car.FuelType === "E") {
            ethanol.push({ x: car.FuelConsumptionComb, y: car.CO2Emissions })
        }
        //Check of fueltype is Natural Gas
        if (car.FuelType === "N") {
            gas.push({ x: car.FuelConsumptionComb, y: car.CO2Emissions })
        }
        //Check of fueltype is Regular Gasoline
        if (car.FuelType === "X") {
            regularGasoline.push({ x: car.FuelConsumptionComb, y: car.CO2Emissions })
        }
        //Check of fueltype is Premium Gasoline
        if (car.FuelType === "Z") {
            premiumGasoline.push({ x: car.FuelConsumptionComb, y: car.CO2Emissions })
        }
    }

    //Draw new charts for each type of fuel
    updateChart("Diesel", diesel, "#0000FF")
    updateChart("Ethonal", ethanol, "#4CA64C")
    updateChart("Natual Gas", gas, "#99CC99")
    updateChart("Regular gasoline", regularGasoline, "#3d85c6")
    updateChart("Premium gasoline", premiumGasoline, "#d5a6bd")
}


//
// make and train the Neural Network
//
async function createNeuralNetwork(data) {
    data.sort(() => (Math.random() - 0.5))
    // create the neural network
    nn = ml5.neuralNetwork({ task: "regression", debug: true })

    // add data to the neural network with addData
    for (let car of data) {
        // add the FuelType, FuelConsumptionComb, Cylindersen and EngineSize with the output of CO2Emissions 
        nn.addData({ FuelType: car.FuelType, FuelConsumptionComb: car.FuelConsumptionComb, Cylinders: car.Cylinders }, { CO2Emissions: car.CO2Emissions })
    }

    // train the neural network
    nn.normalizeData()
    nn.train({ epochs: 5 }, () => trainingFinished())
}


async function trainingFinished() {
    await fetchLicensePlate()

    // create a Testcar with data of the average of a Premium Gasoline 
    let testCar = { FuelType: personalCar[0].brandstof[0].brandstof_omschrijving, FuelConsumptionComb: personalCar[0].brandstof[0].brandstofverbruik_gecombineerd, Cylinders: personalCar[0].aantal_cilinders }

    console.log(testCar);
    // predict the testcar and show in index.html
    const results = await nn.predict(testCar)
    const predict = Math.round(results[0].CO2Emissions)
    document.getElementById("prediction").innerHTML = `Car with Fuel type Premium Gasoline and Fuel Consumption Combined of ${testCar.FuelConsumptionComb}L/100km admits an estimated ${predict} Gram/km CO2`

    // create a prediction for every Fuel Consumption Combined and push into the tempArray
    let tempArray = []
    for (let fc = 1; fc < 21; fc++) {
        const result = await nn.predict({ FuelType: testCar.FuelType, FuelConsumptionComb: fc, Cylinders: personalCar[0].aantal_cilinders })
        tempArray.push({ x: fc, y: result[0].CO2Emissions })
    }

    // show the predictions array in de scatterplot 
    updateChart("Predicted CO2Emissions with Engine Size and Cylinders", tempArray, "#FF0000", "#FF0000", "line")
    finishedTraining = true
    save.addEventListener("click", downloadModel)
}

function downloadModel() {
    if (finishedTraining) {
        nn.save()
    }
    finishedTraining = false
}

loadData()
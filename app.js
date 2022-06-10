const nn = ml5.neuralNetwork({task: "regression", debug:true})

const url = "https://api.overheid.io/voertuiggegevens/"
const key = "98464c5cfe29b4613fca96699ce6ad2edc9faef966876a0099347c6d26e3764"
const submit = document.getElementById('submit')

let model

function loadModel(){
    const modelDetail = {
        model: "models/model.json",
        metadata: "models/model_meta.json",
        weights: "models/model.weights.bin"
    }
    nn.load(modelDetail)
    submit.addEventListener('click', fetchLicensePlate)

}

async function fetchLicensePlate() {
    let license = document.getElementById('license').value
    let searchURL = url + license
    let car;

    await fetch(searchURL, {
        headers: {
            "ovio-api-key": key
        }
    })
        .then(response => response.json())
        .then(data => {
            let fuel = data.brandstof[0].brandstof_omschrijving
            let fuelType = ""
            switch (fuel) {
                case "Diesel":
                    fuelType = "D"
                    break;
                case "D":
                    fuelType = "E"
                    break;
                case "D":
                    fuelType = "N"
                    break;
                case "Benzine":
                    fuelType = "X"
                    break;
                case "D":
                    fuelType = "Z"
                    break;
                default:
                    break;
            }
            data.brandstof[0].brandstof_omschrijving = fuelType
            car = data
        })
        console.log(car);
        //Check if the car has all the values
        if(car.brandstof[0].hasOwnProperty("brandstofverbruik_gecombineerd") || car.brandstof[0].hasOwnProperty("brandstof_omschrijving") || car.brandstof[0].hasOwnProperty("aantal_cilinders")){
            prediction(car)
        }else{
            console.log("No car found");
        }
}

async function prediction(car){
    let testCar = { FuelType: car.brandstof[0].brandstof_omschrijving, FuelConsumptionComb: car.brandstof[0].brandstofverbruik_gecombineerd, Cylinders: car.aantal_cilinders }

    console.log(testCar);
    const results = await nn.predict(testCar)
    const predict = Math.round(results[0].CO2Emissions)
    let emission = `${Math.round(predict / 600 * 100)}%`
    console.log(emission);
    document.getElementById("predictedEmission").style.width = emission
    document.getElementById("car-progress").style.left = emission
    document.getElementById("car").classList.remove("d-none")
    
    let fuel = car.brandstof[0].brandstof_omschrijving
    let fuelType = ""
    switch (fuel) {
        case "D":
            fuelType = "Diesel"
            break;
        case "D":
            fuelType = "E"
            break;
        case "D":
            fuelType = "N"
            break;
        case "X":
            fuelType = "Benzine"
            break;
        case "D":
            fuelType = "Z"
            break;
        default:
            break;
    }
    car.brandstof[0].brandstof_omschrijving = fuelType

    document.getElementById("prediction").innerHTML = `
    <h4>Voorspelling:</h4>
    <p>
        Je auto met het brandstof type ${car.brandstof[0].brandstof_omschrijving} heeft een gemiddelde brandstof uitstoot van ${testCar.FuelConsumptionComb}L/100km en stoot gemiddeld ${predict}Gram/km CO2 uit.
    </p>`
}

function vehicleNotFound(){
    console.log("Vehicle is not found");
}

loadModel()

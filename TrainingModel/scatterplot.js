const canvas = document.getElementById('myChart')
let myChart

// documentatie 
// https://www.chartjs.org/docs/latest/charts/scatter.html

export function createChart(){
    const config = {
        type: 'scatter',
        data: {},
        options: {
            scales: {
                x: {
                    title: {display: true, text: 'Fuel Consumption Combined'}
                },
                y: {
                    title: {display: true, text: 'CO2Emissions'}
                }
            },
            layout: {
                padding: 30
            }
        }
    }

    myChart = new Chart(canvas, config)
}

// update an existing chart
// https://www.chartjs.org/docs/latest/developers/updates.html
export function updateChart(label, data, color, lineColor, type,){
    myChart.data.datasets.push({
        label,
        data,
        backgroundColor: color,
        
        //Line new data
        type: type,
        borderColor: lineColor,
        tension: 0.1
    })
    myChart.update()
}
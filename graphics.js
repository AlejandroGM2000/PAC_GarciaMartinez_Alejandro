let allData = [];
let filteredData = [];

document.addEventListener('DOMContentLoaded', function() {
    fetch('synthetic_data.json')
        .then(response => response.json())
        .then(data => {
            allData = data;
            filteredData = [...data];

            document.getElementById('numPatients').textContent = `Pacientes atendidos entre 2014 y 2019: ${data.length}`;
            
            initCharts();
            initFilters();
            updateCharts();
        })
        .catch(error => {
            console.error('Error al cargar los datos:', error);
        });        
    document.getElementById('sidebarToggle').addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('active');
    });
});

function initCharts() {
    Highcharts.chart('genderChart', getGenderChartConfig([]));
    Highcharts.chart('ageChart', getAgeChartConfig([]));
    Highcharts.chart('losChart', getLOSChartConfig([]));
    Highcharts.chart('outcomeChart', getOutcomeChartConfig([]));
}

function initFilters() {
    document.getElementById('resetFilters').addEventListener('click', resetFilters);

    const ageRange = document.getElementById('ageRange');
    const minAgeInput = document.getElementById('minAge');
    const maxAgeInput = document.getElementById('maxAge');
    const ageValue = document.getElementById('ageValue');
    
    ageRange.addEventListener('input', function() {
        maxAgeInput.value = this.value;
        updateAgeDisplay();
    });
    
    minAgeInput.addEventListener('change', function() {
        if (parseInt(this.value) > parseInt(maxAgeInput.value)) {
            this.value = maxAgeInput.value;
        }
        updateAgeDisplay();
    });
    
    maxAgeInput.addEventListener('change', function() {
        if (parseInt(this.value) < parseInt(minAgeInput.value)) {
            this.value = minAgeInput.value;
        }
        ageRange.value = this.value;
        updateAgeDisplay();
    });
    
    function updateAgeDisplay() {
        ageValue.textContent = `${minAgeInput.value}-${maxAgeInput.value}`;
    }

    const minLosInput = document.getElementById('minLos');
    const maxLosInput = document.getElementById('maxLos');
    const losValue = document.getElementById('losValue');


    minLosInput.addEventListener('change', function() {
        if (parseFloat(this.value) > parseFloat(maxLosInput.value)) {
            this.value = maxLosInput.value;
        }
        updateLosDisplay();
    });

    function updateLosDisplay() {
        losValue.textContent = `${minLosInput.value}-${maxLosInput.value}`;
    }
    
    document.getElementById('applyFilters').addEventListener('click', function() {
        applyFilters();
    });
    
     updateDischargeLocationFilters();

    document.getElementById('filterAllLocations').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.discharge-location-filter:not(#filterAllLocations)');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });
}

function applyFilters() {
    const showMale = document.getElementById('filterMale').checked;
    const showFemale = document.getElementById('filterFemale').checked;
    const minAge = parseInt(document.getElementById('minAge').value);
    const maxAge = parseInt(document.getElementById('maxAge').value);
    const minLos = parseFloat(document.getElementById('minLos').value);
    const maxLos = parseFloat(document.getElementById('maxLos').value);
    
    const selectedLocations = [];
    document.querySelectorAll('.discharge-location-filter:checked').forEach(checkbox => {
        selectedLocations.push(checkbox.nextElementSibling.textContent);
    });

    filteredData = allData.filter(patient => {
        const genderFilter = 
            (showMale && patient.gender === 'M') || 
            (showFemale && patient.gender === 'F');
        if (!genderFilter) return false;
        
        const ageFilter = patient.age >= minAge && patient.age <= maxAge;
        if (!ageFilter) return false;

        const losFilter = patient.los >= minLos && patient.los <= maxLos;
        if (!losFilter) return false;
        
        // Si no hay ubicaciones seleccionadas, incluir todos los pacientes
        if (selectedLocations.length === 0) return true;
        
        // Si hay ubicaciones seleccionadas, solo incluir pacientes con esas ubicaciones
        return patient.discharge_location && selectedLocations.includes(patient.discharge_location);
    });
    
    document.getElementById('numPatients').textContent =
        `Pacientes atendidos entre 2014 y 2019: ${filteredData.length}`;

    updateCharts();
}

function updateCharts() {
    Highcharts.chart('genderChart', getGenderChartConfig(filteredData));
    Highcharts.chart('ageChart', getAgeChartConfig(filteredData));
    Highcharts.chart('losChart', getLOSChartConfig(filteredData));
    Highcharts.chart('outcomeChart', getOutcomeChartConfig(filteredData));
}

function getGenderChartConfig(data) {
    const genderCounts = { 'M': 0, 'F': 0 };

    data.forEach(patient => {
        if (patient.gender === 'M') genderCounts.M++;
        else if (patient.gender === 'F') genderCounts.F++;
    });

    const total = genderCounts.M + genderCounts.F;

    if (total === 0) {
        return {
            chart: { type: 'pie', backgroundColor: 'transparent', height: '60%' },
            title: { text: null },
            subtitle: {
                text: 'Sin pacientes disponibles',
                align: 'center',
                style: { color: '#999', fontSize: '12px' }
            },
            series: [{
                name: 'Género',
                data: []
            }],
            tooltip: { enabled: false },
            legend: { enabled: false },
            credits: { enabled: false }
        };
    }

    const malePercentage = (genderCounts.M / total * 100).toFixed(1);
    const femalePercentage = (genderCounts.F / total * 100).toFixed(1);

    return {
        chart: { type: 'pie', backgroundColor: 'transparent', height: '60%' },
        title: { text: null },
        subtitle: {
            text: `Total: ${total} pacientes`,
            align: 'center',
            style: { color: '#666', fontSize: '12px' }
        },
        plotOptions: {
            pie: {
                innerSize: '60%',
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f}%',
                    distance: -30,
                    style: {
                        color: 'black',
                        textOutline: 'none',
                        fontWeight: 'bold',
                        fontSize: '12px'
                    }
                },
                showInLegend: true,
                borderWidth: 0
            }
        },
        colors: ['#3498db', '#e74c3c'],
        series: [{
            name: 'Género',
            data: [
                { name: 'Hombres', y: parseFloat(malePercentage), sliced: true },
                { name: 'Mujeres', y: parseFloat(femalePercentage) }
            ]
        }],
        tooltip: { pointFormat: '<b>{point.percentage:.1f}%</b> del total' },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle',
            itemStyle: { fontSize: '12px' }
        },
        credits: { enabled: false }
    };
}

function getAgeChartConfig(data) {
    const ages = data.map(patient => patient.age).filter(age => age != null);
    ages.sort((a, b) => a - b);

    if (ages.length === 0) {
        return {
            chart: { type: 'boxplot', height: '50%' },
            title: { text: null },
            subtitle: {
                text: 'Sin pacientes disponibles',
                align: 'center',
                style: { color: '#999', fontSize: '12px' }
            },
            xAxis: { visible: false },
            yAxis: {
                title: { text: 'Edad' },
                min: 0
            },
            series: [{
                name: 'Edad',
                data: []
            }],
            tooltip: { enabled: false },
            legend: { enabled: false },
            credits: { enabled: false }
        };
    }

    const q1 = ages[Math.floor(ages.length * 0.25)];
    const median = ages[Math.floor(ages.length * 0.5)];
    const q3 = ages[Math.floor(ages.length * 0.75)];
    const iqr = q3 - q1;
    const min = Math.max(ages[0], q1 - 1.5 * iqr);
    const max = Math.min(ages[ages.length - 1], q3 + 1.5 * iqr);

    return {
        chart: { type: 'boxplot', height: '50%' },
        title: { text: null },
        subtitle: {
            text: `Total: ${ages.length} pacientes`,
            align: 'center',
            style: { color: '#666', fontSize: '12px' }
        },
        xAxis: { visible: false },
        yAxis: {
            title: { text: 'Edad' },
            min: Math.max(0, ages[0] - 5)
        },
        series: [{
            name: 'Edad',
            data: [[min, q1, median, q3, max]],
            color: '#2ecc71',
            fillColor: 'rgba(46, 204, 113, 0.2)'
        }],
        tooltip: {
            headerFormat: '<span style="font-size:12px"><b>Distribución de Edades</b></span><br/>',
            pointFormat: [
                'Mínimo: {point.low}<br/>',
                'Q1: {point.q1}<br/>',
                'Mediana: {point.median}<br/>',
                'Q3: {point.q3}<br/>',
                'Máximo: {point.high}<br/>'
            ].join('')
        },
        legend: { enabled: false },
        credits: { enabled: false }
    };
}

function getLOSChartConfig(data) {
    const losValues = data.map(patient => patient.los).filter(los => los != null);

    if (losValues.length === 0) {
        return {
            chart: { type: 'column', height: '100%', backgroundColor: 'transparent' },
            title: { text: null },
            subtitle: {
                text: 'Sin datos disponibles',
                align: 'center',
                style: { color: '#999', fontSize: '12px' }
            },
            series: [{ data: [] }],
            legend: { enabled: false },
            credits: { enabled: false }
        };
    }

    const binSize = 1;
    const maxLOS = Math.max(...losValues);
    const minLOS = 0;
    const numBins = Math.ceil(maxLOS - minLOS) + 1;

    const bins = new Array(numBins).fill(0);

    losValues.forEach(los => {
        const binIndex = Math.floor(los);
        if (binIndex >= minLOS && binIndex < minLOS + numBins) {
            bins[binIndex - minLOS]++;
        }
    });

    const mean = losValues.reduce((a, b) => a + b, 0) / losValues.length;
    const median = calculateMedian(losValues);

    return {
        chart: {
            type: 'column',
            height: '40%',
            backgroundColor: 'transparent'
        },
        title: { text: null },
        subtitle: {
            text: `Total: ${losValues.length} pacientes | Media: ${mean.toFixed(1)} días | Mediana: ${median.toFixed(1)} días`,
            align: 'center',
            style: { color: '#666', fontSize: '12px' }
        },
        xAxis: {
            type: 'linear',
            title: { text: 'Días de estancia (LOS)' },
            min: minLOS - 0.5,
            max: maxLOS + 0.5,
            tickInterval: 1,
            labels: {
                formatter: function() {
                    return this.value.toFixed(0);
                },
                style: { fontSize: '10px' }
            },
            crosshair: true
        },
        yAxis: {
            title: { text: 'Número de pacientes' },
            allowDecimals: false,
            min: 0
        },
        tooltip: {
            formatter: function() {
                const x = this.point.x;
                return `<b>LOS:</b> ${x} - ${x + 1} días<br/><b>Pacientes:</b> ${this.point.y}`;
            }
        },
        plotOptions: {
            column: {
                pointPadding: 0,
                groupPadding: 0,
                borderWidth: 0,
                borderRadius: 2,
                shadow: false,
                pointRange: binSize,
                colorByPoint: true,
                colors: bins.map((_, i) => {
                    return (median >= i && median < i + 1) ? '#e74c3c' : '#2ecc71';
                }),
                pointPlacement: 'between'
            },
            series: {
                animation: { duration: 300 },
                dataLabels: { enabled: false }
            }
        },
        series: [{
            name: 'Frecuencia LOS',
            data: bins.map((count, i) => ({
                x: i,
                y: count,
                color: '#2ecc71'
            })),
            showInLegend: false
        }],
        legend: { enabled: false },
        credits: { enabled: false }
    };
}


function calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0 
        ? (sorted[middle - 1] + sorted[middle]) / 2 
        : sorted[middle];
}

function getOutcomeChartConfig(data) {
    const locationCounts = {};
    
    data.forEach(patient => {
        if (patient.discharge_location) {
            locationCounts[patient.discharge_location] = (locationCounts[patient.discharge_location] || 0) + 1;
        }
    });
    
    const seriesData = Object.entries(locationCounts).map(([name, count]) => ({
        name: name,
        y: count
    }));
    
    seriesData.sort((a, b) => b.y - a.y);
    
    if (seriesData.length === 0) {
        return {
            chart: { type: 'bar', height: '40%', backgroundColor: 'transparent' },
            title: { text: null },
            subtitle: {
                text: 'Sin datos disponibles',
                align: 'center',
                style: { color: '#999', fontSize: '12px' }
            },
            series: [{ data: [] }],
            legend: { enabled: false },
            credits: { enabled: false }
        };
    }
    
    return {
        chart: {
            type: 'bar',
            height: '40%',
            backgroundColor: 'transparent'
        },
        title: {
            text: null
        },
        subtitle: {
            text: `Total pacientes: ${data.length}`,
            align: 'center',
            style: { color: '#666', fontSize: '12px' }
        },
        xAxis: {
            type: 'category',
            title: {
                text: 'Ubicación de alta'
            },
            labels: {
                style: {
                    fontSize: '11px'
                },
                rotation: -45
            }
        },
        yAxis: {
            title: {
                text: 'Número de pacientes'
            },
            allowDecimals: false,
            min: 0
        },
        legend: {
            enabled: false
        },
        tooltip: {
            headerFormat: '<span style="font-size:11px">{point.key}</span><br>',
            pointFormat: '<span style="color:{point.color}">●</span> {series.name}: <b>{point.y}</b><br/>'
        },
        plotOptions: {
            bar: {
                borderRadius: 3,
                borderWidth: 0,
                color: '#3498db',
                dataLabels: {
                    enabled: true,
                    format: '{point.y}',
                    style: {
                        fontSize: '11px',
                        textOutline: 'none'
                    }
                }
            }
        },
        series: [{
            name: 'Pacientes',
            colorByPoint: true,
            data: seriesData
        }],
        credits: {
            enabled: false
        }
    };
}

function updateDischargeLocationFilters() {
    const uniqueLocations = [...new Set(allData.map(patient => patient.discharge_location))].filter(Boolean);
    const container = document.getElementById('dischargeLocationFilters');
    container.innerHTML = '';

    uniqueLocations.forEach(location => {
        const div = document.createElement('div');
        div.className = 'form-check';
        div.innerHTML = `
            <input class="form-check-input discharge-location-filter" type="checkbox" id="filterLocation_${location}">
            <label class="form-check-label" for="filterLocation_${location}">${location}</label>
        `;
        container.appendChild(div);
    });
}

function resetFilters() {
    document.getElementById('filterMale').checked = true;
    document.getElementById('filterFemale').checked = true;
    
    document.getElementById('minAge').value = 18;
    document.getElementById('maxAge').value = 100;
    document.getElementById('ageRange').value = 100;
    document.getElementById('ageValue').textContent = '18-100';
    
    document.getElementById('minLos').value = 0;
    document.getElementById('maxLos').value = 30;
    
    document.querySelectorAll('.discharge-location-filter').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    applyFilters();
}


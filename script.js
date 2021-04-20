fetch('https://pascal-school-default-rtdb.europe-west1.firebasedatabase.app/Nabestaandenpensioen.json', {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            "Access-Control-Allow-Origin": "*"
        }
    })
    .then(response => response.json())
    .then(result => {
        document.querySelector('#cases-amount').textContent = result.length;
        document.querySelector('#cases-open').textContent = result.filter(c => !c.hasOwnProperty('EindeCaseV3')).length;
        createLineChart(result);
        createPieChart(result);
        fetch('https://pascal-school-default-rtdb.europe-west1.firebasedatabase.app/Klanteninfo.json', {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    "Access-Control-Allow-Origin": "*"
                }
            })
            .then(response => response.json())
            .then(clients => {
                createTable(result, clients)
            })
    })

function createLineChart(result) {
    result = result.sort((a, b) => moment(a.StartCaseV3).valueOf() - moment(b.StartCaseV3).valueOf());
    const start = moment(result[0].StartCaseV3);
    const end = moment(result[result.length - 1].StartCaseV3);
    const labels = Array(end.diff(start, 'weeks') + 1).fill(0).map((v, i) => start.clone().add(i, 'weeks').format('w-YYYY'));
    const data = {
        labels: labels,
        datasets: [{
            label: 'Aantal meldingen',
            data: Array(end.diff(start, 'weeks') + 1).fill(0).map((v, i) => result.filter(c => moment(c.StartCaseV3).isSame(start.clone().add(i, 'weeks'), 'week')).length),
            borderColor: 'rgb(54, 162, 235)',
            tension: 0.1,
        }]
    };
    new Chart(
        document.getElementById('line-chart'), {
            type: 'line',
            data: data,
            options: {
                plugins: {
                    legend: {
                        labels: {
                            font: {
                                size: 14,
                                family: 'Open Sans',
                            }
                        }
                    }
                }
            }
        }
    );
}

function createPieChart(result) {
    const labels = Array.from(new Set(result.map(c => c.Wijzeuitvoering.toLowerCase())));
    const data = {
        labels: labels,
        datasets: [{
            data: Array(labels.length).fill(0).map((v, i) => result.filter(c => c.Wijzeuitvoering.toLowerCase() === labels[i]).length),
            backgroundColor: [
                'rgb(255, 99, 132)',
                'rgb(54, 162, 235)',
                'rgb(255, 205, 86)'
            ],
            hoverOffset: 4
        }]
    }
    new Chart(
        document.getElementById('pie-chart'), {
            type: 'doughnut',
            data: data,
            options: {
                plugins: {
                    legend: {
                        labels: {
                            font: {
                                size: 14,
                                family: 'Open Sans',
                            }
                        }
                    }
                }
            }
        }
    )
}

function createTable(result, clients) {
    const table = document.querySelector('tbody#table');
    clients.forEach((client, i) => {
        const row = document.createElement('tr');
        row.setAttribute('role', 'button');
        row.setAttribute('aria-expanded', false);
        row.setAttribute('data-bs-target', `#ClientInfo-${i}`);
        row.setAttribute('data-bs-toggle', 'collapse');
        row.innerHTML = `<th scope="row">${client.klantnummer}</th>
        <td>${client.geboortedatum}</td>
        <td>${client.overlijdensdatum}</td>
        <td>${client.geslacht === "M" ? '<i class="fa fa-mars" aria-hidden="true"></i>' : '<i class="fa fa-venus" aria-hidden="true"></i>'}</td>`;
        const info = document.createElement('ul');
        info.id = `ClientInfo-${i}`;
        info.classList.add("collapse", "list-group");
        const cases = result.filter(c => c.Klantnummer === client.klantnummer);
        cases.forEach(c => {
            const item = document.createElement('li');
            item.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
            item.innerHTML = `<div class="me-auto">
            <h4 class="list-group-item-title">${c.Procesnaam}</h4>
            <h5 class="list-group-item-subtitle">${c.Processtapnaam}</h5>
            <p class="list-group-item-content"><i class="fa fa-hourglass-start" aria-hidden="true"></i>&nbsp;${moment(c.StartProcesstapV3).format('LLL')}&nbsp;-&nbsp;<i class="fa fa-hourglass-end" aria-hidden="true"></i>&nbsp;${moment(c.EindeProcesstapV3).format('LLL')}</p>
          </div>`
            info.appendChild(item)
        });
        table.appendChild(row);
        table.appendChild(info)
    });
}
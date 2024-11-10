document.addEventListener("DOMContentLoaded", function() {
    const bucketUrl = 'http://swoec2monitoringwebapp-fieg.s3-website-sa-east-1.amazonaws.com/';

    function loadInstanceData(fileName) {
        const url = `${bucketUrl}${fileName}?timestamp=${new Date().getTime()}`;

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao carregar as informaÃ§Ãµes das instÃ¢ncias do arquivo ${fileName}.`);
                }
                return response.json();
            })
            .then(data => {
                // Criar seÃ§Ã£o para a conta e regiÃ£o
                const accountSection = document.createElement("div");
                accountSection.classList.add("account-section");

                const accountInfo = document.createElement("h3");
                accountInfo.textContent = `Conta: ${data.AccountName} (ID: ${data.AccountId}) - RegiÃ£o: ${data.Region}`;
                accountSection.appendChild(accountInfo);

                const table = document.createElement("table");
                table.classList.add("instances-table");

                // Definindo o cabeÃ§alho da tabela com todas as colunas
                const tableHeader = `
                    <thead>
                        <tr>
                            <th>ID da InstÃ¢ncia</th>
                            <th>Nome da InstÃ¢ncia</th>
                            <th>Tipo</th>
                            <th>Estado</th>
                            <th>Account</th>
                            <th>Region</th>
                            <th>Platform Details</th>
                            <th>Role</th>
                            <th>Status do SSM</th>
                            <th>swoMonitor</th>
                            <th>swoBackup</th>
                            <th>Start-Stop</th>
                            <th>Critical Non-Compliant</th>
                            <th>Security Non-Compliant</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                `;
                table.innerHTML = tableHeader;

                const tableBody = table.querySelector("tbody");

                // Preencher tabela com dados das instÃ¢ncias
                data.Instances.forEach(instance => {
                    const row = document.createElement("tr");

                    row.innerHTML = `
                        <td>${instance.InstanceId}</td>
                        <td>${instance.InstanceName}</td>
                        <td>${instance.InstanceType}</td>
                        <td>${instance.State}</td>
                        <td>${instance.Account}</td>
                        <td>${instance.Region}</td>
                        <td>${instance.PlatformDetails}</td>
                        <td>${instance.Role}</td>
                        <td>${instance.SSMStatus}</td>
                        <td>${instance.swoMonitor}</td>
                        <td>${instance.swoBackup}</td>
                        <td>${instance.StartStop}</td>
                        <td>${instance.CriticalNonCompliantCount}</td>
                        <td>${instance.SecurityNonCompliantCount}</td>
                    `;

                    tableBody.appendChild(row);
                });

                accountSection.appendChild(table);
                document.getElementById("accounts-info").appendChild(accountSection);
            })
            .catch(error => {
                console.error(error.message);
            });
    }

    // Lista dos arquivos JSON no bucket
    const fileNames = [
        'instance-info-927341496435-us-east-1.json',
        'instance-info-065499236641-sa-east-1.json',
        'instance-info-163745212348-sa-east-1.json',
        'instance-info-191711438833-sa-east-1.json',
        'instance-info-278782320818-sa-east-1.json',
        'instance-info-472192891043-sa-east-1.json',
        'instance-info-515123556422-sa-east-1.json',
        'instance-info-784883692064-sa-east-1.json'
    ];

    // Carregar dados de cada arquivo
    fileNames.forEach(fileName => {
        loadInstanceData(fileName);
    });

    // FunÃ§Ã£o para converter tabela HTML em CSV e baixar
    function downloadCSV() {
        let csv = [];
        const tables = document.querySelectorAll(".instances-table");

        tables.forEach(table => {
            const rows = table.querySelectorAll("tr");

            rows.forEach(row => {
                const cells = row.querySelectorAll("th, td");
                let rowContent = Array.from(cells).map(cell => `"${cell.innerText}"`);
                csv.push(rowContent.join(","));
            });
        });

        // Converte o array CSV em uma string
        const csvContent = csv.join("\n");
        
        // Cria um blob para o arquivo CSV e aciona o download
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', 'instances.csv');
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // Adiciona o evento de clique ao botÃ£o de download
    document.getElementById("download-csv").addEventListener("click", downloadCSV);
});
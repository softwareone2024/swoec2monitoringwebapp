document.addEventListener("DOMContentLoaded", function() {
    const bucketUrl = 'http://swoec2monitoringwebapp-fieg.s3-website-sa-east-1.amazonaws.com/';

    function loadInstanceData(fileName) {
        const url = `${bucketUrl}${fileName}?timestamp=${new Date().getTime()}`;

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao carregar as informações das instâncias do arquivo ${fileName}.`);
                }
                return response.json();
            })
            .then(data => {
                // Criar seção para a conta e região
                const accountSection = document.createElement("div");
                accountSection.classList.add("account-section");

                const accountInfo = document.createElement("h3");
                accountInfo.textContent = `Conta: ${data.AccountName} (ID: ${data.AccountId}) - Região: ${data.Region}`;
                accountSection.appendChild(accountInfo);

                const table = document.createElement("table");
                table.classList.add("instances-table");

                const tableHeader = `
                    <thead>
                        <tr>
                            <th>ID da Instância</th>
                            <th>Nome da Instância</th>
                            <th>Tipo</th>
                            <th>Estado</th>
                            <th>Sistema Operacional</th>
                            <th>Role</th>
                            <th>Status do SSM</th>
                            <th>swoMonitor</th>
                            <th>swoBackup</th>
                            <th>Start-Stop</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                `;
                table.innerHTML = tableHeader;

                const tableBody = table.querySelector("tbody");

                // Preencher tabela com dados das instâncias
                data.Instances.forEach(instance => {
                    const row = document.createElement("tr");

                    row.innerHTML = `
                        <td>${instance.InstanceId}</td>
                        <td>${instance.InstanceName}</td>
                        <td>${instance.InstanceType}</td>
                        <td>${instance.State}</td>
                        <td>${instance.OS}</td>
                        <td>${instance.Role}</td>
                        <td>${instance.SSMStatus}</td>
                        <td>${instance.swoMonitor}</td> <!-- Valor da tag swoMonitor -->
                        <td>${instance.swoBackup}</td>  <!-- Valor da tag swoBackup -->
                        <td>${instance.StartStop}</td>  <!-- Status do Start-Stop -->
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
        
        // Adicione outros arquivos JSON aqui
    ];

    // Carregar dados de cada arquivo
    fileNames.forEach(fileName => {
        loadInstanceData(fileName);
    });
});

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
                // Create section for account and region
                const accountSection = document.createElement("div");
                accountSection.classList.add("account-section");

                const accountInfo = document.createElement("h3");
                accountInfo.textContent = `Account: ${data.AccountName} (ID: ${data.AccountId}) - Region: ${data.Region}`;
                accountSection.appendChild(accountInfo);

                const tableContainer = document.createElement("div");
                tableContainer.classList.add("table-container");

                const table = document.createElement("table");
                table.id = `instances-table-${data.AccountId}-${data.Region}`;  // Unique ID for each table
                table.classList.add("instances-table");

                const tableHeader = `
                    <thead>
                        <tr>
                            <th>Instance Id</th>
                            <th>Instance Name</th>
                            <th>Type</th>
                            <th>State</th>
                            <th>Account</th>
                            <th>Region</th>
                            <th>Platform</th>
                            <th>Role</th>
                            <th>Status do SSM</th>
                            <th>swoMonitor</th>
                            <th>swoBackup</th>
                            <th>swoPatch</th>
                            <th>Start-Stop</th>
                            <th>Critical Non-Compliant</th>
                            <th>Security Non-Compliant</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                `;
                table.innerHTML = tableHeader;

                const tableBody = table.querySelector("tbody");

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
                        <td>${instance.swoPatch}</td>
                        <td>${instance.StartStop}</td>
                        <td>${instance.CriticalNonCompliantCount}</td>
                        <td>${instance.SecurityNonCompliantCount}</td>
                    `;

                    tableBody.appendChild(row);
                });

                tableContainer.appendChild(table);
                accountSection.appendChild(tableContainer);
                document.getElementById("accounts-info").appendChild(accountSection);

                // Initialize DataTables for this table after it's appended to the DOM
                $(`#${table.id}`).DataTable();
            })
            .catch(error => {
                console.error(error.message);
            });
    }

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

    fileNames.forEach(fileName => {
        loadInstanceData(fileName);
    });

    function downloadCSV() {
        let csv = [];
        
        // Loop through each DataTable and gather data
        $(".instances-table").each(function() {
            let table = $(this).DataTable(); // Get DataTable instance for each table
            let tableData = table.rows({ search: 'applied' }).data(); // Get all rows with search applied
    
            // Header row
            const headers = [];
            $(this).find("thead th").each(function() {
                headers.push(`"${$(this).text()}"`);
            });
            csv.push(headers.join(","));
    
            // Table rows
            for (let i = 0; i < tableData.length; i++) {
                const row = tableData[i];
                const rowData = [];
                for (let j = 0; j < row.length; j++) {
                    rowData.push(`"${row[j]}"`);
                }
                csv.push(rowData.join(","));
            }
        });
    
        // Convert CSV array to string
        const csvContent = csv.join("\n");
    
        // Create a Blob and trigger download
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

    // Event listener for CSV download
    document.getElementById("download-csv").addEventListener("click", downloadCSV);
});

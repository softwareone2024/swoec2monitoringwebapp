document.addEventListener("DOMContentLoaded", () => {
    const bucketUrl = 'http://swoec2monitoringwebapp-fieg.s3-website-sa-east-1.amazonaws.com/';
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

    const accountsInfoContainer = document.getElementById("accounts-info");

    function fetchData(fileName) {
        const url = `${bucketUrl}${fileName}?timestamp=${new Date().getTime()}`;
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load data from file: ${fileName}`);
                }
                return response.json();
            })
            .catch(error => {
                console.error(error.message);
                alert(`Error fetching data: ${error.message}`);
            });
    }

    function createTable(data) {
        const { AccountId, Region, Instances } = data;

        const section = document.createElement("div");
        section.classList.add("account-section");

        const header = document.createElement("h3");
        header.textContent = `Account: ${data.AccountName} (ID: ${AccountId}) - Region: ${Region}`;
        section.appendChild(header);

        const table = document.createElement("table");
        table.id = `instances-table-${AccountId}-${Region}`;
        table.classList.add("instances-table");

        table.innerHTML = `
            <thead>
                <tr>
                    <th>Instance Id</th>
                    <th>Instance Name</th>
                    <th>Type</th>
                    <th>State</th>
                    <th>Account</th>
                    <th>Account ID</th>
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
            <tbody>
                ${Instances.map(instance => `
                    <tr>
                        <td>${instance.InstanceId}</td>
                        <td>${instance.InstanceName}</td>
                        <td>${instance.InstanceType}</td>
                        <td>${instance.State}</td>
                        <td>${instance.Account}</td>
                        <td>${instance.AccountId}</td>
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
                    </tr>
                `).join("")}
            </tbody>
        `;

        section.appendChild(table);
        accountsInfoContainer.appendChild(section);

        // Initialize DataTables after the table is added to the DOM
        $(`#${table.id}`).DataTable();
    }

    function downloadCSV() {
        const csvData = [];

        // Gather all tables
        document.querySelectorAll(".instances-table").forEach(table => {
            const headers = Array.from(table.querySelectorAll("thead th")).map(th => `"${th.textContent}"`);
            csvData.push(headers.join(","));

            const rows = Array.from(table.querySelectorAll("tbody tr")).map(row => {
                return Array.from(row.cells).map(cell => `"${cell.textContent}"`).join(",");
            });

            csvData.push(...rows);
        });

        const blob = new Blob([csvData.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "instances.csv";
        a.click();

        URL.revokeObjectURL(url);
    }

    // Attach CSV download listener
    document.getElementById("download-csv").addEventListener("click", downloadCSV);

    // Fetch and load data for each file
    Promise.all(fileNames.map(fetchData))
        .then(results => results.filter(Boolean).forEach(createTable));
});